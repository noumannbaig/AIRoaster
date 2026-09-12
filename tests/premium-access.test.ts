import { describe, expect, it } from "vitest";
import { aiRoastToResultData, newShareToken, scoreLabel, toRoastView } from "@/lib/roast/service";
import { buildFixtureRoast } from "@/lib/ai/fixtures";
import type { RoastResult, RoastSession } from "@/lib/generated/prisma";

const ai = buildFixtureRoast({
  subjectType: "myself",
  roastLevel: "savage",
  categories: ["full_life"],
  pastedText: "Product manager with three side projects and 400 unread emails.",
  aboutText: "",
  imageCount: 0,
});

function makeResult(): RoastResult {
  return {
    id: "res_1",
    sessionId: "sess_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    premiumGeneratedAt: null,
    ...aiRoastToResultData(ai, "test-model"),
  } as unknown as RoastResult;
}

function makeSession(isPaid: boolean): RoastSession {
  return {
    id: "sess_1",
    sessionToken: "tok",
    subjectType: "myself",
    inputText: "…",
    imageUrls: [],
    roastLevel: "savage",
    categories: ["full_life"],
    status: "READY",
    isPaid,
    failureCode: null,
    ipHash: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as RoastSession;
}

describe("premium content access", () => {
  it("withholds every premium field from an unpaid session", () => {
    const view = toRoastView(makeSession(false), makeResult());
    expect(view.isPaid).toBe(false);

    const serialised = JSON.stringify(view);
    for (const secret of [
      ai.career_roast,
      ai.money_roast,
      ai.social_roast,
      ai.dating_roast,
      ai.self_sabotage,
      ai.main_character_arc,
      ai.final_verdict,
      ...ai.friends_would_roast,
    ]) {
      expect(serialised).not.toContain(secret);
    }
  });

  it("only teases locked section titles, never their content", () => {
    const view = toRoastView(makeSession(false), makeResult());
    expect(view.lockedSections.length).toBeGreaterThan(3);
    expect(view.lockedSections.join(" ")).not.toContain(ai.final_verdict);
  });

  it("limits the free tier to three red flags and two green flags", () => {
    const view = toRoastView(makeSession(false), makeResult());
    expect(view.redFlags).toHaveLength(3);
    expect(view.greenFlags).toHaveLength(2);
    expect(ai.red_flags.length).toBeGreaterThan(3);
  });

  it("reveals everything once the session is marked paid", () => {
    const view = toRoastView(makeSession(true), makeResult());
    expect(view.isPaid).toBe(true);
    if (!view.isPaid) return;

    expect(view.finalVerdict).toBe(ai.final_verdict);
    expect(view.careerRoast).toBe(ai.career_roast);
    expect(view.selfSabotage).toBe(ai.self_sabotage);
    expect(view.redFlags).toHaveLength(ai.red_flags.length);
    expect(view.friendsWouldRoast).toEqual(ai.friends_would_roast);
  });

  it("keeps the score label consistent with the score", () => {
    expect(scoreLabel(95)).toMatch(/Beyond saving/);
    expect(scoreLabel(72)).toBe("Unfortunately roastable.");
    expect(scoreLabel(10)).toMatch(/Barely roastable/);
  });
});

describe("share token generation", () => {
  it("produces url-safe tokens", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(newShareToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("produces tokens long enough to be unguessable", () => {
    expect(newShareToken().length).toBeGreaterThanOrEqual(20);
  });

  it("never repeats across many generations", () => {
    const tokens = new Set(Array.from({ length: 2000 }, () => newShareToken()));
    expect(tokens.size).toBe(2000);
  });
});
