// Shared types for platform integrations

export interface BusinessInfo {
  name: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  hours: {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[];
  categories?: string[];
}

export interface PlatformReview {
  externalId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  text?: string;
  publishedAt: Date;
}

export interface MenuData {
  name: string;
  sections: {
    name: string;
    items: {
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      dietaryTags?: string[];
    }[];
  }[];
}

export interface SyncResult {
  success: boolean;
  externalId?: string;
  profileUrl?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface PlatformClient {
  readonly platform: string;

  // Listing operations
  pushListing(externalId: string | null, data: BusinessInfo): Promise<SyncResult>;
  pullListing(externalId: string): Promise<BusinessInfo | null>;
  verifyConnection(credentials: Record<string, string>): Promise<boolean>;

  // Review operations
  pullReviews(externalId: string, since?: Date): Promise<PlatformReview[]>;
  pushReviewResponse(reviewExternalId: string, responseText: string): Promise<SyncResult>;

  // Menu operations (not all platforms support this)
  pushMenu?(externalId: string, menu: MenuData): Promise<SyncResult>;
}
