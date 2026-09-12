import { z } from "zod";
import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({
  email: z.email().max(200),
  sessionId: z.string().min(1),
});

/**
 * Optional email capture. Stored only when the user explicitly submits it, and
 * nothing is emailed automatically — there is no marketing consent here.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Body must be JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("bad_request", "That doesn't look like an email address");

  const session = await prisma.roastSession.findUnique({ where: { id: parsed.data.sessionId } });
  if (!session) return apiError("not_found");

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.upsert({ where: { email }, create: { email }, update: {} });

  await prisma.emailCapture.upsert({
    where: { email_sessionId: { email, sessionId: session.id } },
    create: { email, sessionId: session.id },
    update: {},
  });
  await prisma.roastSession.update({ where: { id: session.id }, data: { userId: user.id } });
  await trackServer("email_submitted", { sessionId: session.id });

  return apiOk({ ok: true }, { status: 201 });
}
