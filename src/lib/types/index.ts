// Shared types used across the application

export type Platform =
  | "GOOGLE"
  | "YELP"
  | "FACEBOOK"
  | "APPLE_MAPS"
  | "TRIPADVISOR"
  | "DOORDASH"
  | "UBEREATS"
  | "GRUBHUB";

export type ListingStatus =
  | "CONNECTED"
  | "SYNCING"
  | "SYNCED"
  | "ERROR"
  | "DISCONNECTED";

export type SyncAction =
  | "PUSH_LISTING"
  | "PULL_LISTING"
  | "PUSH_MENU"
  | "PULL_REVIEWS"
  | "PUSH_RESPONSE";

export type SyncStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED";

export const PLATFORM_LABELS: Record<Platform, string> = {
  GOOGLE: "Google Business",
  YELP: "Yelp",
  FACEBOOK: "Facebook",
  APPLE_MAPS: "Apple Maps",
  TRIPADVISOR: "TripAdvisor",
  DOORDASH: "DoorDash",
  UBEREATS: "Uber Eats",
  GRUBHUB: "Grubhub",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  GOOGLE: "#4285F4",
  YELP: "#D32323",
  FACEBOOK: "#1877F2",
  APPLE_MAPS: "#000000",
  TRIPADVISOR: "#34E0A1",
  DOORDASH: "#FF3008",
  UBEREATS: "#06C167",
  GRUBHUB: "#F63440",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  CONNECTED: "Connected",
  SYNCING: "Syncing",
  SYNCED: "Synced",
  ERROR: "Error",
  DISCONNECTED: "Disconnected",
};

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export const WEBHOOK_EVENTS = [
  "listing.synced",
  "listing.error",
  "review.created",
  "review.responded",
  "menu.updated",
  "menu.synced",
  "location.created",
  "location.updated",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];
