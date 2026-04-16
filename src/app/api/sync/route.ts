import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformClient } from "@/lib/integrations";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { z } from "zod";

const syncSchema = z.object({
  locationId: z.string().optional(),
  listingId: z.string().optional(),
  action: z.enum(["push_listing", "pull_reviews", "push_menu"]),
});

// POST /api/sync - Trigger a sync operation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    if (action === "push_listing") {
      return handlePushListing(parsed.data.listingId);
    }

    if (action === "pull_reviews") {
      return handlePullReviews(parsed.data.locationId);
    }

    if (action === "push_menu") {
      return handlePushMenu(parsed.data.locationId);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

async function handlePushListing(listingId?: string) {
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { location: { include: { hours: true, organization: true } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const client = await getPlatformClient(listing.platform, listing.location.organizationId);
  if (!client) {
    return NextResponse.json(
      { error: `No API client configured for ${listing.platform}. Check environment variables.` },
      { status: 400 }
    );
  }

  // Mark as syncing
  await db.listing.update({
    where: { id: listingId },
    data: { status: "SYNCING" },
  });

  const loc = listing.location;
  const result = await client.pushListing(listing.externalId, {
    name: loc.name,
    address: loc.address,
    address2: loc.address2 ?? undefined,
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
    country: loc.country,
    phone: loc.phone ?? undefined,
    website: loc.website ?? undefined,
    latitude: loc.latitude ?? undefined,
    longitude: loc.longitude ?? undefined,
    hours: loc.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    })),
  });

  await db.listing.update({
    where: { id: listingId },
    data: {
      status: result.success ? "SYNCED" : "ERROR",
      lastSyncedAt: result.success ? new Date() : undefined,
      lastError: result.error ?? null,
      externalId: result.externalId ?? listing.externalId,
      profileUrl: result.profileUrl ?? listing.profileUrl,
    },
  });

  await db.syncLog.create({
    data: {
      locationId: loc.id,
      listingId,
      action: "PUSH_LISTING",
      status: result.success ? "SUCCESS" : "FAILED",
      platform: listing.platform,
      error: result.error ?? null,
      completedAt: new Date(),
    },
  });

  await dispatchWebhook(loc.organizationId, result.success ? "listing.synced" : "listing.error", {
    locationId: loc.id,
    listingId,
    platform: listing.platform,
    error: result.error,
  }).catch(() => {});

  return NextResponse.json({ success: result.success, error: result.error });
}

async function handlePullReviews(locationId?: string) {
  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  const listings = await db.listing.findMany({
    where: { locationId, externalId: { not: null }, status: { in: ["SYNCED", "CONNECTED"] } },
    include: { location: { include: { organization: true } } },
  });

  let totalNew = 0;

  for (const listing of listings) {
    const client = await getPlatformClient(listing.platform, listing.location.organizationId);
    if (!client || !listing.externalId) continue;

    const lastReview = await db.review.findFirst({
      where: { locationId, platform: listing.platform },
      orderBy: { publishedAt: "desc" },
    });

    const reviews = await client.pullReviews(
      listing.externalId,
      lastReview?.publishedAt ?? undefined
    );

    for (const review of reviews) {
      await db.review.upsert({
        where: {
          platform_externalId: {
            platform: listing.platform,
            externalId: review.externalId,
          },
        },
        create: {
          locationId,
          platform: listing.platform,
          externalId: review.externalId,
          authorName: review.authorName,
          authorAvatar: review.authorAvatar ?? null,
          rating: review.rating,
          text: review.text ?? null,
          publishedAt: review.publishedAt,
          sentiment: review.rating >= 4 ? "positive" : review.rating === 3 ? "neutral" : "negative",
          sentimentScore: (review.rating - 3) / 2,
        },
        update: {},
      });
      totalNew++;
    }

    await db.syncLog.create({
      data: {
        locationId,
        listingId: listing.id,
        action: "PULL_REVIEWS",
        status: "SUCCESS",
        platform: listing.platform,
        details: { reviewCount: reviews.length },
        completedAt: new Date(),
      },
    });

    if (reviews.length > 0 && listing.location.organization) {
      await dispatchWebhook(listing.location.organizationId, "review.created", {
        locationId,
        platform: listing.platform,
        count: reviews.length,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, newReviews: totalNew });
}

async function handlePushMenu(locationId?: string) {
  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  const menus = await db.menu.findMany({
    where: { locationId, isActive: true },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            where: { isAvailable: true },
            include: { dietaryTags: true },
          },
        },
      },
    },
  });

  const listings = await db.listing.findMany({
    where: { locationId, externalId: { not: null }, status: { in: ["SYNCED", "CONNECTED"] } },
    include: { location: { include: { organization: true } } },
  });

  const results: Array<{ platform: string; success: boolean; error?: string }> = [];

  for (const listing of listings) {
    const client = await getPlatformClient(listing.platform, listing.location.organizationId);
    if (!client?.pushMenu || !listing.externalId) continue;

    for (const menu of menus) {
      const result = await client.pushMenu(listing.externalId, {
        name: menu.name,
        sections: menu.sections.map((s) => ({
          name: s.name,
          items: s.items.map((item) => ({
            name: item.name,
            description: item.description ?? undefined,
            price: item.price,
            dietaryTags: item.dietaryTags.map((t) => t.name),
          })),
        })),
      });

      results.push({
        platform: listing.platform,
        success: result.success,
        error: result.error,
      });

      await db.syncLog.create({
        data: {
          locationId,
          listingId: listing.id,
          action: "PUSH_MENU",
          status: result.success ? "SUCCESS" : "FAILED",
          platform: listing.platform,
          error: result.error ?? null,
          completedAt: new Date(),
        },
      });
    }

    if (listing.location.organization) {
      await dispatchWebhook(listing.location.organizationId, "menu.synced", {
        locationId,
        platform: listing.platform,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, results });
}
