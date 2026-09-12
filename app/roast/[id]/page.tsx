import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RoastResult } from "@/components/RoastResult";
import { RoastRetry } from "@/components/RoastRetry";
import { prisma } from "@/lib/db/prisma";
import { PRODUCTS, env } from "@/lib/env";
import { scoreLabel, toRoastView } from "@/lib/roast/service";

export const dynamic = "force-dynamic";

async function loadSession(id: string) {
  return prisma.roastSession.findUnique({ where: { id }, include: { result: true } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await loadSession(id);
  if (!session?.result) return { title: "Your roast" };

  return {
    title: `Roasted ${session.result.overallScore}/100`,
    description: session.result.headline,
    openGraph: {
      title: `AI just roasted my life 💀 ${session.result.overallScore}/100`,
      description: session.result.headline,
      images: [{ url: `${env.appUrl}/api/share-card/${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${env.appUrl}/api/share-card/${id}`],
    },
    robots: { index: false, follow: false },
  };
}

export default async function RoastResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reveal?: string }>;
}) {
  const { id } = await params;
  const { reveal } = await searchParams;
  const session = await loadSession(id);

  if (!session) notFound();

  return (
    <>
      <Navbar />
      <main className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 rounded-full bg-flame/12 blur-[140px]"
        />
        <div className="relative">
          {session.result ? (
            <RoastResult
              roast={toRoastView(session, session.result)}
              scoreLabel={scoreLabel(session.result.overallScore)}
              priceLabel={PRODUCTS.FULL_ROAST.label}
              revealPremium={session.isPaid && reveal === "1"}
            />
          ) : (
            <RoastRetry sessionId={session.id} status={session.status} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
