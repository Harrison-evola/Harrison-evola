import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformClient } from "@/lib/integrations";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { z } from "zod";

const respondSchema = z.object({
  text: z.string().min(1).max(5000),
});

// POST /api/reviews/:id/respond
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const review = await db.review.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Save the response locally
    const response = await db.reviewResponse.create({
      data: {
        reviewId: id,
        text: parsed.data.text,
      },
    });

    // Try to push to the platform
    let pushSuccess = false;
    if (review.externalId) {
      const client = await getPlatformClient(review.platform, review.location.organizationId);
      if (client) {
        const result = await client.pushReviewResponse(
          review.externalId,
          parsed.data.text
        );
        pushSuccess = result.success;

        if (result.success) {
          await db.reviewResponse.update({
            where: { id: response.id },
            data: { sentAt: new Date() },
          });

          await db.review.update({
            where: { id },
            data: { respondedAt: new Date() },
          });
        }

        await db.syncLog.create({
          data: {
            locationId: review.locationId,
            action: "PUSH_RESPONSE",
            status: result.success ? "SUCCESS" : "FAILED",
            platform: review.platform,
            error: result.error ?? null,
            completedAt: new Date(),
          },
        });
      }
    }

    // Dispatch webhook
    await dispatchWebhook(review.location.organizationId, "review.responded", {
      reviewId: id,
      locationId: review.locationId,
      platform: review.platform,
      pushedToPlatform: pushSuccess,
    }).catch(() => {});

    return NextResponse.json({
      response,
      pushedToPlatform: pushSuccess,
    });
  } catch (err) {
    console.error("Review respond error:", err);
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    );
  }
}
