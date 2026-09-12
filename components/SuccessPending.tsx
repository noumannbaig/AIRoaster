"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const MAX_ATTEMPTS = 20;

/**
 * Waits for the Lemon Squeezy webhook to mark the session paid.
 *
 * We poll the server rather than trusting the checkout redirect — a user who
 * types /success?session=... by hand will simply wait here forever, which is
 * the correct outcome.
 */
export function SuccessPending({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) return;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/roast/${sessionId}`, { cache: "no-store" });
        const data = await response.json();
        if (data?.roast?.isPaid) {
          router.replace(`/roast/${sessionId}?reveal=1`);
          return;
        }
      } catch {
        // keep polling
      }
      setAttempts((n) => n + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [attempts, router, sessionId]);

  const stalled = attempts >= MAX_ATTEMPTS;

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <motion.span
        className="text-6xl"
        animate={stalled ? {} : { rotate: [-8, 8, -8] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {stalled ? "⏳" : "🔥"}
      </motion.span>

      <h1 className="mt-7 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        {stalled ? "Still waiting on the payment confirmation." : "You survived the payment."}
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {stalled
          ? "Your payment provider hasn't confirmed this order yet. If you were charged, it will unlock automatically — reload this page in a minute. Nothing is lost."
          : "Confirming with the payment provider. We only unlock your roast once the payment is verified on our side."}
      </p>

      {!stalled ? (
        <div className="mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-flame to-ember"
            animate={{ width: `${Math.min(92, 12 + attempts * 5)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => setAttempts(0)}>
            Check again
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={`/roast/${sessionId}`}>Back to my roast</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
