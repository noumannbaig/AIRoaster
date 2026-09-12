import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "fulfillment_test_secret";
process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = SECRET;

type PaymentRow = {
  sessionId: string;
  provider: string;
  providerOrderId: string;
  status: string;
};

const state = {
  session: { id: "sess_1", isPaid: false } as { id: string; isPaid: boolean } | null,
  payment: null as PaymentRow | null,
  resultUpdates: 0,
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    roastSession: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        state.session && state.session.id === where.id ? state.session : null,
      ),
      update: vi.fn(async ({ data }: { data: { isPaid?: boolean } }) => {
        if (state.session && typeof data.isPaid === "boolean") state.session.isPaid = data.isPaid;
        return state.session;
      }),
    },
    payment: {
      findUnique: vi.fn(async () => state.payment),
      upsert: vi.fn(
        async ({
          create,
          update,
        }: {
          create: PaymentRow;
          update: Partial<PaymentRow>;
        }) => {
          state.payment = state.payment ? { ...state.payment, ...update } : create;
          return state.payment;
        },
      ),
    },
    roastResult: {
      update: vi.fn(async () => {
        state.resultUpdates += 1;
        return {};
      }),
    },
    user: { upsert: vi.fn(async () => ({ id: "user_1" })) },
    analyticsEvent: { create: vi.fn(async () => ({})) },
  },
}));

const { POST } = await import("@/app/api/webhooks/lemon-squeezy/route");

function orderBody(status = "paid") {
  return JSON.stringify({
    meta: {
      event_name: status === "refunded" ? "order_refunded" : "order_created",
      custom_data: { sessionId: "sess_1", roastId: "res_1", productType: "FULL_ROAST" },
    },
    data: {
      id: "order_1",
      attributes: {
        identifier: "pay_1",
        status,
        total: 199,
        currency: "USD",
        user_email: "buyer@example.com",
      },
    },
  });
}

function request(raw: string, signature?: string) {
  return new Request("https://example.com/api/webhooks/lemon-squeezy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature === undefined
        ? { "x-signature": crypto.createHmac("sha256", SECRET).update(raw, "utf8").digest("hex") }
        : signature
          ? { "x-signature": signature }
          : {}),
    },
    body: raw,
  });
}

beforeEach(() => {
  state.session = { id: "sess_1", isPaid: false };
  state.payment = null;
  state.resultUpdates = 0;
});

describe("webhook fulfilment", () => {
  it("marks the session paid on a verified order", async () => {
    const response = await POST(request(orderBody()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, isPaid: true });
    expect(state.session?.isPaid).toBe(true);
    expect(state.payment?.status).toBe("PAID");
  });

  it("does not fulfil a request with a bad signature", async () => {
    const response = await POST(request(orderBody(), "deadbeef"));
    expect(response.status).toBe(401);
    expect(state.session?.isPaid).toBe(false);
    expect(state.payment).toBeNull();
  });

  it("treats a replayed delivery as a no-op", async () => {
    await POST(request(orderBody()));
    const updatesAfterFirst = state.resultUpdates;

    const replay = await POST(request(orderBody()));
    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({ duplicate: true });
    // The second delivery must not re-run fulfilment side effects.
    expect(state.resultUpdates).toBe(updatesAfterFirst);
  });

  it("acknowledges events it does not act on", async () => {
    const raw = JSON.stringify({
      meta: { event_name: "subscription_created", custom_data: {} },
      data: { id: "sub_1", attributes: {} },
    });
    const response = await POST(request(raw));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ignored: "subscription_created" });
    expect(state.session?.isPaid).toBe(false);
  });

  it("rejects an order with no sessionId in custom data", async () => {
    const raw = JSON.stringify({
      meta: { event_name: "order_created", custom_data: {} },
      data: { id: "order_2", attributes: { status: "paid", total: 199, currency: "USD" } },
    });
    const response = await POST(request(raw));
    expect(response.status).toBe(400);
    expect(state.session?.isPaid).toBe(false);
  });

  it("revokes access when an order is refunded", async () => {
    await POST(request(orderBody()));
    expect(state.session?.isPaid).toBe(true);

    const refund = await POST(request(orderBody("refunded")));
    expect(refund.status).toBe(200);
    expect(state.session?.isPaid).toBe(false);
    expect(state.payment?.status).toBe("REFUNDED");
  });
});
