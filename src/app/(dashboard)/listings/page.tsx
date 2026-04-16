"use client";

import { useState } from "react";
import { Globe, RefreshCw, Search, ExternalLink, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { StatCard } from "@/components/layout/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORM_LABELS, type Platform, type ListingStatus } from "@/lib/types";

interface ListingRow {
  id: string;
  locationName: string;
  platform: Platform;
  status: ListingStatus;
  accuracyScore: number;
  lastSyncedAt: string | null;
  profileUrl: string | null;
  lastError: string | null;
}

const demoListings: ListingRow[] = [
  { id: "1", locationName: "Downtown Bistro", platform: "GOOGLE", status: "SYNCED", accuracyScore: 95, lastSyncedAt: "2024-03-15T10:00:00Z", profileUrl: "#", lastError: null },
  { id: "2", locationName: "Downtown Bistro", platform: "YELP", status: "SYNCED", accuracyScore: 90, lastSyncedAt: "2024-03-15T09:30:00Z", profileUrl: "#", lastError: null },
  { id: "3", locationName: "Downtown Bistro", platform: "FACEBOOK", status: "ERROR", accuracyScore: 72, lastSyncedAt: "2024-03-14T08:00:00Z", profileUrl: "#", lastError: "API rate limit exceeded" },
  { id: "4", locationName: "Downtown Bistro", platform: "APPLE_MAPS", status: "SYNCED", accuracyScore: 100, lastSyncedAt: "2024-03-15T11:00:00Z", profileUrl: "#", lastError: null },
  { id: "5", locationName: "Midtown Kitchen", platform: "GOOGLE", status: "SYNCED", accuracyScore: 88, lastSyncedAt: "2024-03-15T10:15:00Z", profileUrl: "#", lastError: null },
  { id: "6", locationName: "Midtown Kitchen", platform: "YELP", status: "SYNCING", accuracyScore: 85, lastSyncedAt: "2024-03-14T16:00:00Z", profileUrl: "#", lastError: null },
  { id: "7", locationName: "Midtown Kitchen", platform: "FACEBOOK", status: "SYNCED", accuracyScore: 92, lastSyncedAt: "2024-03-15T09:00:00Z", profileUrl: "#", lastError: null },
  { id: "8", locationName: "Harbor View Restaurant", platform: "GOOGLE", status: "SYNCED", accuracyScore: 97, lastSyncedAt: "2024-03-15T08:00:00Z", profileUrl: "#", lastError: null },
  { id: "9", locationName: "Harbor View Restaurant", platform: "YELP", status: "DISCONNECTED", accuracyScore: 0, lastSyncedAt: null, profileUrl: null, lastError: null },
  { id: "10", locationName: "Uptown Grill", platform: "GOOGLE", status: "SYNCED", accuracyScore: 80, lastSyncedAt: "2024-03-13T12:00:00Z", profileUrl: "#", lastError: null },
  { id: "11", locationName: "Uptown Grill", platform: "FACEBOOK", status: "ERROR", accuracyScore: 45, lastSyncedAt: "2024-03-10T08:00:00Z", profileUrl: "#", lastError: "Page access token expired" },
];

const statusMap: Record<ListingStatus, "synced" | "error" | "syncing" | "disconnected" | "connected"> = {
  SYNCED: "synced",
  ERROR: "error",
  SYNCING: "syncing",
  DISCONNECTED: "disconnected",
  CONNECTED: "connected",
};

export default function ListingsPage() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = demoListings.filter((l) => {
    if (search && !l.locationName.toLowerCase().includes(search.toLowerCase())) return false;
    if (platformFilter !== "all" && l.platform !== platformFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  const syncedCount = demoListings.filter((l) => l.status === "SYNCED").length;
  const errorCount = demoListings.filter((l) => l.status === "ERROR").length;
  const avgAccuracy = Math.round(
    demoListings.filter((l) => l.accuracyScore > 0).reduce((acc, l) => acc + l.accuracyScore, 0) /
      demoListings.filter((l) => l.accuracyScore > 0).length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description="Monitor and sync your business information across all platforms."
      >
        <Button>
          <RefreshCw className="h-4 w-4" />
          Sync All
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Synced" value={syncedCount} icon={Globe} change={`of ${demoListings.length} total`} changeType="positive" />
        <StatCard label="Errors" value={errorCount} icon={AlertCircle} change="Need attention" changeType={errorCount > 0 ? "negative" : "neutral"} />
        <StatCard label="Avg Accuracy" value={`${avgAccuracy}%`} icon={Globe} change="+3% vs last week" changeType="positive" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="GOOGLE">Google</SelectItem>
            <SelectItem value="YELP">Yelp</SelectItem>
            <SelectItem value="FACEBOOK">Facebook</SelectItem>
            <SelectItem value="APPLE_MAPS">Apple Maps</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SYNCED">Synced</SelectItem>
            <SelectItem value="SYNCING">Syncing</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} listings</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Location</th>
                  <th className="text-left font-medium p-3">Platform</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Accuracy</th>
                  <th className="text-left font-medium p-3">Last Synced</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((listing) => (
                  <tr key={listing.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{listing.locationName}</td>
                    <td className="p-3">{PLATFORM_LABELS[listing.platform]}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={statusMap[listing.status]} />
                        <span className="capitalize">{listing.status.toLowerCase()}</span>
                      </div>
                      {listing.lastError && (
                        <p className="text-xs text-destructive mt-0.5">{listing.lastError}</p>
                      )}
                    </td>
                    <td className="p-3">
                      {listing.accuracyScore > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                listing.accuracyScore >= 90
                                  ? "bg-success"
                                  : listing.accuracyScore >= 70
                                  ? "bg-warning"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${listing.accuracyScore}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums">{listing.accuracyScore}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {listing.lastSyncedAt
                        ? new Date(listing.lastSyncedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        {listing.profileUrl && (
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
