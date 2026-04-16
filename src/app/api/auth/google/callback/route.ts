import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function verifyState(cookieValue: string): { orgId: string; state: string } | null {
  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex === -1) return null;

  const signature = cookieValue.slice(0, dotIndex);
  const payloadB64 = cookieValue.slice(dotIndex + 1);
  const payload = Buffer.from(payloadB64, "base64").toString("utf-8");

  const expected = createHmac("sha256", GOOGLE_CLIENT_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expected) return null;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// GET /api/auth/google/callback?code=...&state=...
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user denial
  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/settings?tab=platforms&google=error&reason=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}/settings?tab=platforms&google=error&reason=missing_params`
    );
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("google_oauth_state")?.value;
  if (!stateCookie) {
    return NextResponse.redirect(
      `${APP_URL}/settings?tab=platforms&google=error&reason=no_state_cookie`
    );
  }

  const parsed = verifyState(stateCookie);
  if (!parsed || parsed.state !== state) {
    return NextResponse.redirect(
      `${APP_URL}/settings?tab=platforms&google=error&reason=state_mismatch`
    );
  }

  const orgId = parsed.orgId;

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Google token exchange failed:", err);
    return NextResponse.redirect(
      `${APP_URL}/settings?tab=platforms&google=error&reason=token_exchange_failed`
    );
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;

  if (!refresh_token) {
    console.error("No refresh token returned. Did you set prompt=consent?");
    return NextResponse.redirect(
      `${APP_URL}/settings?tab=platforms&google=error&reason=no_refresh_token`
    );
  }

  const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

  // Fetch the user's Google email from accounts list
  let googleEmail: string | null = null;
  try {
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (accountsRes.ok) {
      const accountsData = await accountsRes.json();
      const firstAccount = accountsData.accounts?.[0];
      googleEmail = firstAccount?.accountName ?? null;
    }
  } catch {
    // Non-critical — we'll just not have the email label
  }

  // Ensure org exists
  await db.organization.upsert({
    where: { id: orgId },
    create: { id: orgId, name: "My Organization", slug: "my-org" },
    update: {},
  });

  // Upsert the platform credential
  await db.platformCredential.upsert({
    where: {
      organizationId_platform: { organizationId: orgId, platform: "GOOGLE" },
    },
    create: {
      organizationId: orgId,
      platform: "GOOGLE",
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt,
      googleEmail,
    },
    update: {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt,
      googleEmail,
      connectedAt: new Date(),
    },
  });

  // Clear state cookie
  cookieStore.delete("google_oauth_state");

  return NextResponse.redirect(
    `${APP_URL}/settings?tab=platforms&google=connected`
  );
}
