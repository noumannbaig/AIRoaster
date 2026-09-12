import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { AiRoast } from "@/lib/ai/schema";
import type { RoastResult, RoastSession } from "@/lib/generated/prisma";

export const SESSION_COOKIE = "roastme_session";

export function newSessionToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function newShareToken(): string {
  // 16 random bytes -> 22 url-safe chars. Unguessable, short enough to share.
  return crypto.randomBytes(16).toString("base64url");
}

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export type FreeRoastView = {
  id: string;
  status: string;
  isPaid: false;
  overallScore: number;
  headline: string;
  summary: string;
  roast: string;
  redFlags: string[];
  greenFlags: string[];
  mainCharacterEnergy: string;
  shareableQuote: string;
  lockedSections: string[];
  createdAt: string;
};

export type PremiumRoastView = Omit<FreeRoastView, "isPaid"> & {
  isPaid: true;
  brutalSummary: string;
  premiumRedFlags: string[];
  premiumGreenFlags: string[];
  careerRoast: string;
  moneyRoast: string;
  socialRoast: string;
  datingRoast: string;
  mainCharacterArc: string;
  selfSabotage: string;
  friendsWouldRoast: string[];
  finalVerdict: string;
};

export type RoastView = FreeRoastView | PremiumRoastView;

/**
 * The single gate for premium content.
 *
 * The full roast is generated and stored up front (one AI call), but the
 * premium fields are only ever serialised when `session.isPaid` is true — and
 * `isPaid` is only ever set by the verified Lemon Squeezy webhook. Returning
 * from /success does not unlock anything.
 */
export function toRoastView(session: RoastSession, result: RoastResult): RoastView {
  const free: FreeRoastView = {
    id: session.id,
    status: session.status,
    isPaid: false,
    overallScore: result.overallScore,
    headline: result.headline,
    summary: result.summary,
    roast: result.roast,
    // Free tier deliberately shows only 3 of the red flags and 2 green flags.
    redFlags: asStringArray(result.redFlags).slice(0, 3),
    greenFlags: asStringArray(result.greenFlags).slice(0, 2),
    mainCharacterEnergy: result.mainCharacterEnergy,
    shareableQuote: result.shareableQuote,
    lockedSections: asStringArray(result.lockedSections),
    createdAt: result.createdAt.toISOString(),
  };

  if (!session.isPaid) return free;

  return {
    ...free,
    isPaid: true,
    redFlags: asStringArray(result.premiumRedFlags),
    greenFlags: asStringArray(result.premiumGreenFlags),
    brutalSummary: result.brutalSummary ?? result.roast,
    premiumRedFlags: asStringArray(result.premiumRedFlags),
    premiumGreenFlags: asStringArray(result.premiumGreenFlags),
    careerRoast: result.careerRoast ?? "",
    moneyRoast: result.moneyRoast ?? "",
    socialRoast: result.socialRoast ?? "",
    datingRoast: result.datingRoast ?? "",
    mainCharacterArc: result.mainCharacterArc ?? "",
    selfSabotage: result.selfSabotage ?? "",
    friendsWouldRoast: asStringArray(result.friendsWouldRoast),
    finalVerdict: result.finalVerdict ?? "",
  };
}

/** Maps a validated model payload onto the RoastResult columns. */
export function aiRoastToResultData(roast: AiRoast, model: string) {
  return {
    overallScore: roast.overall_score,
    headline: roast.headline,
    summary: roast.summary,
    roast: roast.roast,
    redFlags: roast.red_flags,
    greenFlags: roast.green_flags,
    mainCharacterEnergy: roast.main_character_energy,
    shareableQuote: roast.shareable_quote,
    lockedSections:
      roast.locked_sections.length > 0
        ? roast.locked_sections
        : [
            "Your biggest red flag",
            "What your friends probably think about you",
            "Your career trajectory",
            "Your money personality",
            "Your dating personality",
            "Your biggest self-sabotage pattern",
            "Your final verdict",
          ],
    premiumRedFlags: roast.red_flags,
    premiumGreenFlags: roast.green_flags,
    brutalSummary: roast.roast,
    careerRoast: roast.career_roast,
    moneyRoast: roast.money_roast,
    socialRoast: roast.social_roast,
    datingRoast: roast.dating_roast,
    mainCharacterArc: roast.main_character_arc,
    selfSabotage: roast.self_sabotage,
    friendsWouldRoast: roast.friends_would_roast,
    finalVerdict: roast.final_verdict,
    model,
  };
}

export async function getOrCreateShareToken(sessionId: string): Promise<string> {
  const existing = await prisma.share.findFirst({ where: { sessionId } });
  if (existing) return existing.shareToken;
  const share = await prisma.share.create({
    data: { sessionId, shareToken: newShareToken() },
  });
  return share.shareToken;
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Beyond saving. Framed and hung in the hall of shame.";
  if (score >= 80) return "Deeply roastable. Your friends were right.";
  if (score >= 70) return "Unfortunately roastable.";
  if (score >= 55) return "Roastable, but in a charming way.";
  if (score >= 40) return "Mildly roastable. Suspiciously well-adjusted.";
  return "Barely roastable. Are you hiding something?";
}
