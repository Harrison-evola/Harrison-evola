import type { BusinessInfo, PlatformClient, PlatformReview, SyncResult } from "./types";

/**
 * Apple Maps / Apple Business Connect API client.
 *
 * Requires:
 * - APPLE_TEAM_ID
 * - APPLE_KEY_ID
 * - APPLE_PRIVATE_KEY (ES256 .p8 key contents)
 *
 * Apple Business Connect allows managing business place cards on Apple Maps.
 * API docs: https://developer.apple.com/documentation/applemapsserverapi
 */
export class AppleMapsClient implements PlatformClient {
  readonly platform = "APPLE_MAPS";
  private baseUrl = "https://maps-api.apple.com/v1";
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private teamId: string,
    private keyId: string,
    private privateKey: string
  ) {}

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    // In production, generate a JWT with ES256 signing using the Apple private key.
    // The JWT payload contains:
    //   iss: teamId
    //   iat: current timestamp
    //   exp: current timestamp + 1 hour
    //   Header: { alg: "ES256", kid: keyId, typ: "JWT" }
    //
    // For now, we store the pre-generated token. In production, use a JWT library:
    //
    // import jwt from 'jsonwebtoken';
    // this.token = jwt.sign({}, this.privateKey, {
    //   algorithm: 'ES256',
    //   issuer: this.teamId,
    //   expiresIn: '1h',
    //   header: { kid: this.keyId, typ: 'JWT', alg: 'ES256' },
    // });

    throw new Error(
      "Apple Maps token generation requires a JWT library. Install jsonwebtoken and implement ES256 signing."
    );
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    return fetch(`${this.baseUrl}${path}`, {
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
      // Apple Business Connect uses a different flow:
      // 1. Claim the business via Apple Business Connect portal
      // 2. Update via Maps Server API

      if (!externalId) {
        return {
          success: false,
          error:
            "Apple Maps listings must first be claimed via Apple Business Connect (https://businessconnect.apple.com). Provide the Place ID after claiming.",
        };
      }

      const updateData = {
        name: data.name,
        address: {
          streetAddress: [data.address, data.address2].filter(Boolean).join(", "),
          locality: data.city,
          administrativeArea: data.state,
          postalCode: data.zip,
          countryCode: data.country,
        },
        phoneNumber: data.phone,
        website: data.website,
        hours: data.hours
          .filter((h) => !h.isClosed && h.openTime && h.closeTime)
          .map((h) => ({
            day: h.dayOfWeek,
            open: h.openTime,
            close: h.closeTime,
          })),
      };

      const res = await this.request(`/places/${externalId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Apple Maps update failed: ${err}` };
      }

      return {
        success: true,
        externalId,
        profileUrl: `https://maps.apple.com/?auid=${externalId}`,
      };
    } catch (err) {
      return {
        success: false,
        error: `Apple Maps push error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  async pullListing(externalId: string): Promise<BusinessInfo | null> {
    try {
      const res = await this.request(`/places/${externalId}`);
      if (!res.ok) return null;

      const place = await res.json();
      return {
        name: place.name ?? "",
        address: place.address?.streetAddress ?? "",
        city: place.address?.locality ?? "",
        state: place.address?.administrativeArea ?? "",
        zip: place.address?.postalCode ?? "",
        country: place.address?.countryCode ?? "US",
        phone: place.phoneNumber,
        website: place.website,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        hours: (place.hours ?? []).map((h: { day: number; open: string; close: string }) => ({
          dayOfWeek: h.day,
          openTime: h.open,
          closeTime: h.close,
          isClosed: false,
        })),
      };
    } catch {
      return null;
    }
  }

  async verifyConnection(_credentials: Record<string, string>): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }

  async pullReviews(_externalId: string, _since?: Date): Promise<PlatformReview[]> {
    // Apple Maps does not expose reviews via API
    return [];
  }

  async pushReviewResponse(_reviewExternalId: string, _responseText: string): Promise<SyncResult> {
    return {
      success: false,
      error: "Apple Maps does not support review responses via API.",
    };
  }
}
