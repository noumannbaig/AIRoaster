import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { PRODUCTS, env, type ProductId } from "@/lib/env";
import { apiError, apiOk } from "@/lib/http";
import { PaymentError, getPaymentProvider } from "@/lib/payments";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import { hashIp } from "@/lib/roast/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ipHash = hashIp(clientIpFrom(request.headers));
  const limited = await checkRateLimit("checkout", `ip:${ipHash}`);
  if (!limited.allowed) {
    return apiError("rate_limited", `Try again in ${limited.retryAfterSeconds}s`, {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  let body: { sessionId?: string; product?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Body must be JSON");
  }

  const product: ProductId = body.product === "ULTIMATE_ROAST" ? "ULTIMATE_ROAST" : "FULL_ROAST";
  if (!body.sessionId) return apiError("bad_request", "sessionId is required");

  const session = await prisma.roastSession.findUnique({
    where: { id: body.sessionId },
    include: { result: true },
  });
  if (!session?.result) return apiError("not_found");
  if (session.isPaid) return apiError("bad_request", "This roast has already been unlocked.");

  const provider = getPaymentProvider();

  try {
    const checkout = await provider.createCheckout({
      product,
      // Echoed back by the webhook — this is the only link between an order and
      // a roast session, so it must never be derived from client input alone.
      customData: { sessionId: session.id, roastId: session.result.id, productType: product },
      redirectUrl: `${env.appUrl}/success?session=${session.id}`,
      email: body.email,
    });

    await trackServer("checkout_started", {
      sessionId: session.id,
      props: { product, amount: PRODUCTS[product].priceCents, provider: checkout.provider },
    });

    return apiOk({ checkoutUrl: checkout.checkoutUrl, provider: checkout.provider }, { status: 201 });
  } catch (error) {
    console.error("[checkout] failed", error);
    if (error instanceof PaymentError && error.code === "not_configured") {
      return apiError("payment_failed", error.message);
    }
    return apiError("payment_failed", error instanceof Error ? error.message : "Checkout failed");
  }
}
