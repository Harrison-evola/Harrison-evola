import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { z } from "zod";
import { WEBHOOK_EVENTS } from "@/lib/types";

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

// GET /api/webhooks - List webhook configs
export async function GET() {
  const configs = await db.webhookConfig.findMany({
    where: { organizationId: ORG_ID },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          event: true,
          statusCode: true,
          deliveredAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Don't expose secrets
  const safe = configs.map(({ secret, ...rest }) => ({
    ...rest,
    hasSecret: true,
  }));

  return NextResponse.json(safe);
}

// POST /api/webhooks - Create webhook config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Ensure org exists
    await db.organization.upsert({
      where: { id: ORG_ID },
      create: { id: ORG_ID, name: "My Organization", slug: "my-org" },
      update: {},
    });

    const secret = randomBytes(32).toString("hex");

    const config = await db.webhookConfig.create({
      data: {
        organizationId: ORG_ID,
        url: parsed.data.url,
        events: parsed.data.events,
        secret,
      },
    });

    // Return secret only on creation (user should save it)
    return NextResponse.json(
      { ...config, secret },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create webhook error:", err);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks?id=xxx - Delete webhook config
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await db.webhookConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
