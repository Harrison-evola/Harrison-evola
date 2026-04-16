"use client";

import { useState } from "react";
import { UtensilsCrossed, Plus, Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface MenuSummary {
  id: string;
  name: string;
  locationName: string;
  locationId: string;
  sectionCount: number;
  itemCount: number;
  isActive: boolean;
  lastUpdated: string;
}

const demoMenus: MenuSummary[] = [
  { id: "1", name: "Lunch Menu", locationName: "Downtown Bistro", locationId: "1", sectionCount: 4, itemCount: 24, isActive: true, lastUpdated: "2024-03-15" },
  { id: "2", name: "Dinner Menu", locationName: "Downtown Bistro", locationId: "1", sectionCount: 5, itemCount: 32, isActive: true, lastUpdated: "2024-03-14" },
  { id: "3", name: "Drinks", locationName: "Downtown Bistro", locationId: "1", sectionCount: 3, itemCount: 18, isActive: true, lastUpdated: "2024-03-10" },
  { id: "4", name: "Main Menu", locationName: "Midtown Kitchen", locationId: "2", sectionCount: 6, itemCount: 45, isActive: true, lastUpdated: "2024-03-15" },
  { id: "5", name: "Happy Hour", locationName: "Midtown Kitchen", locationId: "2", sectionCount: 2, itemCount: 12, isActive: false, lastUpdated: "2024-02-28" },
  { id: "6", name: "Full Menu", locationName: "Harbor View Restaurant", locationId: "3", sectionCount: 7, itemCount: 52, isActive: true, lastUpdated: "2024-03-13" },
];

export default function MenusPage() {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const locations = [...new Set(demoMenus.map((m) => m.locationName))];

  const filtered = demoMenus.filter((menu) => {
    if (search && !menu.name.toLowerCase().includes(search.toLowerCase()) && !menu.locationName.toLowerCase().includes(search.toLowerCase())) return false;
    if (locationFilter !== "all" && menu.locationName !== locationFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menus"
        description="Manage menus for all your locations. Changes sync to connected platforms."
      >
        <Button>
          <Plus className="h-4 w-4" />
          Create Menu
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} menus</Badge>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menus found"
          description="Create your first menu to start managing items and syncing to platforms."
        >
          <Button>
            <Plus className="h-4 w-4" />
            Create Menu
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((menu) => (
            <Link key={menu.id} href={`/menus/${menu.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{menu.name}</h3>
                        {!menu.isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {menu.locationName}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">
                        {menu.sectionCount}
                      </span>{" "}
                      sections
                    </span>
                    <span>
                      <span className="font-medium text-foreground">
                        {menu.itemCount}
                      </span>{" "}
                      items
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Updated {menu.lastUpdated}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
