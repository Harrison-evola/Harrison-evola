import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoogleBusinessClient } from "@/lib/integrations";

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// GET /api/auth/google/accounts — List GBP accounts and their locations
export async function GET() {
  const credential = await db.platformCredential.findUnique({
    where: {
      organizationId_platform: { organizationId: ORG_ID, platform: "GOOGLE" },
    },
  });

  if (!credential) {
    return NextResponse.json(
      { error: "Google not connected. Complete the OAuth flow first." },
      { status: 401 }
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth not configured." },
      { status: 500 }
    );
  }

  const client = new GoogleBusinessClient(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    credential.refreshToken
  );

  // Fetch accounts
  const accounts = await client.listAccounts();
  if (accounts.length === 0) {
    return NextResponse.json({
      accounts: [],
      message: "No Google Business Profile accounts found for this Google account.",
    });
  }

  // Fetch locations for each account + check which are already imported
  const existingListings = await db.listing.findMany({
    where: {
      platform: "GOOGLE",
      location: { organizationId: ORG_ID },
    },
    select: { externalId: true },
  });
  const importedExternalIds = new Set(
    existingListings.map((l) => l.externalId).filter(Boolean)
  );

  const accountsWithLocations = await Promise.all(
    accounts.map(async (account) => {
      const locations = await client.listLocations(account.name);

      return {
        name: account.name,
        accountName: account.accountName,
        type: account.type,
        locations: locations.map((loc) => {
          const locationName = loc.name as string;
          const fullResourceName = `${account.name}/${locationName}`;
          const addr = loc.storefrontAddress as Record<string, unknown> | undefined;
          const phone = loc.phoneNumbers as Record<string, unknown> | undefined;
          const meta = loc.metadata as Record<string, unknown> | undefined;

          return {
            name: locationName,
            fullResourceName,
            title: (loc.title as string) ?? "",
            address: formatAddress(addr),
            phone: (phone?.primaryPhone as string) ?? null,
            website: (loc.websiteUri as string) ?? null,
            mapsUri: (meta?.mapsUri as string) ?? null,
            placeId: (meta?.placeId as string) ?? null,
            alreadyImported:
              importedExternalIds.has(fullResourceName) ||
              importedExternalIds.has(locationName),
          };
        }),
      };
    })
  );

  return NextResponse.json({ accounts: accountsWithLocations });
}

function formatAddress(addr: Record<string, unknown> | undefined): string {
  if (!addr) return "";
  const lines = (addr.addressLines as string[]) ?? [];
  const parts = [
    ...lines,
    addr.locality as string,
    addr.administrativeArea as string,
    addr.postalCode as string,
  ].filter(Boolean);
  return parts.join(", ");
}
