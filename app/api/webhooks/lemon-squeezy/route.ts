import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FULFILLING_EVENTS = new Set(["order_created", "order_refunded"]);

/**
 * Lemon Squeezy webhook — the only place a roast is ever marked paid.
 *
 * Flow:
 *  1. Read the RAW body (signature covers the exact bytes, so never re-serialise).
 *  2. Verify the HMAC-SHA256 signature in constant time.
 *  3. Resolve the roast session from meta.custom_data.
 *  4. Upsert the Payment row — the (provider, providerOrderId) unique index makes
 *     duplicate deliveries idempotent.
 *  5. Flip session.isPaid, which is what unlocks the premium fields in the API.
 *
 * Returning 200 for already-fulfilled orders stops Lemon Squeezy retrying.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const provider = getPaymentProvider();
  const verification = provider.verifyWebhook(rawBody, signature);

  if (!verification.valid) {
    console.warn("[webhook] rejected:", verification.reason);
    return apiError("unauthorized", verification.reason);
  }

  if (!FULFILLING_EVENTS.has(verification.eventName)) {
    // Acknowledge events we don't act on so they aren't retried forever.
    return apiOk({ ok: true, ignored: verification.eventName });
  }

  const order = provider.parseOrder(verification.payload);
  if (!order) return apiError("bad_request", "Webhook payload had no order data");

  const sessionId = order.customData.sessionId;
  if (!sessionId) return apiError("bad_request", "Webhook payload had no sessionId in custom_data");

  const session = await prisma.roastSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    console.warn("[webhook] unknown session", sessionId);
    return apiError("not_found", "No roast session for that order");
  }

  const existing = await prisma.payment.findUnique({
    where: {
      provider_providerOrderId: { provider: provider.name, providerOrderId: order.providerOrderId },
    },
  });

  if (existing && existing.status === "PAID" && order.status === "paid") {
    return apiOk({ ok: true, duplicate: true, sessionId });
  }

  const status =
    order.status === "paid" ? "PAID" : order.status === "refunded" ? "REFUNDED" : "PENDING";

  await prisma.payment.upsert({
    where: {
      provider_providerOrderId: { provider: provider.name, providerOrderId: order.providerOrderId },
    },
    create: {
      sessionId: session.id,
      provider: provider.name,
      providerOrderId: order.providerOrderId,
      providerPaymentId: order.providerPaymentId,
      providerEventId: verification.eventId,
      product: order.customData.productType ?? "FULL_ROAST",
      amount: order.amountCents,
      currency: order.currency,
      status,
    },
    update: {
      status,
      providerPaymentId: order.providerPaymentId,
      providerEventId: verification.eventId,
    },
  });

  const isPaid = order.status === "paid";
  await prisma.roastSession.update({ where: { id: session.id }, data: { isPaid } });

  if (isPaid) {
    // Timestamp the moment premium content became legitimately accessible.
    await prisma.roastResult
      .update({ where: { sessionId: session.id }, data: { premiumGeneratedAt: new Date() } })
      .catch(() => undefined);
  }

  if (order.email) {
    await prisma.user
      .upsert({ where: { email: order.email }, create: { email: order.email }, update: {} })
      .then((user) => prisma.roastSession.update({ where: { id: session.id }, data: { userId: user.id } }))
      .catch(() => undefined);
  }

  if (isPaid) {
    await trackServer("checkout_completed", {
      sessionId: session.id,
      props: {
        product: order.customData.productType ?? "FULL_ROAST",
        amount: order.amountCents,
        currency: order.currency,
      },
    });
  }

  return apiOk({ ok: true, sessionId: session.id, isPaid });
}
