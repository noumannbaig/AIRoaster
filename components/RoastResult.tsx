"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { EmailCapture } from "@/components/EmailCapture";
import { Paywall } from "@/components/Paywall";
import { ScoreDial } from "@/components/ScoreDial";
import { ShareButtons } from "@/components/ShareButtons";
import { ShareCard } from "@/components/ShareCard";
import { track } from "@/lib/analytics/client";
import type { RoastView } from "@/lib/roast/service";

const reveal = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Section({
  index,
  eyebrow,
  title,
  children,
}: {
  index: number;
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      custom={index}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
    >
      <Card className="hover:border-flame/30">
        {eyebrow ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
        {title ? <CardTitle className="mt-2">{title}</CardTitle> : null}
        <div className="mt-4 space-y-4 text-[0.975rem] leading-relaxed text-muted">{children}</div>
      </Card>
    </motion.section>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
    </>
  );
}

function FlagList({ items, emoji }: { items: string[]; emoji: string }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          className="flex gap-3 rounded-xl border border-edge bg-white/[0.025] px-4 py-3"
        >
          <span className="shrink-0">{emoji}</span>
          <span className="text-chalk/90">{item}</span>
        </motion.li>
      ))}
    </ul>
  );
}

export function RoastResult({
  roast,
  scoreLabel,
  priceLabel,
  revealPremium = false,
}: {
  roast: RoastView;
  scoreLabel: string;
  priceLabel: string;
  revealPremium?: boolean;
}) {
  const [revealed, setRevealed] = useState(!revealPremium);

  useEffect(() => {
    if (roast.isPaid) {
      if (revealed) track("premium_roast_revealed", {}, roast.id);
    } else {
      track("free_result_viewed", { score: roast.overallScore }, roast.id);
    }
  }, [roast.id, roast.isPaid, roast.overallScore, revealed]);

  if (roast.isPaid && !revealed) {
    return (
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col items-center justify-center px-5 text-center">
        <motion.div
          className="text-7xl"
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🔥
        </motion.div>
        <h1 className="mt-8 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          You survived the payment.
        </h1>
        <p className="mt-4 text-lg text-muted">Your full roast is ready.</p>
        <Button size="xl" className="mt-9 w-full sm:w-auto" onClick={() => setRevealed(true)}>
          Reveal Everything 💀
        </Button>
        <p className="mt-4 text-sm text-muted/70">Okay. This is getting uncomfortable.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:pt-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-flame">
          🔥 Your AI roast
        </p>
      </motion.div>

      <Card className="noise-panel glow-flame mt-8 border-edge">
        <ScoreDial score={roast.overallScore} label={scoreLabel} />
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="glass-card mt-4 rounded-3xl p-6 sm:p-8"
      >
        <CardEyebrow>The headline</CardEyebrow>
        <p className="mt-3 font-display text-2xl font-extrabold leading-snug tracking-tight text-chalk sm:text-4xl">
          &ldquo;{roast.headline}&rdquo;
        </p>
      </motion.div>

      <div className="mt-4 space-y-4">
        <Section index={0} eyebrow="The roast" title="Here's what we found">
          <Paragraphs text={roast.isPaid ? roast.brutalSummary : roast.roast} />
        </Section>

        <Section
          index={1}
          eyebrow={roast.isPaid ? "All of them" : "The ones we'll show you free"}
          title="Your red flags 🚩"
        >
          <FlagList items={roast.redFlags} emoji="🚩" />
        </Section>

        <Section index={2} eyebrow="Credit where it's due" title="Your green flags 🟢">
          <FlagList items={roast.greenFlags} emoji="🟢" />
        </Section>

        <Section index={3} eyebrow="Protagonist syndrome" title="Main character energy">
          <Paragraphs text={roast.mainCharacterEnergy} />
        </Section>

        <AnimatePresence>
          {roast.isPaid ? (
            <>
              <Section index={4} eyebrow="Premium" title="Your career roast 💼">
                <Paragraphs text={roast.careerRoast} />
              </Section>
              <Section index={5} eyebrow="Premium · not financial advice" title="Your money personality 💸">
                <Paragraphs text={roast.moneyRoast} />
              </Section>
              <Section index={6} eyebrow="Premium" title="Your social roast 📱">
                <Paragraphs text={roast.socialRoast} />
              </Section>
              <Section index={7} eyebrow="Premium" title="Your dating roast 💔">
                <Paragraphs text={roast.datingRoast} />
              </Section>
              <Section index={8} eyebrow="Premium · fiction, for entertainment" title="Your main character arc 🎬">
                <Paragraphs text={roast.mainCharacterArc} />
              </Section>
              <Section index={9} eyebrow="Premium" title="Your biggest self-sabotage pattern 🌀">
                <Paragraphs text={roast.selfSabotage} />
              </Section>
              <Section
                index={10}
                eyebrow="Premium · humorous speculation"
                title="What your friends would roast you for 👀"
              >
                <FlagList items={roast.friendsWouldRoast} emoji="💬" />
              </Section>

              <motion.section
                custom={11}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-70px" }}
              >
                <div className="noise-panel glow-ember rounded-3xl border border-edge p-7 sm:p-9">
                  <CardEyebrow className="text-ember">The final verdict</CardEyebrow>
                  <p className="mt-3 font-display text-xl font-extrabold leading-snug text-chalk sm:text-3xl">
                    {roast.finalVerdict}
                  </p>
                </div>
              </motion.section>
            </>
          ) : null}
        </AnimatePresence>
      </div>

      {!roast.isPaid ? (
        <Paywall sessionId={roast.id} lockedSections={roast.lockedSections} priceLabel={priceLabel} />
      ) : null}

      <section className="mt-14">
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
            Make it everyone else&apos;s problem
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            The card below is generated from your result. It is, unfortunately, very postable.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <ShareCard sessionId={roast.id} score={roast.overallScore} />
          <div className="space-y-4">
            <ShareButtons sessionId={roast.id} score={roast.overallScore} />
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="font-display text-base font-bold text-chalk">
                Think your friend can survive this?
              </p>
              <Button asChild variant="acid" size="md" className="mt-4 w-full">
                <Link
                  href={`/roast?ref=${roast.id}`}
                  onClick={() => track("friend_roast_clicked", {}, roast.id)}
                >
                  Roast a Friend 🔥
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {!roast.isPaid ? (
        <div className="mt-10">
          <EmailCapture sessionId={roast.id} />
        </div>
      ) : null}

      <p className="mt-10 text-center text-xs leading-relaxed text-muted/60">
        Generated by AI from the information you supplied. Entertainment only — not advice, not a
        diagnosis, and not a prediction about anyone&apos;s actual life.
      </p>
    </div>
  );
}
