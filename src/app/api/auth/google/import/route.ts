import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoogleBusinessClient } from "@/lib/integrations";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const importSchema = z.object({
  accountName: z.string().min(1),
  locations: z.array(
    z.object({
      name: z.string().min(1), // e.g. "locations/67890"
    })
  ).min(1),
});

// POST /api/auth/google/import — Import selected GBP locations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const credential = await db.platformCredential.findUnique({
      where: {
        organizationId_platform: { organizationId: ORG_ID, platform: "GOOGLE" },
      },
    });

    if (!credential) {
      return NextResponse.json({ error: "Google not connected" }, { status: 401 });
    }

    const client = new GoogleBusinessClient(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      credential.refreshToken
    );

    // Save the selected account ID on the credential
    if (!credential.googleAccountId) {
      await db.platformCredential.update({
        where: { id: credential.id },
        data: { googleAccountId: parsed.data.accountName },
      });
    }

    // Ensure org exists
    await db.organization.upsert({
      where: { id: ORG_ID },
      create: { id: ORG_ID, name: "My Organization", slug: "my-org" },
      update: {},
    });

    const results: Array<{
      locationName: string;
      status: "imported" | "skipped" | "error";
      locationId?: string;
      reviewCount?: number;
      error?: string;
    }> = [];

    for (const loc of parsed.data.locations) {
      const fullResourceName = `${parsed.data.accountName}/${loc.name}`;

      try {
        // Check if already imported
        const existing = await db.listing.findFirst({
          where: {
            platform: "GOOGLE",
            externalId: { in: [fullResourceName, loc.name] },
            location: { organizationId: ORG_ID },
          },
        });

        if (existing) {
          results.push({
            locationName: loc.name,
            status: "skipped",
            error: "Already imported",
          });
          continue;
        }

        // Fetch full location details from Google
        const details = await client.getLocationDetails(loc.name);
        if (!details) {
          results.push({
            locationName: loc.name,
            status: "error",
            error: "Could not fetch location details from Google",
          });
          continue;
        }

        const addr = details.storefrontAddress as Record<string, unknown> | undefined;
        const phone = details.phoneNumbers as Record<string, unknown> | undefined;
        const meta = details.metadata as Record<string, unknown> | undefined;
        const latlng = details.latlng as Record<string, number> | undefined;
        const hoursPeriods = (details.regularHours as Record<string, unknown>)?.periods;

        const title = (details.title as string) ?? "Unnamed Location";
        const addressLines = (addr?.addressLines as string[]) ?? [];

        // Generate a unique slug
        let slug = slugify(title);
        let slugSuffix = 1;
        while (true) {
          const slugExists = await db.location.findUnique({
            where: { organizationId_slug: { organizationId: ORG_ID, slug } },
          });
          if (!slugExists) break;
          slugSuffix++;
          slug = `${slugify(title)}-${slugSuffix}`;
        }

        // Parse business hours
        const parsedHours = client.parseGoogleHours(
          (hoursPeriods as Array<{
            openDay: string;
            openTime: { hours: number; minutes: number };
            closeDay: string;
            closeTime: { hours: number; minutes: number };
          }>) ?? []
        );

        // Create Location
        const location = await db.location.create({
          data: {
            organizationId: ORG_ID,
            name: title,
            slug,
            address: addressLines[0] ?? "",
            address2: addressLines[1] ?? null,
            city: (addr?.locality as string) ?? "",
            state: (addr?.administrativeArea as string) ?? "",
            zip: (addr?.postalCode as string) ?? "",
            country: (addr?.regionCode as string) ?? "US",
            phone: (phone?.primaryPhone as string) ?? null,
            website: (details.websiteUri as string) ?? null,
            latitude: latlng?.latitude ?? null,
            longitude: latlng?.longitude ?? null,
            hours: {
              create: parsedHours.map((h) => ({
                dayOfWeek: h.dayOfWeek,
                openTime: h.isClosed ? null : h.openTime,
                closeTime: h.isClosed ? null : h.closeTime,
                isClosed: h.isClosed,
              })),
            },
          },
        });

        // Create Listing linked to Google
        await db.listing.create({
          data: {
            locationId: location.id,
            platform: "GOOGLE",
            externalId: fullResourceName,
            status: "SYNCED",
            lastSyncedAt: new Date(),
            profileUrl: (meta?.mapsUri as string) ?? null,
            platformData: {
              placeId: meta?.placeId ?? null,
              categories: details.categories ?? null,
            },
          },
        });

        // Pull reviews
        let reviewCount = 0;
        try {
          const reviews = await client.pullReviews(fullResourceName);
          for (const review of reviews) {
            await db.review.upsert({
              where: {
                platform_externalId: {
                  platform: "GOOGLE",
                  externalId: review.externalId,
                },
              },
              create: {
                locationId: location.id,
                platform: "GOOGLE",
                externalId: review.externalId,
                authorName: review.authorName,
                authorAvatar: review.authorAvatar ?? null,
                rating: review.rating,
                text: review.text ?? null,
                publishedAt: review.publishedAt,
                sentiment:
                  review.rating >= 4
                    ? "positive"
                    : review.rating === 3
                    ? "neutral"
                    : "negative",
                sentimentScore: (review.rating - 3) / 2,
              },
              update: {},
            });
            reviewCount++;
          }
        } catch (err) {
          console.error(`Failed to pull reviews for ${loc.name}:`, err);
        }

        // Create sync log
        await db.syncLog.create({
          data: {
            locationId: location.id,
            action: "PULL_LISTING",
            status: "SUCCESS",
            platform: "GOOGLE",
            details: { reviewCount, source: "google_import" },
            completedAt: new Date(),
          },
        });

        // Dispatch webhook
        await dispatchWebhook(ORG_ID, "location.created", {
          locationId: location.id,
          name: title,
          platform: "GOOGLE",
          reviewCount,
        }).catch(() => {});

        results.push({
          locationName: loc.name,
          status: "imported",
          locationId: location.id,
          reviewCount,
        });
      } catch (err) {
        console.error(`Import error for ${loc.name}:`, err);
        results.push({
          locationName: loc.name,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const imported = results.filter((r) => r.status === "imported");
    const skipped = results.filter((r) => r.status === "skipped");
    const errors = results.filter((r) => r.status === "error");

    return NextResponse.json({
      imported: imported.map((r) => ({
        locationId: r.locationId,
        name: r.locationName,
        reviewCount: r.reviewCount,
      })),
      skipped: skipped.map((r) => r.locationName),
      errors: errors.map((r) => ({
        name: r.locationName,
        error: r.error,
      })),
      summary: `${imported.length} imported, ${skipped.length} skipped, ${errors.length} errors`,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
