import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SuccessPending } from "@/components/SuccessPending";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You survived the payment",
  robots: { index: false, follow: false },
};

/**
 * Post-checkout landing page.
 *
 * Reaching this URL grants nothing. We read `isPaid` from the database, which
 * is only ever set by the verified Lemon Squeezy webhook. If the webhook hasn't
 * landed yet (it usually takes a second or two) we poll rather than assume.
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
          <span className="text-6xl">🧾</span>
          <h1 className="mt-7 font-display text-3xl font-extrabold tracking-tight">
            We can&apos;t tell which roast this was.
          </h1>
          <p className="mt-4 text-sm text-muted">
            Open the link to your roast again — if your payment went through, it will be unlocked
            there.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/">Back home</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const session = await prisma.roastSession.findUnique({ where: { id: sessionId } });
  if (!session) redirect("/");

  if (session.isPaid) redirect(`/roast/${session.id}?reveal=1`);

  return (
    <>
      <Navbar />
      <main className="relative">
        <SuccessPending sessionId={session.id} />
      </main>
      <Footer />
    </>
  );
}
