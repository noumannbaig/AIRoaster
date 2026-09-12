import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { scoreLabel } from "@/lib/roast/service";

export const dynamic = "force-dynamic";

async function loadShare(token: string) {
  return prisma.share.findUnique({
    where: { shareToken: token },
    include: { session: { include: { result: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const share = await loadShare(token);
  const result = share?.session.result;

  if (!result) return { title: "Roast not found" };

  const image = `${env.appUrl}/api/share-card/${token}`;
  return {
    title: `Someone scored ${result.overallScore}/100`,
    description: result.shareableQuote,
    openGraph: {
      title: `AI just roasted my life 💀 ${result.overallScore}/100`,
      description: result.shareableQuote,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

/**
 * Public friend link. Shows only the score and the shareable quote — never the
 * roast body, free or paid — then funnels the visitor into their own roast.
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await loadShare(token);
  const result = share?.session.result;

  if (!share || !result) notFound();

  await prisma.share.update({ where: { id: share.id }, data: { clicks: { increment: 1 } } });

  return (
    <>
      <Navbar />
      <main className="relative px-5 pb-24 pt-12 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 rounded-full bg-ember/18 blur-[140px]"
        />
        <div className="relative mx-auto w-full max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-flame/30 bg-flame/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-flame">
            🔥 Someone thinks you need an AI roast
          </span>

          <h1 className="mt-7 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            They scored{" "}
            <span className="text-gradient-flame">{result.overallScore}</span>
            <span className="text-muted/50">/100</span>
          </h1>
          <p className="mt-3 text-base font-semibold text-acid">
            {scoreLabel(result.overallScore)}
          </p>

          <div className="noise-panel glow-flame mt-9 overflow-hidden rounded-[2rem] border border-edge">
            <Image
              src={`/api/share-card/${token}`}
              alt={`Roast card scoring ${result.overallScore} out of 100`}
              width={1200}
              height={630}
              className="h-auto w-full"
              unoptimized
            />
          </div>

          <p className="mx-auto mt-9 max-w-md text-base leading-relaxed text-muted">
            You&apos;re only seeing their score and one quote. The rest is between them and the AI.
            Yours is going to be worse.
          </p>

          <Button asChild size="xl" className="mt-8 w-full sm:w-auto">
            <Link href={`/roast?ref=${share.shareToken}`}>Accept the challenge 🔥</Link>
          </Button>
          <p className="mt-4 text-sm text-muted/70">
            No login. No account. Takes about 30 seconds.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
