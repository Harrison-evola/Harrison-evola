import type { BusinessInfo, PlatformClient, PlatformReview, SyncResult, MenuData } from "./types";

/**
 * Google Business Profile API client.
 *
 * Requires:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN (OAuth 2.0)
 *
 * API docs: https://developers.google.com/my-business/reference/rest
 */
export class GoogleBusinessClient implements PlatformClient {
  readonly platform = "GOOGLE";
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private refreshToken: string
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      throw new Error(`Google OAuth refresh failed: ${res.status}`);
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  private async request(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async pushListing(externalId: string | null, data: BusinessInfo): Promise<SyncResult> {
    try {
      const locationData = {
        title: data.name,
        storefrontAddress: {
          addressLines: [data.address, data.address2].filter(Boolean),
          locality: data.city,
          administrativeArea: data.state,
          postalCode: data.zip,
          regionCode: data.country,
        },
        phoneNumbers: data.phone ? { primaryPhone: data.phone } : undefined,
        websiteUri: data.website,
        latlng: data.latitude && data.longitude
          ? { latitude: data.latitude, longitude: data.longitude }
          : undefined,
        regularHours: {
          periods: data.hours
            .filter((h) => !h.isClosed && h.openTime && h.closeTime)
            .map((h) => ({
              openDay: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][h.dayOfWeek],
              openTime: { hours: parseInt(h.openTime!.split(":")[0]), minutes: parseInt(h.openTime!.split(":")[1]) },
              closeDay: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][h.dayOfWeek],
              closeTime: { hours: parseInt(h.closeTime!.split(":")[0]), minutes: parseInt(h.closeTime!.split(":")[1]) },
            })),
        },
      };

      if (externalId) {
        // Update existing location
        const res = await this.request(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${externalId}?updateMask=title,storefrontAddress,phoneNumbers,websiteUri,regularHours`,
          { method: "PATCH", body: JSON.stringify(locationData) }
        );

        if (!res.ok) {
          const err = await res.text();
          return { success: false, error: `Google update failed: ${err}` };
        }

        return { success: true, externalId };
      } else {
        // Create — requires account ID
        // In practice, you'd list accounts first via accounts.list
        return {
          success: false,
          error: "Creating new Google Business listings requires account selection. Connect via OAuth flow first.",
        };
      }
    } catch (err) {
      return { success: false, error: `Google push error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async pullListing(externalId: string): Promise<BusinessInfo | null> {
    try {
      const res = await this.request(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${externalId}?readMask=title,storefrontAddress,phoneNumbers,websiteUri,regularHours,latlng`
      );

      if (!res.ok) return null;

      const loc = await res.json();
      return {
        name: loc.title,
        address: loc.storefrontAddress?.addressLines?.[0] ?? "",
        address2: loc.storefrontAddress?.addressLines?.[1],
        city: loc.storefrontAddress?.locality ?? "",
        state: loc.storefrontAddress?.administrativeArea ?? "",
        zip: loc.storefrontAddress?.postalCode ?? "",
        country: loc.storefrontAddress?.regionCode ?? "US",
        phone: loc.phoneNumbers?.primaryPhone,
        website: loc.websiteUri,
        latitude: loc.latlng?.latitude,
        longitude: loc.latlng?.longitude,
        hours: this.parseGoogleHours(loc.regularHours?.periods ?? []),
      };
    } catch {
      return null;
    }
  }

  private parseGoogleHours(periods: Array<{
    openDay: string;
    openTime: { hours: number; minutes: number };
    closeDay: string;
    closeTime: { hours: number; minutes: number };
  }>): BusinessInfo["hours"] {
    const dayMap: Record<string, number> = {
      SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
    };

    const hours = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: null as string | null,
      closeTime: null as string | null,
      isClosed: true,
    }));

    for (const period of periods) {
      const dayIndex = dayMap[period.openDay];
      if (dayIndex !== undefined) {
        hours[dayIndex] = {
          dayOfWeek: dayIndex,
          openTime: `${String(period.openTime.hours).padStart(2, "0")}:${String(period.openTime.minutes).padStart(2, "0")}`,
          closeTime: `${String(period.closeTime.hours).padStart(2, "0")}:${String(period.closeTime.minutes).padStart(2, "0")}`,
          isClosed: false,
        };
      }
    }

    return hours;
  }

  async verifyConnection(credentials: Record<string, string>): Promise<boolean> {
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: credentials.clientId ?? this.clientId,
          client_secret: credentials.clientSecret ?? this.clientSecret,
          refresh_token: credentials.refreshToken ?? this.refreshToken,
          grant_type: "refresh_token",
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async pullReviews(externalId: string, since?: Date): Promise<PlatformReview[]> {
    try {
      const res = await this.request(
        `https://mybusiness.googleapis.com/v4/${externalId}/reviews?pageSize=50`
      );

      if (!res.ok) return [];

      const data = await res.json();
      const reviews: PlatformReview[] = (data.reviews ?? []).map(
        (r: { reviewId: string; reviewer: { displayName: string; profilePhotoUrl?: string }; starRating: string; comment?: string; createTime: string }) => ({
          externalId: r.reviewId,
          authorName: r.reviewer?.displayName ?? "Anonymous",
          authorAvatar: r.reviewer?.profilePhotoUrl,
          rating: this.parseStarRating(r.starRating),
          text: r.comment,
          publishedAt: new Date(r.createTime),
        })
      );

      if (since) {
        return reviews.filter((r) => r.publishedAt >= since);
      }
      return reviews;
    } catch {
      return [];
    }
  }

  private parseStarRating(rating: string): number {
    const map: Record<string, number> = {
      ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    };
    return map[rating] ?? 0;
  }

  async pushReviewResponse(reviewExternalId: string, responseText: string): Promise<SyncResult> {
    try {
      const res = await this.request(
        `https://mybusiness.googleapis.com/v4/${reviewExternalId}/reply`,
        { method: "PUT", body: JSON.stringify({ comment: responseText }) }
      );

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Failed to post reply: ${err}` };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: `Reply error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async pushMenu(externalId: string, menu: MenuData): Promise<SyncResult> {
    try {
      // Google Business Profile uses the Food Menu API
      const foodMenus = {
        menus: [
          {
            menuId: "primary",
            displayName: menu.name,
            sections: menu.sections.map((section) => ({
              displayName: section.name,
              items: section.items.map((item) => ({
                displayName: item.name,
                description: item.description,
                price: {
                  currencyCode: "USD",
                  units: Math.floor(item.price / 100),
                  nanos: (item.price % 100) * 10000000,
                },
                dietaryRestrictions: (item.dietaryTags ?? []).map((tag) => ({
                  dietaryRestriction: tag.toUpperCase().replace(/[- ]/g, "_"),
                })),
              })),
            })),
          },
        ],
      };

      const res = await this.request(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${externalId}/foodMenus`,
        { method: "PATCH", body: JSON.stringify(foodMenus) }
      );

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Menu push failed: ${err}` };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: `Menu push error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}
