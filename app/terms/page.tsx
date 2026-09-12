import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms",
  description: "The short version of what you're agreeing to by using RoastMe AI.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Terms</h1>
        <p className="mt-3 text-sm text-muted/70">
          Short, honest MVP terms. Not legal advice, and not a substitute for terms reviewed by a
          lawyer before you run this commercially.
        </p>

        <div className="mt-10 space-y-8 text-[0.975rem] leading-relaxed text-muted">
          <Section title="This is entertainment">
            Every roast is AI-generated comedy based on what you typed. It is not a personality
            assessment, psychological evaluation, medical opinion, legal opinion, financial advice, or
            a prediction about your future. Do not make decisions based on it.
          </Section>

          <Section title="What you submit">
            You are responsible for what you put in. Only submit information about other people if you
            have their permission and they&apos;d find it funny. Do not use this to harass, defame or
            expose anyone.
          </Section>

          <Section title="What we won't generate">
            The system is instructed to refuse hateful content, slurs, attacks on protected
            characteristics, threats, sexual content, doxxing, and serious accusations about real
            people. If something slips through, stop using it and report it to the operator.
          </Section>

          <Section title="Payments">
            The full roast is a one-time payment of $1.99, processed by Lemon Squeezy. It is not a
            subscription and nothing recurs. Access unlocks only after the payment provider confirms
            the order. Because the product is delivered instantly and in full, refunds are at the
            operator&apos;s discretion — contact them if something went wrong.
          </Section>

          <Section title="Availability">
            This is an MVP. It can go down, change, or lose data. There is no uptime guarantee and no
            warranty of any kind.
          </Section>

          <Section title="Liability">
            To the maximum extent permitted by law, the operator is not liable for any damages arising
            from your use of this site, including hurt feelings.
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-chalk">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
