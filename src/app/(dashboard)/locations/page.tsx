"use client";

import { useState } from "react";
import { MapPin, Plus, Search, MoreVertical, Phone, Globe, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LocationForm } from "@/components/locations/location-form";
import Link from "next/link";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  isActive: boolean;
  listingCount: number;
  avgRating: number;
  reviewCount: number;
}

// Demo data
const demoLocations: Location[] = [
  {
    id: "1",
    name: "Downtown Bistro",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zip: "10001",
    phone: "(212) 555-0100",
    website: "https://downtownbistro.com",
    isActive: true,
    listingCount: 4,
    avgRating: 4.5,
    reviewCount: 89,
  },
  {
    id: "2",
    name: "Midtown Kitchen",
    address: "456 5th Ave",
    city: "New York",
    state: "NY",
    zip: "10018",
    phone: "(212) 555-0200",
    website: "https://midtownkitchen.com",
    isActive: true,
    listingCount: 4,
    avgRating: 4.2,
    reviewCount: 156,
  },
  {
    id: "3",
    name: "Harbor View Restaurant",
    address: "789 Waterfront Dr",
    city: "Brooklyn",
    state: "NY",
    zip: "11201",
    phone: "(718) 555-0300",
    website: null,
    isActive: true,
    listingCount: 3,
    avgRating: 4.7,
    reviewCount: 42,
  },
  {
    id: "4",
    name: "Uptown Grill",
    address: "321 Broadway",
    city: "New York",
    state: "NY",
    zip: "10025",
    phone: "(212) 555-0400",
    website: "https://uptowngrill.com",
    isActive: false,
    listingCount: 2,
    avgRating: 3.9,
    reviewCount: 67,
  },
];

export default function LocationsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [locations] = useState<Location[]>(demoLocations);

  const filtered = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage your business locations across all platforms."
      >
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filtered.length} locations</Badge>
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first business location to start managing listings, menus, and reviews."
        >
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results"
          description={`No locations match "${search}".`}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((location) => (
            <Link key={location.id} href={`/locations/${location.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {location.name}
                        </h3>
                        {!location.isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {location.address}, {location.city}, {location.state}{" "}
                        {location.zip}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    {location.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {location.phone}
                      </span>
                    )}
                    {location.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs">
                        <span className="font-medium">
                          {location.listingCount}
                        </span>{" "}
                        listings
                      </span>
                      <span className="text-xs">
                        <span className="font-medium">
                          {location.reviewCount}
                        </span>{" "}
                        reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">
                        {location.avgRating.toFixed(1)}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(location.avgRating)
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
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>
              Add a new business location. You can connect it to platforms after
              creation.
            </DialogDescription>
          </DialogHeader>
          <LocationForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
