"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const MESSAGES = [
  "Reading your bio...",
  "Scanning your questionable decisions...",
  "Finding the contradictions...",
  "Consulting the AI council...",
  "Locating your red flags...",
  "Judging your career choices...",
  "Checking your excuses...",
  "This is worse than expected...",
  "Preparing emotional damage...",
  "Finalizing your roast...",
];

/**
 * Purely cosmetic staging. These messages are UI only — they don't describe or
 * poll any backend step. The real work is the single in-flight API request.
 */
export function RoastLoading({ label = "Generating your roast" }: { label?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1 < MESSAGES.length ? current + 1 : current));
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const progress = Math.min(96, ((index + 1) / MESSAGES.length) * 100);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full bg-flame/30 blur-3xl"
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative text-7xl"
          animate={{ rotate: [-8, 8, -8], y: [0, -8, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          🔥
        </motion.div>
      </div>

      <p className="mt-10 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-muted">{label}</p>

      <motion.p
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 min-h-[3.5rem] font-display text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl"
      >
        {MESSAGES[index]}
      </motion.p>

      <div className="mt-8 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-flame to-ember"
          initial={{ width: "6%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </div>

      <p className="mt-6 text-sm text-muted/70">
        This usually takes 15–30 seconds. Sit with what you&apos;ve done.
      </p>
    </div>
  );
}
