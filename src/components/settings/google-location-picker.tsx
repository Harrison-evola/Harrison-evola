"use client";

import { useState, useEffect } from "react";
import { MapPin, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GbpLocation {
  name: string;
  fullResourceName: string;
  title: string;
  address: string;
  phone: string | null;
  website: string | null;
  mapsUri: string | null;
  placeId: string | null;
  alreadyImported: boolean;
}

interface GbpAccount {
  name: string;
  accountName: string;
  type: string;
  locations: GbpLocation[];
}

interface ImportResult {
  imported: Array<{ locationId: string; name: string; reviewCount: number }>;
  skipped: string[];
  errors: Array<{ name: string; error: string }>;
  summary: string;
}

interface GoogleLocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function GoogleLocationPicker({
  open,
  onOpenChange,
  onImportComplete,
}: GoogleLocationPickerProps) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(
    new Set()
  );
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedLocations(new Set());

    fetch("/api/auth/google/accounts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load accounts");
        return res.json();
      })
      .then((data) => {
        setAccounts(data.accounts ?? []);
        if (data.accounts?.length === 1) {
          setSelectedAccount(data.accounts[0].name);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  const currentAccount = accounts.find((a) => a.name === selectedAccount);
  const availableLocations =
    currentAccount?.locations.filter((l) => !l.alreadyImported) ?? [];
  const importedLocations =
    currentAccount?.locations.filter((l) => l.alreadyImported) ?? [];

  const toggleLocation = (fullResourceName: string) => {
    setSelectedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(fullResourceName)) next.delete(fullResourceName);
      else next.add(fullResourceName);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedLocations(
      new Set(availableLocations.map((l) => l.fullResourceName))
    );
  };

  const deselectAll = () => {
    setSelectedLocations(new Set());
  };

  const handleImport = async () => {
    if (!currentAccount || selectedLocations.size === 0) return;
    setImporting(true);
    setError(null);

    try {
      const locations = Array.from(selectedLocations).map(
        (fullResourceName) => {
          const loc = currentAccount.locations.find(
            (l) => l.fullResourceName === fullResourceName
          );
          // Extract just the "locations/..." part from the full resource name
          const name = loc?.name ?? fullResourceName.split("/").slice(-2).join("/");
          return { name };
        }
      );

      const res = await fetch("/api/auth/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: currentAccount.name,
          locations,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Import failed");
      }

      const data: ImportResult = await res.json();
      setResult(data);
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Google Business Locations</DialogTitle>
          <DialogDescription>
            Select the locations you want to import. Business info, hours, and
            reviews will be pulled from Google.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading your Google Business locations...
            </span>
          </div>
        )}

        {error && !result && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && accounts.length === 0 && (
          <div className="py-8 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">
              No Google Business Profile accounts found for this Google account.
            </p>
          </div>
        )}

        {!loading && !result && accounts.length > 0 && (
          <div className="space-y-4">
            {/* Account selector */}
            {accounts.length > 1 && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Select Account
                </label>
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a Google Business account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.name} value={acc.name}>
                        {acc.accountName} ({acc.locations.length} locations)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentAccount && (
              <>
                {/* Select all / deselect all */}
                {availableLocations.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedLocations.size} of {availableLocations.length}{" "}
                      selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAll}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Location cards */}
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {availableLocations.map((loc) => {
                    const isSelected = selectedLocations.has(
                      loc.fullResourceName
                    );
                    return (
                      <Card
                        key={loc.fullResourceName}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30"
                        }`}
                        onClick={() => toggleLocation(loc.fullResourceName)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-primary bg-primary text-white"
                                  : "border-border"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {loc.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {loc.address}
                              </p>
                              {loc.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {loc.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Already imported locations */}
                  {importedLocations.length > 0 && (
                    <>
                      <div className="pt-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Already Imported
                        </p>
                      </div>
                      {importedLocations.map((loc) => (
                        <Card
                          key={loc.fullResourceName}
                          className="opacity-50"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-success bg-success text-white">
                                <Check className="h-3 w-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {loc.title}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    Imported
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {loc.address}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}

                  {availableLocations.length === 0 &&
                    importedLocations.length > 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All locations have already been imported.
                      </p>
                    )}
                </div>

                {/* Import button */}
                {availableLocations.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleImport}
                      disabled={selectedLocations.size === 0 || importing}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          Import Selected ({selectedLocations.size})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Import result */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                {result.summary}
              </p>
            </div>

            {result.imported.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Imported:</p>
                <div className="space-y-1">
                  {result.imported.map((loc) => (
                    <div
                      key={loc.locationId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{loc.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {loc.reviewCount} reviews pulled
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-2">
                  Errors:
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {err.name}: {err.error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
