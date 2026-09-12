"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";

export function ScoreDial({ score, label }: { score: number; label: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => setDisplay(Math.round(value)),
    });
    return () => controls.stop();
  }, [score]);

  const circumference = 2 * Math.PI * 54;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-7">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#score-gradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="score-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffb347" />
              <stop offset="55%" stopColor="#ff5a1f" />
              <stop offset="100%" stopColor="#ff2d78" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-extrabold tabular-nums text-chalk">
            {display}
          </span>
          <span className="text-xs font-semibold text-muted/70">/100</span>
        </div>
      </div>

      <div className="text-center sm:text-left">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted">
          Your overall score
        </p>
        <p className="mt-2 font-display text-2xl font-extrabold leading-tight text-gradient-flame sm:text-3xl">
          {label}
        </p>
      </div>
    </div>
  );
}
