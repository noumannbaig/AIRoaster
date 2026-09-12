import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { apiError, apiOk } from "@/lib/http";
import { getOrCreateShareToken } from "@/lib/roast/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Body must be JSON");
  }
  if (!body.sessionId) return apiError("bad_request", "sessionId is required");

  const session = await prisma.roastSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return apiError("not_found");

  const shareToken = await getOrCreateShareToken(session.id);
  await trackServer("share_clicked", { sessionId: session.id });

  return apiOk({ shareToken, url: `${env.appUrl}/share/${shareToken}` }, { status: 201 });
}
