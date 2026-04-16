import type { BusinessInfo, PlatformClient, PlatformReview, SyncResult } from "./types";

/**
 * Yelp Fusion API client.
 *
 * Requires:
 * - YELP_API_KEY (Yelp Fusion API key)
 *
 * Note: Yelp's API is primarily read-only for business data. Listing updates
 * must be submitted through Yelp for Business Owners or Yelp's Data Ingestion API
 * (partner access required).
 *
 * API docs: https://docs.developer.yelp.com/reference
 */
export class YelpClient implements PlatformClient {
  readonly platform = "YELP";
  private baseUrl = "https://api.yelp.com/v3";

  constructor(private apiKey: string) {}

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async pushListing(_externalId: string | null, _data: BusinessInfo): Promise<SyncResult> {
    // Yelp doesn't have a public write API for business listings.
    // Updates go through Yelp for Business Owners portal or Data Ingestion API (partner-only).
    return {
      success: false,
      error: "Yelp does not support direct listing updates via API. Use Yelp for Business Owners portal or apply for Data Ingestion API access.",
    };
  }

  async pullListing(externalId: string): Promise<BusinessInfo | null> {
    try {
      const res = await this.request(`/businesses/${externalId}`);
      if (!res.ok) return null;

      const biz = await res.json();
      return {
        name: biz.name,
        address: biz.location?.address1 ?? "",
        address2: biz.location?.address2,
        city: biz.location?.city ?? "",
        state: biz.location?.state ?? "",
        zip: biz.location?.zip_code ?? "",
        country: biz.location?.country ?? "US",
        phone: biz.display_phone,
        website: biz.url,
        latitude: biz.coordinates?.latitude,
        longitude: biz.coordinates?.longitude,
        hours: this.parseYelpHours(biz.hours?.[0]?.open ?? []),
      };
    } catch {
      return null;
    }
  }

  private parseYelpHours(openHours: Array<{
    day: number;
    start: string;
    end: string;
  }>): BusinessInfo["hours"] {
    const hours = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: null as string | null,
      closeTime: null as string | null,
      isClosed: true,
    }));

    for (const h of openHours) {
      hours[h.day] = {
        dayOfWeek: h.day,
        openTime: `${h.start.slice(0, 2)}:${h.start.slice(2)}`,
        closeTime: `${h.end.slice(0, 2)}:${h.end.slice(2)}`,
        isClosed: false,
      };
    }

    return hours;
  }

  async verifyConnection(_credentials: Record<string, string>): Promise<boolean> {
    try {
      const res = await this.request("/businesses/search?term=test&location=NYC&limit=1");
      return res.ok;
    } catch {
      return false;
    }
  }

  async pullReviews(externalId: string, since?: Date): Promise<PlatformReview[]> {
    try {
      const res = await this.request(`/businesses/${externalId}/reviews?limit=50&sort_by=newest`);
      if (!res.ok) return [];

      const data = await res.json();
      const reviews: PlatformReview[] = (data.reviews ?? []).map(
        (r: { id: string; user: { name: string; image_url?: string }; rating: number; text?: string; time_created: string }) => ({
          externalId: r.id,
          authorName: r.user?.name ?? "Anonymous",
          authorAvatar: r.user?.image_url,
          rating: r.rating,
          text: r.text,
          publishedAt: new Date(r.time_created),
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

  async pushReviewResponse(_reviewExternalId: string, _responseText: string): Promise<SyncResult> {
    // Yelp review responses require Yelp for Business Owners access
    return {
      success: false,
      error: "Yelp review responses must be submitted through Yelp for Business Owners.",
    };
  }

  /**
   * Search for a business on Yelp to find its external ID.
   * Useful when connecting a new location to Yelp.
   */
  async searchBusiness(name: string, location: string): Promise<Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
    rating: number;
    reviewCount: number;
  }>> {
    try {
      const params = new URLSearchParams({ term: name, location, limit: "5" });
      const res = await this.request(`/businesses/search?${params}`);
      if (!res.ok) return [];

      const data = await res.json();
      return (data.businesses ?? []).map(
        (b: { id: string; name: string; location: { display_address: string[] }; display_phone: string; rating: number; review_count: number }) => ({
          id: b.id,
          name: b.name,
          address: b.location?.display_address?.join(", ") ?? "",
          phone: b.display_phone,
          rating: b.rating,
          reviewCount: b.review_count,
        })
      );
    } catch {
      return [];
    }
  }
}
