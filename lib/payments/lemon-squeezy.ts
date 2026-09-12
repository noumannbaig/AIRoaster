import crypto from "node:crypto";
import { PRODUCTS, env, type ProductId } from "@/lib/env";
import {
  PaymentError,
  type CheckoutResult,
  type CreateCheckoutArgs,
  type NormalizedOrder,
  type PaymentProvider,
  type WebhookVerification,
} from "./types";

const API_BASE = "https://api.lemonsqueezy.com/v1";

function variantIdFor(product: ProductId): string {
  if (product === "ULTIMATE_ROAST") return env.lemonSqueezy.variantIdUltimateRoast;
  return env.lemonSqueezy.variantIdFullRoast;
}

type LsAttributes = {
  identifier?: string;
  status?: string;
  total?: number;
  currency?: string;
  user_email?: string;
  first_order_item?: { id?: number | string };
};

type LsPayload = {
  meta?: { event_name?: string; custom_data?: Record<string, unknown> };
  data?: { id?: string; attributes?: LsAttributes };
};

function mapStatus(status: string | undefined): NormalizedOrder["status"] {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
      return "paid";
    case "refunded":
    case "partial_refund":
      return "refunded";
    case "failed":
    case "cancelled":
    case "void":
      return "failed";
    default:
      return "pending";
  }
}

function normalize(payload: LsPayload): NormalizedOrder | null {
  const data = payload?.data;
  if (!data?.id) return null;
  const attrs = data.attributes ?? {};
  const custom = payload.meta?.custom_data ?? {};

  return {
    providerOrderId: String(data.id),
    providerPaymentId: attrs.identifier ? String(attrs.identifier) : null,
    status: mapStatus(attrs.status),
    amountCents: typeof attrs.total === "number" ? attrs.total : 0,
    currency: String(attrs.currency ?? "USD"),
    email: attrs.user_email ? String(attrs.user_email) : null,
    customData: {
      sessionId: typeof custom.sessionId === "string" ? custom.sessionId : undefined,
      roastId: typeof custom.roastId === "string" ? custom.roastId : undefined,
      productType:
        custom.productType === "FULL_ROAST" || custom.productType === "ULTIMATE_ROAST"
          ? custom.productType
          : undefined,
    },
  };
}

export class LemonSqueezyProvider implements PaymentProvider {
  readonly name = "lemon_squeezy";

  isConfigured(): boolean {
    return Boolean(
      env.lemonSqueezy.apiKey && env.lemonSqueezy.storeId && env.lemonSqueezy.variantIdFullRoast,
    );
  }

  async createCheckout(args: CreateCheckoutArgs): Promise<CheckoutResult> {
    if (!this.isConfigured()) {
      throw new PaymentError(
        "Lemon Squeezy is not configured. Set LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID and LEMON_SQUEEZY_VARIANT_ID_FULL_ROAST.",
        "not_configured",
      );
    }
    const variantId = variantIdFor(args.product);
    if (!variantId) {
      throw new PaymentError(`No Lemon Squeezy variant configured for ${args.product}`, "not_configured");
    }

    const body = {
      data: {
        type: "checkouts",
        attributes: {
          test_mode: env.lemonSqueezy.testMode,
          product_options: {
            name: PRODUCTS[args.product].name,
            redirect_url: args.redirectUrl,
            receipt_button_text: "Back to your roast",
          },
          checkout_options: { embed: false, dark: true },
          checkout_data: {
            email: args.email,
            // Echoed back verbatim in the webhook's meta.custom_data — this is
            // how a payment is tied to a roast session.
            custom: args.customData,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(env.lemonSqueezy.storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    };

    const response = await fetch(`${API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${env.lemonSqueezy.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new PaymentError(
        `Lemon Squeezy checkout failed (${response.status}): ${detail.slice(0, 300)}`,
        "upstream",
      );
    }

    const json = (await response.json()) as { data?: { attributes?: { url?: string } } };
    const url = json?.data?.attributes?.url;
    if (!url) throw new PaymentError("Lemon Squeezy did not return a checkout URL", "invalid_response");

    return { checkoutUrl: url, provider: this.name };
  }

  /**
   * Lemon Squeezy signs the raw request body with HMAC-SHA256 using the store's
   * webhook secret and sends it as a hex digest in `X-Signature`. The body must
   * be verified byte-for-byte before parsing, and compared in constant time.
   */
  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification {
    if (!env.lemonSqueezy.webhookSecret) {
      return { valid: false, reason: "LEMON_SQUEEZY_WEBHOOK_SECRET is not configured" };
    }
    if (!signature) return { valid: false, reason: "Missing X-Signature header" };

    const expected = crypto
      .createHmac("sha256", env.lemonSqueezy.webhookSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    const provided = signature.trim().toLowerCase();
    const expectedBuf = Buffer.from(expected, "utf8");
    const providedBuf = Buffer.from(provided, "utf8");
    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return { valid: false, reason: "Signature mismatch" };
    }

    let payload: LsPayload;
    try {
      payload = JSON.parse(rawBody) as LsPayload;
    } catch {
      return { valid: false, reason: "Body is not valid JSON" };
    }

    return {
      valid: true,
      eventName: String(payload?.meta?.event_name ?? "unknown"),
      eventId: payload?.data?.id ? String(payload.data.id) : null,
      payload,
    };
  }

  parseOrder(payload: unknown): NormalizedOrder | null {
    return normalize((payload ?? {}) as LsPayload);
  }

  async getOrder(providerOrderId: string): Promise<NormalizedOrder | null> {
    if (!env.lemonSqueezy.apiKey) {
      throw new PaymentError("LEMON_SQUEEZY_API_KEY is not configured", "not_configured");
    }
    const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(providerOrderId)}`, {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${env.lemonSqueezy.apiKey}`,
      },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new PaymentError(`Lemon Squeezy order lookup failed (${response.status})`, "upstream");
    }
    return normalize((await response.json()) as LsPayload);
  }
}

/** Exported for tests: produces the exact signature Lemon Squeezy would send. */
export function signLemonSqueezyBody(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}
