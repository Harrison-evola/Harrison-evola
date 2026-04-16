import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";
const SCOPE = "https://www.googleapis.com/auth/business.manage";

function signState(payload: string): string {
  return createHmac("sha256", GOOGLE_CLIENT_SECRET)
    .update(payload)
    .digest("hex");
}

// GET /api/auth/google — Redirect to Google OAuth consent screen
export async function GET(_req: NextRequest) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString("hex");
  const cookiePayload = JSON.stringify({ orgId: ORG_ID, state });
  const signature = signState(cookiePayload);
  const cookieValue = `${signature}.${Buffer.from(cookiePayload).toString("base64")}`;

  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
