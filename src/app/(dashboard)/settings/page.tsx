"use client";

import { useState } from "react";
import { Settings, Globe, Webhook, Key, Plus, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WEBHOOK_EVENTS, type WebhookEventType } from "@/lib/types";

interface PlatformConnection {
  platform: string;
  label: string;
  connected: boolean;
  description: string;
  envVars: string[];
}

const platforms: PlatformConnection[] = [
  {
    platform: "GOOGLE",
    label: "Google Business Profile",
    connected: false,
    description: "Manage your Google Business listings, hours, and respond to reviews.",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"],
  },
  {
    platform: "YELP",
    label: "Yelp",
    connected: false,
    description: "Pull reviews and business data from Yelp. Listing updates require Business Owners access.",
    envVars: ["YELP_API_KEY"],
  },
  {
    platform: "FACEBOOK",
    label: "Facebook Pages",
    connected: false,
    description: "Manage your Facebook Page listings, hours, and respond to recommendations.",
    envVars: ["FACEBOOK_PAGE_ACCESS_TOKEN"],
  },
  {
    platform: "APPLE_MAPS",
    label: "Apple Maps",
    connected: false,
    description: "Manage your Apple Business Connect place cards.",
    envVars: ["APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"],
  },
];

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  deliveryCount: number;
}

const demoWebhooks: WebhookConfig[] = [
  {
    id: "wh1",
    url: "https://your-dashboard.com/api/webhooks/listings",
    events: ["listing.synced", "listing.error", "review.created"],
    isActive: true,
    deliveryCount: 47,
  },
];

export default function SettingsPage() {
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventType[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const toggleEvent = (event: WebhookEventType) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText("whsec_demo_your_secret_key_here");
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage platform connections, webhooks, and API keys."
      />

      <Tabs defaultValue="platforms">
        <TabsList>
          <TabsTrigger value="platforms">
            <Globe className="h-4 w-4 mr-1.5" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-1.5" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-1.5" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your accounts to sync listings, reviews, and menus across platforms.
            API credentials are set via environment variables for security.
          </p>
          {platforms.map((p) => (
            <Card key={p.platform}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusDot status={p.connected ? "connected" : "disconnected"} />
                      <h3 className="font-semibold">{p.label}</h3>
                      <Badge variant={p.connected ? "success" : "secondary"}>
                        {p.connected ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {p.description}
                    </p>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Required environment variables:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.envVars.map((v) => (
                          <code
                            key={v}
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono"
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={p.connected ? "outline" : "default"}
                    size="sm"
                  >
                    {p.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Send real-time events to your dashboard when listings sync, reviews arrive, or menus update.
              </p>
            </div>
            <Button onClick={() => setShowAddWebhook(true)}>
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </div>

          {demoWebhooks.map((wh) => (
            <Card key={wh.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot status={wh.isActive ? "connected" : "disconnected"} />
                      <code className="text-sm font-mono truncate">{wh.url}</code>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {wh.events.map((e) => (
                        <Badge key={e} variant="secondary" className="text-[10px]">
                          {e}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {wh.deliveryCount} deliveries
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-dashed">
            <CardContent className="p-5">
              <h4 className="text-sm font-medium mb-2">Webhook Payload Format</h4>
              <pre className="rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
{`{
  "event": "review.created",
  "timestamp": "2024-03-15T10:00:00Z",
  "data": {
    "locationId": "clx...",
    "platform": "GOOGLE",
    "reviewId": "clx...",
    "rating": 5,
    "authorName": "Jane D."
  }
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Webhooks include an <code className="text-[11px]">X-Webhook-Signature</code> header
                (HMAC-SHA256) for verification.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              API keys let your dashboard access the Listings Hub API directly.
            </p>
            <Button>
              <Plus className="h-4 w-4" />
              Create API Key
            </Button>
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Production Key</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      lh_prod_8a3b...
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created Mar 1, 2024 · Last used 2 hours ago
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopySecret}>
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-5">
              <h4 className="text-sm font-medium mb-2">API Usage</h4>
              <pre className="rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
{`curl -H "Authorization: Bearer lh_prod_YOUR_KEY" \\
     https://your-app.com/api/locations`}
              </pre>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">Available endpoints:</p>
                <div className="grid gap-1 text-xs font-mono">
                  <span>GET  /api/locations</span>
                  <span>POST /api/locations</span>
                  <span>GET  /api/locations/:id</span>
                  <span>GET  /api/locations/:id/listings</span>
                  <span>GET  /api/locations/:id/menus</span>
                  <span>GET  /api/locations/:id/reviews</span>
                  <span>POST /api/sync</span>
                  <span>POST /api/reviews/:id/respond</span>
                  <span>GET  /api/webhooks</span>
                  <span>POST /api/webhooks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Webhook Dialog */}
      <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              We&apos;ll send POST requests to your URL when selected events occur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Endpoint URL</label>
              <Input
                type="url"
                placeholder="https://your-dashboard.com/api/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Events</label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded border p-2 text-sm cursor-pointer hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded"
                    />
                    <code className="text-xs">{event}</code>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={!webhookUrl || webhookEvents.length === 0}
                onClick={() => {
                  setShowAddWebhook(false);
                  setWebhookUrl("");
                  setWebhookEvents([]);
                }}
              >
                Create Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
