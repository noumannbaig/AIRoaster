"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/client";

/**
 * Opens a Lemon Squeezy hosted checkout. The redirect back to /success proves
 * nothing on its own — premium content is only unlocked by the verified
 * webhook, so this button never touches entitlement state.
 */
export function PaymentButton({
  sessionId,
  priceLabel = "$1.99",
  product = "FULL_ROAST",
}: {
  sessionId: string;
  priceLabel?: string;
  product?: "FULL_ROAST" | "ULTIMATE_ROAST";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    track("checkout_started", { product }, sessionId);

    try {
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, product }),
      });
      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        setError(data?.error?.detail ?? data?.error?.message ?? "Checkout didn't open.");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network hiccup. Nothing was charged. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Button size="xl" className="w-full" disabled={loading} onClick={startCheckout}>
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Opening checkout…
          </>
        ) : (
          `Unlock My Full Roast — ${priceLabel}`
        )}
      </Button>
      {error ? (
        <p className="mt-3 rounded-xl border border-ember/40 bg-ember/10 px-4 py-2.5 text-sm text-ember">
          {error}
        </p>
      ) : null}
    </div>
  );
}
