import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformClient } from "@/lib/integrations";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { z } from "zod";

const connectListingSchema = z.object({
  platform: z.enum(["GOOGLE", "YELP", "FACEBOOK", "APPLE_MAPS", "TRIPADVISOR", "DOORDASH", "UBEREATS", "GRUBHUB"]),
  externalId: z.string().optional(),
});

// GET /api/locations/:id/listings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listings = await db.listing.findMany({
    where: { locationId: id },
    include: {
      syncLogs: { orderBy: { startedAt: "desc" }, take: 5 },
    },
    orderBy: { platform: "asc" },
  });

  return NextResponse.json(listings);
}

// POST /api/locations/:id/listings - Connect a platform
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = connectListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const location = await db.location.findUnique({
      where: { id },
      include: { hours: true, organization: true },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Check if already connected
    const existing = await db.listing.findUnique({
      where: { locationId_platform: { locationId: id, platform: parsed.data.platform } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Platform already connected" },
        { status: 409 }
      );
    }

    const listing = await db.listing.create({
      data: {
        locationId: id,
        platform: parsed.data.platform,
        externalId: parsed.data.externalId ?? null,
        status: parsed.data.externalId ? "CONNECTED" : "DISCONNECTED",
      },
    });

    // If externalId provided, try initial sync
    if (parsed.data.externalId) {
      const client = await getPlatformClient(parsed.data.platform, location.organizationId);
      if (client) {
        const result = await client.pushListing(parsed.data.externalId, {
          name: location.name,
          address: location.address,
          address2: location.address2 ?? undefined,
          city: location.city,
          state: location.state,
          zip: location.zip,
          country: location.country,
          phone: location.phone ?? undefined,
          website: location.website ?? undefined,
          hours: location.hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })),
        });

        await db.listing.update({
          where: { id: listing.id },
          data: {
            status: result.success ? "SYNCED" : "ERROR",
            lastSyncedAt: result.success ? new Date() : undefined,
            lastError: result.error ?? null,
            profileUrl: result.profileUrl ?? null,
          },
        });

        await db.syncLog.create({
          data: {
            locationId: id,
            listingId: listing.id,
            action: "PUSH_LISTING",
            status: result.success ? "SUCCESS" : "FAILED",
            platform: parsed.data.platform,
            error: result.error ?? null,
            completedAt: new Date(),
          },
        });

        // Dispatch webhook
        await dispatchWebhook(location.organizationId, "listing.synced", {
          locationId: id,
          platform: parsed.data.platform,
          status: result.success ? "synced" : "error",
        }).catch(() => {}); // Non-blocking
      }
    }

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("Connect listing error:", err);
    return NextResponse.json(
      { error: "Failed to connect platform" },
      { status: 500 }
    );
  }
}
