import type { ProductId } from "@/lib/env";

export type CheckoutCustomData = {
  sessionId: string;
  roastId: string;
  productType: ProductId;
};

export type CreateCheckoutArgs = {
  product: ProductId;
  customData: CheckoutCustomData;
  redirectUrl: string;
  email?: string;
};

export type CheckoutResult = {
  checkoutUrl: string;
  provider: string;
};

export type WebhookVerification =
  | { valid: true; eventName: string; eventId: string | null; payload: unknown }
  | { valid: false; reason: string };

export type NormalizedOrder = {
  providerOrderId: string;
  providerPaymentId: string | null;
  status: "paid" | "pending" | "refunded" | "failed";
  amountCents: number;
  currency: string;
  email: string | null;
  customData: Partial<CheckoutCustomData>;
};

/**
 * Payment provider abstraction. The rest of the app only ever talks to this
 * interface, so Lemon Squeezy can be swapped for Stripe/Paddle without
 * touching routes or UI.
 */
export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createCheckout(args: CreateCheckoutArgs): Promise<CheckoutResult>;
  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification;
  parseOrder(payload: unknown): NormalizedOrder | null;
  getOrder(providerOrderId: string): Promise<NormalizedOrder | null>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "upstream" | "invalid_response",
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
