import { prisma } from "@/lib/db/prisma";
import { ROAST_CATEGORY_LABELS, type RoastCategory } from "@/lib/ai/schema";

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

export async function getAdminStats() {
  const [
    totalSessions,
    roastsGenerated,
    paidSessions,
    checkoutStarts,
    paywallViews,
    shareClicks,
    shareDownloads,
    payments,
    sessions,
    recentPayments,
    emailCaptures,
  ] = await Promise.all([
    prisma.roastSession.count(),
    prisma.roastResult.count(),
    prisma.roastSession.count({ where: { isPaid: true } }),
    prisma.analyticsEvent.count({ where: { name: "checkout_started" } }),
    prisma.analyticsEvent.count({ where: { name: "paywall_viewed" } }),
    prisma.analyticsEvent.count({ where: { name: "share_clicked" } }),
    prisma.analyticsEvent.count({ where: { name: "share_card_downloaded" } }),
    prisma.payment.findMany({ where: { status: "PAID" }, select: { amount: true, currency: true } }),
    prisma.roastSession.findMany({ select: { categories: true, roastLevel: true } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        product: true,
        providerOrderId: true,
        sessionId: true,
        createdAt: true,
      },
    }),
    prisma.emailCapture.count(),
  ]);

  const revenueCents = payments.reduce((sum, p) => sum + p.amount, 0);
  const currency = payments[0]?.currency ?? "USD";

  const categoryCounts = new Map<string, number>();
  const levelCounts = new Map<string, number>();
  for (const session of sessions) {
    const categories = Array.isArray(session.categories) ? session.categories : [];
    for (const category of categories) {
      if (typeof category !== "string") continue;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
    levelCounts.set(session.roastLevel, (levelCounts.get(session.roastLevel) ?? 0) + 1);
  }

  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([key, count]) => ({
      key,
      label: ROAST_CATEGORY_LABELS[key as RoastCategory]?.label ?? key,
      count,
    }));

  return {
    totalSessions,
    roastsGenerated,
    freeRoasts: Math.max(0, roastsGenerated - paidSessions),
    paidSessions,
    checkoutStarts,
    paywallViews,
    shareClicks,
    shareDownloads,
    emailCaptures,
    revenueCents,
    currency,
    conversionRate: paywallViews > 0 ? (paidSessions / paywallViews) * 100 : 0,
    checkoutConversionRate: checkoutStarts > 0 ? (paidSessions / checkoutStarts) * 100 : 0,
    topCategories,
    levels: [...levelCounts.entries()].map(([key, count]) => ({ key, count })),
    recentPayments: recentPayments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
