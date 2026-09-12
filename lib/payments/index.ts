import { LemonSqueezyProvider } from "./lemon-squeezy";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!provider) provider = new LemonSqueezyProvider();
  return provider;
}

export * from "./types";
