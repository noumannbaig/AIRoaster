import { AiError, generateRoast } from "@/lib/ai/generate";
import {
  ROAST_CATEGORIES,
  ROAST_LEVELS,
  SUBJECT_TYPES,
  type RoastCategory,
  type RoastLevel,
  type SubjectType,
} from "@/lib/ai/schema";
import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import { aiRoastToResultData, hashIp, toRoastView } from "@/lib/roast/service";

export const runtime = "nodejs";
export const maxDuration = 120;

function asList<T extends string>(value: unknown, allowed: readonly T[], fallback: T[]): T[] {
  if (!Array.isArray(value)) return fallback;
  const filtered = value.filter((v): v is T => typeof v === "string" && allowed.includes(v as T));
  return filtered.length > 0 ? filtered : fallback;
}

/**
 * Retry endpoint for a session whose generation failed (or never ran).
 *
 * Cost control: if a result already exists this returns it unchanged rather
 * than paying for a second model call. Refreshing the result page never
 * regenerates anything.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await prisma.roastSession.findUnique({ where: { id }, include: { result: true } });
  if (!session) return apiError("not_found");

  if (session.result) {
    return apiOk({ roast: toRoastView(session, session.result), regenerated: false });
  }

  const ipHash = hashIp(clientIpFrom(request.headers));
  const limited = await checkRateLimit("roast", `ip:${ipHash}`);
  if (!limited.allowed) {
    return apiError("rate_limited", `Try again in ${limited.retryAfterSeconds}s`, {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const subjectType = (SUBJECT_TYPES as readonly string[]).includes(session.subjectType)
    ? (session.subjectType as SubjectType)
    : "myself";
  const roastLevel = (ROAST_LEVELS as readonly string[]).includes(session.roastLevel)
    ? (session.roastLevel as RoastLevel)
    : "savage";
  const categories = asList<RoastCategory>(session.categories, ROAST_CATEGORIES, ["full_life"]);
  const imageUrls = Array.isArray(session.imageUrls)
    ? session.imageUrls.filter((u): u is string => typeof u === "string")
    : [];

  await prisma.roastSession.update({
    where: { id },
    data: { status: "GENERATING", failureCode: null },
  });

  try {
    const { roast, model } = await generateRoast({
      subjectType,
      roastLevel,
      categories,
      pastedText: session.inputText,
      aboutText: "",
      imageUrls,
    });

    const result = await prisma.roastResult.create({
      data: { sessionId: id, ...aiRoastToResultData(roast, model) },
    });
    const ready = await prisma.roastSession.update({ where: { id }, data: { status: "READY" } });

    await trackServer("roast_generated", {
      sessionId: id,
      props: { model, score: roast.overall_score, retry: true },
    });

    return apiOk({ roast: toRoastView(ready, result), regenerated: true });
  } catch (error) {
    const code = error instanceof AiError ? error.code : "upstream";
    await prisma.roastSession.update({ where: { id }, data: { status: "FAILED", failureCode: code } });
    console.error("[roast/generate] failed", error);
    return apiError("ai_failed", error instanceof Error ? error.message : "Unknown error");
  }
}
