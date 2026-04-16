"use client";

import { use } from "react";
import { ArrowLeft, Globe, Star, UtensilsCrossed, ExternalLink, MapPin, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORM_LABELS, DAYS_OF_WEEK, type Platform } from "@/lib/types";
import Link from "next/link";

// Demo data
const location = {
  id: "1",
  name: "Downtown Bistro",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zip: "10001",
  phone: "(212) 555-0100",
  email: "info@downtownbistro.com",
  website: "https://downtownbistro.com",
  isActive: true,
  hours: [
    { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
    { dayOfWeek: 1, isClosed: false, openTime: "11:00", closeTime: "22:00" },
    { dayOfWeek: 2, isClosed: false, openTime: "11:00", closeTime: "22:00" },
    { dayOfWeek: 3, isClosed: false, openTime: "11:00", closeTime: "22:00" },
    { dayOfWeek: 4, isClosed: false, openTime: "11:00", closeTime: "23:00" },
    { dayOfWeek: 5, isClosed: false, openTime: "11:00", closeTime: "23:00" },
    { dayOfWeek: 6, isClosed: false, openTime: "10:00", closeTime: "23:00" },
  ],
  listings: [
    { platform: "GOOGLE" as Platform, status: "SYNCED" as const, lastSyncedAt: "2024-03-15T10:00:00Z", accuracyScore: 95 },
    { platform: "YELP" as Platform, status: "SYNCED" as const, lastSyncedAt: "2024-03-15T09:30:00Z", accuracyScore: 90 },
    { platform: "FACEBOOK" as Platform, status: "ERROR" as const, lastSyncedAt: "2024-03-14T08:00:00Z", accuracyScore: 72 },
    { platform: "APPLE_MAPS" as Platform, status: "SYNCED" as const, lastSyncedAt: "2024-03-15T11:00:00Z", accuracyScore: 100 },
  ],
  recentReviews: [
    { platform: "GOOGLE" as Platform, author: "Jane D.", rating: 5, text: "Amazing food and great service!", date: "2024-03-14" },
    { platform: "YELP" as Platform, author: "Mike R.", rating: 4, text: "Good food, slightly slow service on weekends.", date: "2024-03-12" },
    { platform: "GOOGLE" as Platform, author: "Sarah L.", rating: 5, text: "Best pasta in the city. Will definitely come back.", date: "2024-03-10" },
  ],
};

const statusMap: Record<string, "synced" | "error" | "syncing" | "disconnected" | "connected"> = {
  SYNCED: "synced",
  ERROR: "error",
  SYNCING: "syncing",
  DISCONNECTED: "disconnected",
  CONNECTED: "connected",
};

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/locations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Locations
        </Link>
        <PageHeader title={location.name}>
          <Badge variant={location.isActive ? "success" : "secondary"}>
            {location.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </PageHeader>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {location.address}, {location.city}, {location.state}{" "}
                    {location.zip}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {location.phone}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {location.email}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {location.listings.map((listing) => (
                  <div
                    key={listing.platform}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <StatusDot status={statusMap[listing.status]} />
                      <span className="text-sm font-medium">
                        {PLATFORM_LABELS[listing.platform]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        Accuracy: {listing.accuracyScore}%
                      </span>
                      <Badge
                        variant={
                          listing.status === "SYNCED"
                            ? "success"
                            : listing.status === "ERROR"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {listing.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Connected Platforms</CardTitle>
                <Button size="sm">
                  <Globe className="h-4 w-4" />
                  Connect Platform
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {location.listings.map((listing) => (
                  <div
                    key={listing.platform}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <StatusDot status={statusMap[listing.status]} />
                      <div>
                        <p className="text-sm font-medium">
                          {PLATFORM_LABELS[listing.platform]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(listing.lastSyncedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Sync Now
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {location.recentReviews.map((review, i) => (
                <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {review.author}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {PLATFORM_LABELS[review.platform]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-3 w-3 ${
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted fill-muted"
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {review.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {review.date}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Business Hours</CardTitle>
                <Button variant="outline" size="sm">
                  Edit Hours
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {location.hours.map((h) => (
                  <div
                    key={h.dayOfWeek}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm font-medium w-28">
                      {DAYS_OF_WEEK[h.dayOfWeek]}
                    </span>
                    {h.isClosed ? (
                      <span className="text-sm text-muted-foreground">
                        Closed
                      </span>
                    ) : (
                      <span className="text-sm">
                        {h.openTime} - {h.closeTime}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
