import Link from "next/link";
import { Card, CardBody, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ROAST_CATEGORIES, ROAST_CATEGORY_LABELS } from "@/lib/ai/schema";
import { PRODUCTS } from "@/lib/env";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge className="border-flame/25 bg-flame/10 text-flame">{eyebrow}</Badge>
      <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-muted">{subtitle}</p> : null}
    </div>
  );
}

const REACTIONS = [
  {
    quote: "I gave it my LinkedIn and somehow it knew I haven't updated my CV since 2022.",
    handle: "@example_user",
  },
  { quote: "The career roast was personal 💀", handle: "@example_user" },
  { quote: "I paid $1 just to find out what else it knew.", handle: "@example_user" },
];

export function SocialProof() {
  return (
    <section className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          eyebrow="Example reactions"
          title="What people would say"
          subtitle="These are illustrative examples written by us, not real user testimonials. When real ones exist, they'll replace these."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {REACTIONS.map((r) => (
            <Card key={r.quote} className="hover:border-flame/40">
              <p className="font-display text-lg font-semibold leading-snug text-chalk">
                &ldquo;{r.quote}&rdquo;
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted/60">
                {r.handle} · example
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Hand over the evidence",
    body: "Paste a bio, a profile, a resume, a dating prompt. Upload screenshots. Or just describe yourself and hope for mercy.",
  },
  {
    n: "02",
    title: "Pick how much you can take",
    body: "Gentle, Savage, or Absolutely Unhinged. Then choose the angles — career, money, dating, or all of it at once.",
  },
  {
    n: "03",
    title: "Read it. Then send it to someone.",
    body: "You get a score, a headline, your red flags, and a share card that looks good enough to post at 1 AM.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to emotional damage"
          subtitle="No account. No OAuth. No 14-step onboarding flow. You type things, we judge them."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.n} className="group relative overflow-hidden hover:border-flame/40">
              <span className="font-display text-5xl font-extrabold text-white/5 transition-colors duration-300 group-hover:text-flame/20">
                {step.n}
              </span>
              <CardTitle className="mt-3">{step.title}</CardTitle>
              <CardBody className="mt-3">{step.body}</CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExampleRoast() {
  return (
    <section id="example" className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeading
          eyebrow="Example roast"
          title="This is what you're signing up for"
          subtitle="A real output shape, generated from a sample bio. Yours will be about you, which is worse."
        />

        <Card className="noise-panel mt-12 border-edge p-7 sm:p-10">
          <CardEyebrow>Sample input</CardEyebrow>
          <p className="mt-2 rounded-2xl border border-edge bg-ink/60 p-4 text-sm italic leading-relaxed text-muted">
            &ldquo;27, product manager, three side projects, gym four times a week (in theory), 400
            unread emails, currently learning Rust.&rdquo;
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div>
              <CardEyebrow>Score</CardEyebrow>
              <p className="font-display text-6xl font-extrabold text-gradient-flame">78</p>
              <p className="text-sm text-muted/70">/100</p>
            </div>
            <div>
              <CardEyebrow>Headline</CardEyebrow>
              <p className="mt-2 font-display text-2xl font-bold leading-snug text-chalk sm:text-3xl">
                &ldquo;You&apos;re learning Rust to avoid replying to 400 emails, and honestly,
                respect.&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-[0.975rem] leading-relaxed text-muted">
            <p>
              Three side projects is not a personality, it&apos;s a backlog. You talk about them the
              way people talk about a gym membership: present tense, high energy, zero attendance.
              &ldquo;In theory&rdquo; is doing so much work in that sentence it deserves overtime.
            </p>
            <p>
              And the 400 unread emails — that&apos;s not a number, that&apos;s a coping mechanism.
              You&apos;ve decided that if you never open them, the requests inside technically never
              happened. Meanwhile you&apos;re learning a systems programming language famous for
              yelling at you about ownership. Something to think about.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <CardEyebrow>Red flags 🚩</CardEyebrow>
              <ul className="mt-3 space-y-2.5 text-sm text-muted">
                <li className="flex gap-2.5">
                  <span>🚩</span>
                  <span>You describe unstarted projects in the present tense.</span>
                </li>
                <li className="flex gap-2.5">
                  <span>🚩</span>
                  <span>&ldquo;Four times a week&rdquo; has an asterisk you did not write.</span>
                </li>
              </ul>
            </div>
            <div>
              <CardEyebrow>Green flags 🟢</CardEyebrow>
              <ul className="mt-3 space-y-2.5 text-sm text-muted">
                <li className="flex gap-2.5">
                  <span>🟢</span>
                  <span>You keep starting things. Most people quit starting.</span>
                </li>
                <li className="flex gap-2.5">
                  <span>🟢</span>
                  <span>You were honest enough to write &ldquo;in theory.&rdquo;</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-9 flex flex-col items-start gap-3 border-t border-white/5 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Yours is going to be worse. That&apos;s the point.</p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/roast">Roast me 🔥</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function Categories() {
  return (
    <section className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          eyebrow="Roast categories"
          title="Pick your damage"
          subtitle="Choose one, choose several, or choose Full Life Roast and find out what that says about you."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROAST_CATEGORIES.map((key) => {
            const c = ROAST_CATEGORY_LABELS[key];
            return (
              <Card
                key={key}
                className="group flex items-start gap-4 p-5 hover:border-flame/40 sm:p-6"
              >
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
                  {c.emoji}
                </span>
                <div>
                  <p className="font-display text-base font-bold text-chalk">{c.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{c.blurb}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const SAMPLE_CARDS = [
  {
    score: 91,
    quote: "You have 11 ideas and somehow all of them are waiting for Monday.",
    label: "Beyond saving.",
  },
  {
    score: 64,
    quote: "You're not indecisive. You're just running a very long A/B test on your own life.",
    label: "Roastable, charmingly.",
  },
  {
    score: 83,
    quote: "Your budget is a vibe and your vibe is expensive.",
    label: "Deeply roastable.",
  },
];

export function SampleShareCards() {
  return (
    <section className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          eyebrow="Share cards"
          title="Built to be screenshotted"
          subtitle="Every roast comes with a downloadable PNG card. It is, unfortunately, quite postable."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SAMPLE_CARDS.map((card) => (
            <div
              key={card.score}
              className="noise-panel relative overflow-hidden rounded-3xl border border-edge p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted">
                Roastme AI
              </p>
              <p className="mt-4 font-display text-5xl font-extrabold text-gradient-flame">
                {card.score}
                <span className="text-2xl text-muted/50">/100</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-acid">{card.label}</p>
              <p className="mt-5 font-display text-base font-semibold leading-snug text-chalk">
                &ldquo;{card.quote}&rdquo;
              </p>
              <p className="mt-6 text-[0.65rem] uppercase tracking-[0.2em] text-muted/60">
                roastme.ai
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-5xl">
        <SectionHeading
          eyebrow="Pricing"
          title="The free one already hurts"
          subtitle="One-time payment. No subscription. No nonsense. No surprise renewal in eleven months."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardEyebrow>Free roast</CardEyebrow>
            <p className="mt-3 font-display text-5xl font-extrabold">$0</p>
            <CardBody className="mt-4 flex-1">
              <ul className="space-y-2.5">
                <li>Your roastability score</li>
                <li>Your headline</li>
                <li>2–3 paragraph roast</li>
                <li>3 red flags, 2 green flags</li>
                <li>Main character energy</li>
              </ul>
            </CardBody>
            <Button asChild variant="secondary" size="lg" className="mt-7">
              <Link href="/roast">Start free 🔥</Link>
            </Button>
          </Card>

          <Card className="noise-panel glow-flame relative flex flex-col border-flame/40">
            <span className="absolute right-6 top-6 rounded-full bg-flame px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white">
              Most regretted
            </span>
            <CardEyebrow className="text-flame">Full roast</CardEyebrow>
            <p className="mt-3 font-display text-5xl font-extrabold">
              {PRODUCTS.FULL_ROAST.label}
              <span className="ml-2 text-base font-semibold text-muted">once</span>
            </p>
            <CardBody className="mt-4 flex-1 text-chalk/85">
              <ul className="space-y-2.5">
                <li>Everything in the free roast</li>
                <li>The brutal summary (2–4 paragraphs)</li>
                <li>5–7 red flags, 3–5 green flags</li>
                <li>Career, money, dating and social roasts</li>
                <li>Your self-sabotage pattern</li>
                <li>What your friends would roast you for</li>
                <li>Your main character arc + final verdict</li>
              </ul>
            </CardBody>
            <Button asChild size="lg" className="mt-7">
              <Link href="/roast">Get roasted properly 💀</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is this actually AI?",
    a: "Yes. Your input is sent to an OpenAI model with a system prompt that tells it to be funny, specific and safe. There are no pre-written roasts — every result is generated for what you typed.",
  },
  {
    q: "Is this serious?",
    a: "No. This is entertainment. It is not a personality assessment, not psychology, not career advice and not financial advice. The AI only knows the text and screenshots you gave it.",
  },
  {
    q: "Do you store my information?",
    a: "Yes, so your roast still works when you refresh or come back later. We store what you submit, the generated roast, and anonymous funnel events. Uploaded screenshots are deleted automatically after the retention window set by the operator (24 hours by default). You can request deletion — see the privacy page.",
  },
  {
    q: "Can I roast someone else?",
    a: "You can, and the flow supports it. Only submit information you actually have permission to share, and keep it to people who'd laugh. We don't accept information intended to harass anyone.",
  },
  {
    q: "Do I need an account?",
    a: "No. You get an anonymous session and that's it. You can optionally leave an email to save your roast — nothing is emailed to you unless you ask for it.",
  },
  {
    q: "Is the $1.99 a subscription?",
    a: "No. It's a single one-time payment for that one roast, processed by Lemon Squeezy. There is nothing to cancel, because there is nothing recurring.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-5 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions you should be asking" />
        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-5 pb-24 pt-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="noise-panel glow-ember relative overflow-hidden rounded-[2.5rem] border border-edge px-7 py-14 text-center sm:px-14 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/25 blur-[110px]"
          />
          <h2 className="relative font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            We&apos;re about to <span className="text-gradient-flame">find out.</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-md text-base text-muted sm:text-lg">
            Thirty seconds. One honest paragraph about yourself. An outcome you cannot un-read.
          </p>
          <Button asChild size="xl" className="relative mt-9 w-full sm:w-auto">
            <Link href="/roast">Roast Me 🔥</Link>
          </Button>
          <p className="relative mt-4 text-sm text-muted/70">Your dignity is optional.</p>
        </div>
      </div>
    </section>
  );
}
