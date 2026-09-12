import crypto from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const SECRET = "test_webhook_secret_value";

beforeAll(() => {
  process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = SECRET;
  process.env.LEMON_SQUEEZY_API_KEY = "test_api_key";
  process.env.LEMON_SQUEEZY_STORE_ID = "1234";
  process.env.LEMON_SQUEEZY_VARIANT_ID_FULL_ROAST = "5678";
});

async function provider() {
  const { LemonSqueezyProvider } = await import("@/lib/payments/lemon-squeezy");
  return new LemonSqueezyProvider();
}

function body(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    meta: {
      event_name: "order_created",
      custom_data: { sessionId: "sess_123", roastId: "roast_123", productType: "FULL_ROAST" },
    },
    data: {
      id: "order_987",
      attributes: {
        identifier: "pay_abc",
        status: "paid",
        total: 199,
        currency: "USD",
        user_email: "buyer@example.com",
      },
    },
    ...overrides,
  });
}

function sign(raw: string, secret = SECRET) {
  return crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
}

describe("Lemon Squeezy webhook signature verification", () => {
  it("accepts a correctly signed body", async () => {
    const raw = body();
    const result = (await provider()).verifyWebhook(raw, sign(raw));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.eventName).toBe("order_created");
  });

  it("rejects a missing signature", async () => {
    const result = (await provider()).verifyWebhook(body(), null);
    expect(result).toMatchObject({ valid: false });
  });

  it("rejects a signature made with the wrong secret", async () => {
    const raw = body();
    const result = (await provider()).verifyWebhook(raw, sign(raw, "not_the_secret"));
    expect(result).toMatchObject({ valid: false, reason: "Signature mismatch" });
  });

  it("rejects a tampered body even when the old signature is reused", async () => {
    const original = body();
    const signature = sign(original);
    const tampered = original.replace('"total":199', '"total":1');
    const result = (await provider()).verifyWebhook(tampered, signature);
    expect(result).toMatchObject({ valid: false });
  });

  it("rejects a truncated signature rather than throwing", async () => {
    const raw = body();
    const result = (await provider()).verifyWebhook(raw, sign(raw).slice(0, 10));
    expect(result).toMatchObject({ valid: false });
  });

  it("normalises the order payload", async () => {
    const raw = body();
    const verified = (await provider()).verifyWebhook(raw, sign(raw));
    expect(verified.valid).toBe(true);
    if (!verified.valid) return;

    const order = (await provider()).parseOrder(verified.payload);
    expect(order).toMatchObject({
      providerOrderId: "order_987",
      providerPaymentId: "pay_abc",
      status: "paid",
      amountCents: 199,
      currency: "USD",
      email: "buyer@example.com",
    });
    expect(order?.customData.sessionId).toBe("sess_123");
  });

  it("maps a refund to refunded status", async () => {
    const raw = JSON.stringify({
      meta: { event_name: "order_refunded", custom_data: { sessionId: "sess_123" } },
      data: { id: "order_987", attributes: { status: "refunded", total: 199, currency: "USD" } },
    });
    const verified = (await provider()).verifyWebhook(raw, sign(raw));
    expect(verified.valid).toBe(true);
    if (!verified.valid) return;
    expect((await provider()).parseOrder(verified.payload)?.status).toBe("refunded");
  });

  it("ignores custom data it does not recognise", async () => {
    const raw = JSON.stringify({
      meta: { event_name: "order_created", custom_data: { productType: "SOMETHING_ELSE" } },
      data: { id: "o1", attributes: { status: "paid", total: 199, currency: "USD" } },
    });
    const order = (await provider()).parseOrder(JSON.parse(raw));
    expect(order?.customData.productType).toBeUndefined();
    expect(order?.customData.sessionId).toBeUndefined();
  });
});
