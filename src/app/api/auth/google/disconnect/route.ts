import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";

// POST /api/auth/google/disconnect — Revoke tokens and delete credential
export async function POST() {
  const credential = await db.platformCredential.findUnique({
    where: {
      organizationId_platform: { organizationId: ORG_ID, platform: "GOOGLE" },
    },
  });

  if (!credential) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  // Attempt to revoke the token with Google (best-effort)
  try {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${credential.refreshToken}`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
  } catch {
    // Non-critical — token may already be invalid
  }

  // Delete the credential record
  await db.platformCredential.delete({
    where: { id: credential.id },
  });

  return NextResponse.json({ success: true });
}
