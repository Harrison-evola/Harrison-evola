import { createHmac } from "crypto";
import { db } from "@/lib/db";
import type { WebhookEventType } from "@/lib/types";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 8000, 30000]; // exponential-ish backoff

/**
 * Dispatch a webhook event to all active webhook configs for an organization.
 */
export async function dispatchWebhook(
  organizationId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  const configs = await db.webhookConfig.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: event },
    },
  });

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body = JSON.stringify(payload);

  await Promise.allSettled(
    configs.map((config) => deliverWebhook(config.id, config.url, config.secret, event, body))
  );
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  body: string
): Promise<void> {
  const delivery = await db.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: JSON.parse(body),
    },
  });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const signature = createHmac("sha256", secret).update(body).digest("hex");

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": event,
          "X-Webhook-Delivery": delivery.id,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          statusCode: res.status,
          response: await res.text().catch(() => null),
          attempts: attempt + 1,
          deliveredAt: res.ok ? new Date() : undefined,
        },
      });

      if (res.ok) return;

      // 4xx errors (except 429) are not retried
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return;
    } catch (err) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: attempt + 1,
          response: err instanceof Error ? err.message : "Delivery failed",
        },
      });
    }

    // Wait before retrying (but not after last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }
}

/**
 * Verify an incoming webhook signature.
 * Useful if external services send webhooks to us.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${expected}` === signature;
}
