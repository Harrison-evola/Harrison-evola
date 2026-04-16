import type { BusinessInfo, PlatformClient, PlatformReview, SyncResult } from "./types";

/**
 * Facebook/Meta Graph API client for Facebook Pages.
 *
 * Requires:
 * - FACEBOOK_PAGE_ACCESS_TOKEN (Page-scoped access token with manage_pages permission)
 *
 * API docs: https://developers.facebook.com/docs/graph-api
 */
export class FacebookClient implements PlatformClient {
  readonly platform = "FACEBOOK";
  private baseUrl = "https://graph.facebook.com/v19.0";

  constructor(private pageAccessToken: string) {}

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const separator = path.includes("?") ? "&" : "?";
    return fetch(`${this.baseUrl}${path}${separator}access_token=${this.pageAccessToken}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async pushListing(externalId: string | null, data: BusinessInfo): Promise<SyncResult> {
    if (!externalId) {
      return {
        success: false,
        error: "Facebook Pages must be created through Facebook. Connect an existing page by providing its Page ID.",
      };
    }

    try {
      const updateData: Record<string, unknown> = {};

      if (data.phone) updateData.phone = data.phone;
      if (data.website) updateData.website = data.website;
      if (data.address) {
        updateData.location = {
          street: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          country: data.country,
        };
      }

      // Update business hours
      const hours: Record<string, string> = {};
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      for (const h of data.hours) {
        if (h.isClosed || !h.openTime || !h.closeTime) continue;
        const day = dayNames[h.dayOfWeek];
        hours[`${day}_1_open`] = h.openTime.replace(":", "");
        hours[`${day}_1_close`] = h.closeTime.replace(":", "");
      }
      if (Object.keys(hours).length > 0) {
        updateData.hours = hours;
      }

      const res = await this.request(`/${externalId}`, {
        method: "POST",
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const err = await res.json();
        return {
          success: false,
          error: `Facebook update failed: ${err.error?.message ?? res.status}`,
        };
      }

      return {
        success: true,
        externalId,
        profileUrl: `https://facebook.com/${externalId}`,
      };
    } catch (err) {
      return { success: false, error: `Facebook push error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async pullListing(externalId: string): Promise<BusinessInfo | null> {
    try {
      const res = await this.request(
        `/${externalId}?fields=name,phone,website,location,hours,single_line_address`
      );
      if (!res.ok) return null;

      const page = await res.json();
      return {
        name: page.name ?? "",
        address: page.location?.street ?? "",
        city: page.location?.city ?? "",
        state: page.location?.state ?? "",
        zip: page.location?.zip ?? "",
        country: page.location?.country ?? "US",
        phone: page.phone,
        website: page.website,
        latitude: page.location?.latitude,
        longitude: page.location?.longitude,
        hours: this.parseFacebookHours(page.hours ?? {}),
      };
    } catch {
      return null;
    }
  }

  private parseFacebookHours(fbHours: Record<string, string>): BusinessInfo["hours"] {
    const dayMap: Record<string, number> = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    };

    const hours = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: null as string | null,
      closeTime: null as string | null,
      isClosed: true,
    }));

    for (const [key, value] of Object.entries(fbHours)) {
      const match = key.match(/^(\w{3})_1_(open|close)$/);
      if (!match) continue;
      const dayIndex = dayMap[match[1]];
      if (dayIndex === undefined) continue;

      const timeStr = `${value.slice(0, 2)}:${value.slice(2)}`;
      if (match[2] === "open") {
        hours[dayIndex].openTime = timeStr;
        hours[dayIndex].isClosed = false;
      } else {
        hours[dayIndex].closeTime = timeStr;
      }
    }

    return hours;
  }

  async verifyConnection(_credentials: Record<string, string>): Promise<boolean> {
    try {
      const res = await this.request("/me?fields=id,name");
      return res.ok;
    } catch {
      return false;
    }
  }

  async pullReviews(externalId: string, since?: Date): Promise<PlatformReview[]> {
    try {
      const res = await this.request(
        `/${externalId}/ratings?fields=reviewer,rating,review_text,created_time&limit=50`
      );
      if (!res.ok) return [];

      const data = await res.json();
      const reviews: PlatformReview[] = (data.data ?? []).map(
        (r: { reviewer: { id: string; name: string }; rating: number; review_text?: string; created_time: string }) => ({
          externalId: `${externalId}_${r.reviewer.id}`,
          authorName: r.reviewer?.name ?? "Facebook User",
          rating: r.rating,
          text: r.review_text,
          publishedAt: new Date(r.created_time),
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

  async pushReviewResponse(reviewExternalId: string, responseText: string): Promise<SyncResult> {
    try {
      const res = await this.request(`/${reviewExternalId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: responseText }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: `Reply failed: ${err.error?.message ?? res.status}` };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: `Reply error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}
