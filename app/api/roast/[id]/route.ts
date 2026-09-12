import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";
import { toRoastView } from "@/lib/roast/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await prisma.roastSession.findUnique({
    where: { id },
    include: { result: true },
  });

  if (!session) return apiError("not_found");
  if (session.status === "FAILED") {
    return apiError("ai_failed", session.failureCode ?? "generation_failed");
  }
  if (!session.result) {
    return apiOk({ roast: null, status: session.status });
  }

  return apiOk({ roast: toRoastView(session, session.result) });
}
