"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { track } from "@/lib/analytics/client";

const FALLBACK_SECTIONS = [
  "Your biggest red flag",
  "What your friends probably think about you",
  "Your career trajectory",
  "Your money personality",
  "Your dating personality",
  "Your biggest self-sabotage pattern",
  "Your final verdict",
];

/** Blurred filler. Never rendered from real premium copy — the client is never
 * sent the locked content in the first place. */
const BLUR_LINES = [
  "████ ███████ ██ ████ ███████ ████████ ██ ███ ████████████ ███ ████",
  "███████ ████ ███ ████████ ███ ██████ ████████ ██ ████ ███████",
  "██ █████████ ███ ████ ███████ ████ ██████████ ███",
];

export function Paywall({
  sessionId,
  lockedSections,
  priceLabel = "$1.99",
}: {
  sessionId: string;
  lockedSections: string[];
  priceLabel?: string;
}) {
  const sections = lockedSections.length > 0 ? lockedSections : FALLBACK_SECTIONS;

  useEffect(() => {
    track("paywall_viewed", {}, sessionId);
  }, [sessionId]);

  return (
    <section className="relative mt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 size-[30rem] -translate-x-1/2 rounded-full bg-ember/20 blur-[120px]"
      />

      <div className="relative text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl"
        >
          Wait. We found more. 💀
        </motion.h2>
        <p className="mx-auto mt-4 max-w-md text-base text-muted">
          The free roast only scratched the surface.
        </p>
      </div>

      <div className="relative mt-10 grid gap-4 sm:grid-cols-2">
        {sections.map((title, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="glass-card group relative overflow-hidden rounded-2xl p-5"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="size-4 shrink-0 text-flame" />
              <p className="font-display text-base font-bold text-chalk">{title}</p>
            </div>
            <div className="mt-3 space-y-2 select-none blur-[6px]" aria-hidden>
              {BLUR_LINES.slice(0, 2 + (i % 2)).map((line, j) => (
                <p key={j} className="text-sm leading-relaxed text-muted/60">
                  {line}
                </p>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card to-transparent" />
          </motion.div>
        ))}
      </div>

      <div className="noise-panel glow-ember relative mt-10 overflow-hidden rounded-[2rem] border border-edge px-6 py-10 text-center sm:px-12 sm:py-14">
        <p className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
          You&apos;re going to want to sit down for this.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Seven more sections, five to seven red flags, and a final verdict that people usually
          screenshot and send to their group chat.
        </p>

        <div className="mt-8 flex justify-center">
          <PaymentButton sessionId={sessionId} priceLabel={priceLabel} />
        </div>

        <p className="mt-4 text-sm text-muted/80">
          One-time payment. No subscription. No nonsense.
        </p>
      </div>
    </section>
  );
}
