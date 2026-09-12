import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What RoastMe AI collects, why, and how long it keeps it.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-14">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Privacy</h1>
        <p className="mt-3 text-sm text-muted/70">
          Plain-language summary of what this MVP actually does. No lawyer wrote this, and it makes
          no claims the code doesn&apos;t back up.
        </p>

        <div className="mt-10 space-y-8 text-[0.975rem] leading-relaxed text-muted">
          <Section title="What we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                The text you submit to be roasted (pasted profiles/bios and anything you type about
                yourself).
              </li>
              <li>Any screenshots you upload.</li>
              <li>The generated roast.</li>
              <li>
                An anonymous session identifier stored in a cookie, plus a one-way hash of your IP
                address used only for rate limiting.
              </li>
              <li>
                Anonymous funnel events (for example &ldquo;paywall viewed&rdquo;). These contain no
                free-text you wrote.
              </li>
              <li>An email address only if you explicitly type one into the optional save form.</li>
            </ul>
          </Section>

          <Section title="Why we collect it">
            Your input is sent to OpenAI to generate the roast. Everything is stored so your roast
            still works when you refresh or come back later, and so a paid roast stays unlocked.
            Funnel events tell us whether the product works at all.
          </Section>

          <Section title="Who we send it to">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-chalk">OpenAI</strong> — receives your submitted text and any
                screenshots in order to generate the roast.
              </li>
              <li>
                <strong className="text-chalk">Lemon Squeezy</strong> — handles payment if you buy the
                full roast. They collect your payment details directly. We never see or store card
                data.
              </li>
              <li>
                An analytics provider, if the operator configured one. By default, events are stored
                only in this app&apos;s own database.
              </li>
            </ul>
          </Section>

          <Section title="How long we keep it">
            Uploaded screenshots are deleted automatically after the retention window configured by
            the operator (24 hours by default) using the cleanup endpoint shipped with this app.
            Roast text and results are kept until you ask for deletion.
          </Section>

          <Section title="Deleting your data">
            Email the operator of this deployment with your roast URL and ask for deletion. Deleting a
            roast session removes its result, payment records and share links. If you paid, the
            payment record itself may be retained by Lemon Squeezy for their own accounting
            obligations.
          </Section>

          <Section title="Cookies">
            One cookie: an anonymous session token so your roasts are associated with your browser.
            No advertising cookies and no cross-site tracking.
          </Section>

          <Section title="Children">
            This is not intended for anyone under 13.
          </Section>

          <Section title="Contact">
            This deployment is served from{" "}
            <span className="text-chalk">{env.appUrl}</span>. Its operator is responsible for
            responding to data requests.
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
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
