"use client";

import { BarChart3, Star, Globe, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORM_LABELS, type Platform } from "@/lib/types";

// Demo analytics data
const overviewStats = {
  totalListings: 48,
  avgAccuracy: 87,
  totalReviews: 324,
  avgRating: 4.3,
  responseRate: 72,
  avgResponseTime: "4.2 hrs",
};

const ratingDistribution = [
  { stars: 5, count: 156, pct: 48 },
  { stars: 4, count: 89, pct: 27 },
  { stars: 3, count: 42, pct: 13 },
  { stars: 2, count: 21, pct: 7 },
  { stars: 1, count: 16, pct: 5 },
];

const platformBreakdown: {
  platform: Platform;
  listings: number;
  avgAccuracy: number;
  reviews: number;
  avgRating: number;
}[] = [
  { platform: "GOOGLE", listings: 12, avgAccuracy: 92, reviews: 178, avgRating: 4.4 },
  { platform: "YELP", listings: 10, avgAccuracy: 85, reviews: 89, avgRating: 4.1 },
  { platform: "FACEBOOK", listings: 11, avgAccuracy: 78, reviews: 45, avgRating: 4.5 },
  { platform: "APPLE_MAPS", listings: 12, avgAccuracy: 95, reviews: 12, avgRating: 4.2 },
];

const locationPerformance = [
  { name: "Harbor View Restaurant", rating: 4.7, reviews: 42, accuracy: 97, trend: "up" as const },
  { name: "Downtown Bistro", rating: 4.5, reviews: 89, accuracy: 95, trend: "up" as const },
  { name: "Midtown Kitchen", rating: 4.2, reviews: 156, accuracy: 88, trend: "down" as const },
  { name: "Uptown Grill", rating: 3.9, reviews: 67, accuracy: 80, trend: "down" as const },
];

const reviewTrend = [
  { month: "Oct", count: 38, avg: 4.1 },
  { month: "Nov", count: 42, avg: 4.0 },
  { month: "Dec", count: 55, avg: 4.2 },
  { month: "Jan", count: 48, avg: 4.3 },
  { month: "Feb", count: 61, avg: 4.4 },
  { month: "Mar", count: 72, avg: 4.3 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your listing performance, review trends, and accuracy scores."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Listing Accuracy" value={`${overviewStats.avgAccuracy}%`} icon={Globe} change="+5% vs last month" changeType="positive" />
        <StatCard label="Avg Rating" value={overviewStats.avgRating.toFixed(1)} icon={Star} change="+0.2 vs last month" changeType="positive" />
        <StatCard label="Response Rate" value={`${overviewStats.responseRate}%`} icon={BarChart3} change="Target: 90%" changeType="neutral" />
        <StatCard label="Avg Response Time" value={overviewStats.avgResponseTime} icon={BarChart3} change="-1.3 hrs vs last month" changeType="positive" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">By Platform</TabsTrigger>
          <TabsTrigger value="locations">By Location</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Rating Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ratingDistribution.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-right tabular-nums">
                      {row.stars} star{row.stars !== 1 && "s"}
                    </span>
                    <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.stars >= 4
                            ? "bg-success"
                            : row.stars === 3
                            ? "bg-warning"
                            : "bg-destructive"
                        }`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm text-muted-foreground tabular-nums">
                      {row.count} ({row.pct}%)
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-medium">{overviewStats.totalReviews}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review Trend (6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewTrend.map((month) => (
                    <div key={month.month} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium">{month.month}</span>
                      <div className="flex-1 h-6 rounded bg-muted overflow-hidden relative">
                        <div
                          className="h-full rounded bg-primary/20"
                          style={{ width: `${(month.count / 80) * 100}%` }}
                        />
                        <span className="absolute inset-y-0 left-2 flex items-center text-xs tabular-nums">
                          {month.count} reviews
                        </span>
                      </div>
                      <span className="w-10 text-sm text-muted-foreground tabular-nums">
                        {month.avg.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Right column shows average rating per month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {platformBreakdown.map((p) => (
              <Card key={p.platform}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{PLATFORM_LABELS[p.platform]}</h3>
                    <Badge variant="secondary">{p.listings} listings</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="text-lg font-semibold">{p.avgAccuracy}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                      <p className="text-lg font-semibold">{p.reviews}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                      <p className="text-lg font-semibold">{p.avgRating.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.avgAccuracy >= 90
                            ? "bg-success"
                            : p.avgAccuracy >= 75
                            ? "bg-warning"
                            : "bg-destructive"
                        }`}
                        style={{ width: `${p.avgAccuracy}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-3">Location</th>
                    <th className="text-left font-medium p-3">Rating</th>
                    <th className="text-left font-medium p-3">Reviews</th>
                    <th className="text-left font-medium p-3">Accuracy</th>
                    <th className="text-left font-medium p-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {locationPerformance.map((loc) => (
                    <tr key={loc.name} className="border-b last:border-0">
                      <td className="p-3 font-medium">{loc.name}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span>{loc.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-3">{loc.reviews}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                loc.accuracy >= 90
                                  ? "bg-success"
                                  : loc.accuracy >= 75
                                  ? "bg-warning"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${loc.accuracy}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums">{loc.accuracy}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {loc.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
