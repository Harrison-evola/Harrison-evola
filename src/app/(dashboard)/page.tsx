"use client";

import { MapPin, Globe, Star, UtensilsCrossed, ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import Link from "next/link";

// Demo data — will be replaced by real API calls
const stats = {
  locations: 12,
  listings: 48,
  reviews: 324,
  avgRating: 4.3,
  listingAccuracy: 87,
  pendingReviews: 8,
};

const recentActivity = [
  {
    id: "1",
    type: "review" as const,
    message: "New 5-star review on Google for Downtown Location",
    time: "2 minutes ago",
  },
  {
    id: "2",
    type: "sync" as const,
    message: "Yelp listing synced for Midtown Restaurant",
    time: "15 minutes ago",
  },
  {
    id: "3",
    type: "error" as const,
    message: "Facebook sync failed for Uptown Bistro",
    time: "1 hour ago",
  },
  {
    id: "4",
    type: "menu" as const,
    message: "Menu updated and pushed to 4 platforms",
    time: "3 hours ago",
  },
  {
    id: "5",
    type: "review" as const,
    message: "New 3-star review on Yelp for Harbor View",
    time: "5 hours ago",
  },
];

const listingHealth = [
  { platform: "Google Business", synced: 11, total: 12, status: "synced" as const },
  { platform: "Yelp", synced: 10, total: 12, status: "synced" as const },
  { platform: "Facebook", synced: 8, total: 12, status: "error" as const },
  { platform: "Apple Maps", synced: 12, total: 12, status: "synced" as const },
];

const activityIcons = {
  review: Star,
  sync: CheckCircle2,
  error: AlertCircle,
  menu: UtensilsCrossed,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your locations, listings, and reviews."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Locations"
          value={stats.locations}
          icon={MapPin}
          change="+2 this month"
          changeType="positive"
        />
        <StatCard
          label="Active Listings"
          value={stats.listings}
          icon={Globe}
          change={`${stats.listingAccuracy}% accuracy`}
          changeType="positive"
        />
        <StatCard
          label="Total Reviews"
          value={stats.reviews}
          icon={Star}
          change={`${stats.pendingReviews} need response`}
          changeType="neutral"
        />
        <StatCard
          label="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          icon={Star}
          change="+0.2 vs last month"
          changeType="positive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link
              href="/analytics"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item) => {
              const Icon = activityIcons[item.type];
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      item.type === "error" ? "bg-red-50" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        item.type === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Listing Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Listing Health</CardTitle>
            <Link
              href="/listings"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {listingHealth.map((item) => {
              const pct = Math.round((item.synced / item.total) * 100);
              return (
                <div key={item.platform}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <StatusDot
                        status={
                          item.status === "error" ? "error" : "synced"
                        }
                      />
                      <span className="text-sm font-medium">
                        {item.platform}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.synced}/{item.total} synced
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct === 100
                          ? "bg-success"
                          : pct >= 80
                          ? "bg-warning"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Accuracy</span>
                <Badge variant="secondary">
                  {stats.listingAccuracy}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/locations"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Add Location</p>
                <p className="text-xs text-muted-foreground">New business</p>
              </div>
            </Link>
            <Link
              href="/listings"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sync Listings</p>
                <p className="text-xs text-muted-foreground">Push to platforms</p>
              </div>
            </Link>
            <Link
              href="/menus"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Edit Menus</p>
                <p className="text-xs text-muted-foreground">Update items</p>
              </div>
            </Link>
            <Link
              href="/reviews"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pending Reviews</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingReviews} awaiting reply
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
