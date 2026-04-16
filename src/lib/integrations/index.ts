import { GoogleBusinessClient } from "./google";
import { YelpClient } from "./yelp";
import { FacebookClient } from "./facebook";
import { AppleMapsClient } from "./apple";
import type { PlatformClient } from "./types";
import { db } from "@/lib/db";

export type { PlatformClient, BusinessInfo, PlatformReview, SyncResult, MenuData } from "./types";
export { GoogleBusinessClient } from "./google";

export async function getPlatformClient(
  platform: string,
  organizationId?: string
): Promise<PlatformClient | null> {
  switch (platform) {
    case "GOOGLE": {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) return null;

      // Try org-level stored credentials first
      if (organizationId) {
        const credential = await db.platformCredential.findUnique({
          where: {
            organizationId_platform: {
              organizationId,
              platform: "GOOGLE",
            },
          },
        });
        if (credential) {
          return new GoogleBusinessClient(
            clientId,
            clientSecret,
            credential.refreshToken
          );
        }
      }

      // Fall back to env var refresh token
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      if (!refreshToken) return null;
      return new GoogleBusinessClient(clientId, clientSecret, refreshToken);
    }

    case "YELP": {
      const apiKey = process.env.YELP_API_KEY;
      if (!apiKey) return null;
      return new YelpClient(apiKey);
    }

    case "FACEBOOK": {
      const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      if (!pageAccessToken) return null;
      return new FacebookClient(pageAccessToken);
    }

    case "APPLE_MAPS": {
      const teamId = process.env.APPLE_TEAM_ID;
      const keyId = process.env.APPLE_KEY_ID;
      const privateKey = process.env.APPLE_PRIVATE_KEY;
      if (!teamId || !keyId || !privateKey) return null;
      return new AppleMapsClient(teamId, keyId, privateKey);
    }

    default:
      return null;
  }
}
