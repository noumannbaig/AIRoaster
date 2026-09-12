"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  useEffect(() => {
    track("landing_page_view");
  }, []);

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
      {/* ambient light */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-18rem] size-[42rem] -translate-x-1/2 rounded-full bg-flame/20 blur-[140px] animate-pulse-glow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12rem] top-24 size-[28rem] rounded-full bg-plasma/20 blur-[130px]"
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-flame/30 bg-flame/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-flame sm:text-xs">
            🔥 AI-powered personal roasting
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="mt-7 font-display text-[2.75rem] font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]"
        >
          Your life
          <br />
          deserves a <span className="text-gradient-flame">roast.</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
        >
          Give us a little information about yourself. We&apos;ll use AI to tell you what your friends
          are too nice to say.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
        >
          <Button asChild size="xl" className="w-full sm:w-auto">
            <Link href="/roast" onClick={() => track("roast_started", { source: "hero" })}>
              Roast Me 🔥
            </Link>
          </Button>
          <Button asChild size="xl" variant="secondary" className="w-full sm:w-auto">
            <Link href="#example">See an example</Link>
          </Button>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="show"
          custom={4}
          variants={fadeUp}
          className="mt-5 text-sm text-muted/80"
        >
          Takes ~30 seconds. Your dignity may not survive.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 w-full"
        >
          <HeroPreviewCard />
        </motion.div>
      </div>
    </section>
  );
}

function HeroPreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-6 h-24 rounded-full bg-ember/25 blur-3xl"
      />
      <div className="noise-panel glow-flame relative overflow-hidden rounded-[2rem] border border-edge p-7 text-left sm:p-9">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-muted">
          Roastme AI · Score
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-6xl font-extrabold text-gradient-flame sm:text-7xl">
            81
          </span>
          <span className="font-display text-2xl font-bold text-muted/60">/100</span>
        </div>
        <p className="mt-1 text-sm font-medium text-acid">Deeply roastable. Your friends were right.</p>

        <p className="mt-6 font-display text-xl font-bold leading-snug text-chalk sm:text-2xl">
          &ldquo;You&apos;ve optimized every system in your life except the one that ships
          things.&rdquo;
        </p>

        <div className="mt-6 space-y-2.5 text-sm text-muted">
          <p className="flex gap-2.5">
            <span>🚩</span>
            <span>You call opening eleven tabs &ldquo;doing research.&rdquo;</span>
          </p>
          <p className="flex gap-2.5">
            <span>🚩</span>
            <span>Your five-year plan changes every Tuesday.</span>
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-white/5 pt-5">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/70">
            roastme.ai
          </span>
          <span className="text-xs text-muted/70">Example output</span>
        </div>
      </div>
    </div>
  );
}
