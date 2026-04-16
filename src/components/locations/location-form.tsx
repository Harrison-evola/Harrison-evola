"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DAYS_OF_WEEK } from "@/lib/types";

interface LocationFormProps {
  onSuccess: () => void;
  initialData?: {
    name: string;
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    website: string;
  };
}

export function LocationForm({ onSuccess, initialData }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    address2: initialData?.address2 ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    zip: initialData?.zip ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    website: initialData?.website ?? "",
  });

  const [hours, setHours] = useState(
    DAYS_OF_WEEK.map((day, i) => ({
      dayOfWeek: i,
      openTime: i >= 1 && i <= 5 ? "09:00" : i === 6 ? "10:00" : "",
      closeTime: i >= 1 && i <= 5 ? "22:00" : i === 6 ? "22:00" : "",
      isClosed: i === 0,
    }))
  );

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateHours = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours }),
      });
      if (res.ok) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Basic Info
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">
              Business Name
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Downtown Bistro"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">Address</label>
            <Input
              required
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">
              Address Line 2
            </label>
            <Input
              value={form.address2}
              onChange={(e) => updateField("address2", e.target.value)}
              placeholder="Suite 100"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">City</label>
            <Input
              required
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="New York"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">State</label>
              <Input
                required
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="NY"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ZIP</label>
              <Input
                required
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                placeholder="10001"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Contact
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(212) 555-0100"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="info@restaurant.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">Website</label>
            <Input
              type="url"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://restaurant.com"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Business Hours
        </h3>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 text-sm shrink-0">
                {DAYS_OF_WEEK[h.dayOfWeek]}
              </span>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={h.isClosed}
                  onChange={(e) => updateHours(i, "isClosed", e.target.checked)}
                  className="rounded"
                />
                Closed
              </label>
              {!h.isClosed && (
                <>
                  <Input
                    type="time"
                    value={h.openTime}
                    onChange={(e) =>
                      updateHours(i, "openTime", e.target.value)
                    }
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) =>
                      updateHours(i, "closeTime", e.target.value)
                    }
                    className="w-28"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Location"}
        </Button>
      </div>
    </form>
  );
}
