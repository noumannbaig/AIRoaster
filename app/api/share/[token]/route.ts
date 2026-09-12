import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";
import { scoreLabel } from "@/lib/roast/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public share payload. Deliberately minimal: a shared link exposes only the
 * score and the shareable quote, never the paid roast body.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const share = await prisma.share.findUnique({
    where: { shareToken: token },
    include: { session: { include: { result: true } } },
  });

  if (!share?.session.result) return apiError("not_found");

  await prisma.share.update({ where: { id: share.id }, data: { clicks: { increment: 1 } } });

  return apiOk({
    share: {
      token: share.shareToken,
      overallScore: share.session.result.overallScore,
      scoreLabel: scoreLabel(share.session.result.overallScore),
      headline: share.session.result.headline,
      shareableQuote: share.session.result.shareableQuote,
      createdAt: share.createdAt.toISOString(),
    },
  });
}
