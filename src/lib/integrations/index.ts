import { GoogleBusinessClient } from "./google";
import { YelpClient } from "./yelp";
import { FacebookClient } from "./facebook";
import { AppleMapsClient } from "./apple";
import type { PlatformClient } from "./types";

export type { PlatformClient, BusinessInfo, PlatformReview, SyncResult, MenuData } from "./types";

export function getPlatformClient(platform: string): PlatformClient | null {
  switch (platform) {
    case "GOOGLE": {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      if (!clientId || !clientSecret || !refreshToken) return null;
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
