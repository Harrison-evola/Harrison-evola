import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";

// GET /api/auth/google/status — Check if Google is connected
export async function GET() {
  const credential = await db.platformCredential.findUnique({
    where: {
      organizationId_platform: { organizationId: ORG_ID, platform: "GOOGLE" },
    },
  });

  if (!credential) {
    return NextResponse.json({
      connected: false,
      email: null,
      connectedAt: null,
      locationCount: 0,
    });
  }

  const locationCount = await db.listing.count({
    where: {
      platform: "GOOGLE",
      location: { organizationId: ORG_ID },
    },
  });

  return NextResponse.json({
    connected: true,
    email: credential.googleEmail,
    connectedAt: credential.connectedAt.toISOString(),
    locationCount,
  });
}
