import { describe, expect, it } from "vitest";
import { AiError, parseAiRoast } from "@/lib/ai/generate";
import { aiRoastSchema, hasEnoughAmmunition, roastInputSchema } from "@/lib/ai/schema";
import { buildFixtureRoast } from "@/lib/ai/fixtures";

const valid = buildFixtureRoast({
  subjectType: "myself",
  roastLevel: "savage",
  categories: ["full_life"],
  pastedText: "27, product manager, three side projects, 400 unread emails.",
  aboutText: "I spend too much money on mechanical keyboards.",
  imageCount: 0,
});

describe("AI response validation", () => {
  it("accepts a well-formed payload", () => {
    expect(aiRoastSchema.safeParse(valid).success).toBe(true);
  });

  it("parses JSON wrapped in markdown fences", () => {
    const raw = "```json\n" + JSON.stringify(valid) + "\n```";
    expect(parseAiRoast(raw).headline).toBe(valid.headline);
  });

  it("parses JSON with leading prose", () => {
    const raw = `Sure! Here's the roast:\n${JSON.stringify(valid)}`;
    expect(parseAiRoast(raw).overall_score).toBe(valid.overall_score);
  });

  it("rejects a response that is not JSON at all", () => {
    expect(() => parseAiRoast("I'd rather not roast this person.")).toThrow(AiError);
  });

  it("rejects a score outside 0-100", () => {
    const raw = JSON.stringify({ ...valid, overall_score: 140 });
    expect(() => parseAiRoast(raw)).toThrow(/overall_score/);
  });

  it("rejects a payload missing premium sections", () => {
    const withoutCareer: Record<string, unknown> = { ...valid };
    delete withoutCareer.career_roast;
    expect(() => parseAiRoast(JSON.stringify(withoutCareer))).toThrow(AiError);
  });

  it("rejects too few red flags", () => {
    const raw = JSON.stringify({ ...valid, red_flags: ["only one"] });
    expect(() => parseAiRoast(raw)).toThrow(/red_flags/);
  });

  it("rejects empty strings in flag arrays", () => {
    const raw = JSON.stringify({ ...valid, green_flags: ["fine", "   ", "also fine"] });
    expect(() => parseAiRoast(raw)).toThrow(AiError);
  });
});

describe("input validation", () => {
  it("applies documented defaults", () => {
    const parsed = roastInputSchema.parse({ subjectType: "myself" });
    expect(parsed.roastLevel).toBe("savage");
    expect(parsed.categories).toEqual(["full_life"]);
  });

  it("rejects an unknown roast level", () => {
    expect(roastInputSchema.safeParse({ subjectType: "myself", roastLevel: "nuclear" }).success).toBe(
      false,
    );
  });

  it("rejects more than five images", () => {
    const imageUrls = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}.png`);
    expect(roastInputSchema.safeParse({ subjectType: "myself", imageUrls }).success).toBe(false);
  });

  it("requires real ammunition", () => {
    expect(hasEnoughAmmunition({ pastedText: "hi", aboutText: "" })).toBe(false);
    expect(hasEnoughAmmunition({ pastedText: "", aboutText: "", imageUrls: ["x"] })).toBe(true);
    expect(
      hasEnoughAmmunition({ aboutText: "I am a 27 year old product manager with three side projects." }),
    ).toBe(true);
  });
});
