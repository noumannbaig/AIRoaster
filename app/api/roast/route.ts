import { cookies } from "next/headers";
import { AiError, generateRoast } from "@/lib/ai/generate";
import { hasEnoughAmmunition, roastInputSchema } from "@/lib/ai/schema";
import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  aiRoastToResultData,
  hashIp,
  newSessionToken,
  toRoastView,
} from "@/lib/roast/service";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Creates a roast session and generates the result in one request.
 *
 * A single AI call produces both the free and premium content (cost control).
 * The premium fields are stored but never serialised until a verified webhook
 * flips `isPaid` — see toRoastView().
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) sessionToken = newSessionToken();

  const ip = clientIpFrom(request.headers);
  const ipHash = hashIp(ip);

  // Rate limit on IP *and* anonymous session so neither alone can be bypassed.
  const byIp = await checkRateLimit("roast", `ip:${ipHash}`);
  if (!byIp.allowed) {
    return apiError("rate_limited", `Try again in ${byIp.retryAfterSeconds}s`, {
      headers: { "Retry-After": String(byIp.retryAfterSeconds) },
    });
  }
  const bySession = await checkRateLimit("roast", `session:${sessionToken}`);
  if (!bySession.allowed) {
    return apiError("rate_limited", `Try again in ${bySession.retryAfterSeconds}s`, {
      headers: { "Retry-After": String(bySession.retryAfterSeconds) },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Body must be JSON");
  }

  const parsed = roastInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("bad_request", parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const input = parsed.data;

  if (!hasEnoughAmmunition(input)) {
    return apiError(
      "bad_request",
      "Give us at least a sentence or two (or a screenshot). We can't roast a blank page.",
    );
  }

  if (input.subjectType !== "myself" && !input.consentConfirmed) {
    return apiError("bad_request", "Confirm you have permission to share this person's information.");
  }

  const combinedInput = [input.pastedText, input.aboutText].filter(Boolean).join("\n\n---\n\n");

  const session = await prisma.roastSession.create({
    data: {
      sessionToken,
      subjectType: input.subjectType,
      inputText: combinedInput,
      imageUrls: input.imageUrls,
      roastLevel: input.roastLevel,
      categories: input.categories,
      status: "GENERATING",
      ipHash,
    },
  });

  await trackServer("input_submitted", {
    sessionId: session.id,
    props: {
      roastLevel: input.roastLevel,
      subjectType: input.subjectType,
      categories: input.categories.join(","),
      images: input.imageUrls.length,
    },
  });

  try {
    const { roast, model } = await generateRoast({
      subjectType: input.subjectType,
      roastLevel: input.roastLevel,
      categories: input.categories,
      pastedText: input.pastedText,
      aboutText: input.aboutText,
      imageUrls: input.imageUrls,
    });

    const result = await prisma.roastResult.create({
      data: { sessionId: session.id, ...aiRoastToResultData(roast, model) },
    });

    const ready = await prisma.roastSession.update({
      where: { id: session.id },
      data: { status: "READY" },
    });

    await trackServer("roast_generated", {
      sessionId: session.id,
      props: { model, score: roast.overall_score },
    });

    const response = apiOk({ roast: toRoastView(ready, result) }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return response;
  } catch (error) {
    const code = error instanceof AiError ? error.code : "upstream";
    await prisma.roastSession.update({
      where: { id: session.id },
      data: { status: "FAILED", failureCode: code },
    });
    console.error("[roast] generation failed", error);
    return apiError("ai_failed", error instanceof Error ? error.message : "Unknown error");
  }
}
