import { z } from "zod";

export const ROAST_LEVELS = ["gentle", "savage", "unhinged"] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export const SUBJECT_TYPES = ["myself", "friend", "partner", "coworker", "other"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const ROAST_CATEGORIES = [
  "career",
  "dating",
  "lifestyle",
  "money",
  "social",
  "tech_bro",
  "full_life",
] as const;
export type RoastCategory = (typeof ROAST_CATEGORIES)[number];

export const ROAST_CATEGORY_LABELS: Record<RoastCategory, { label: string; emoji: string; blurb: string }> = {
  career: { label: "Career Roast", emoji: "💼", blurb: "Your job title vs. your actual output." },
  dating: { label: "Dating Roast", emoji: "💔", blurb: "Your love life, reviewed without mercy." },
  lifestyle: { label: "Lifestyle Roast", emoji: "🛋️", blurb: "How you actually spend a Tuesday." },
  money: { label: "Money Roast", emoji: "💸", blurb: "Where it goes. Why it goes." },
  social: { label: "Social Media Roast", emoji: "📱", blurb: "Your posting habits, under a microscope." },
  tech_bro: { label: "Tech Bro Roast", emoji: "🧢", blurb: "For the disruptors and the pre-seed dreamers." },
  full_life: { label: "Full Life Roast", emoji: "🔥", blurb: "Everything. All of it. Good luck." },
};

export const ROAST_LEVEL_LABELS: Record<RoastLevel, { label: string; emoji: string; blurb: string }> = {
  gentle: { label: "Gentle", emoji: "🙂", blurb: "Mean, but it still loves you." },
  savage: { label: "Savage", emoji: "😈", blurb: "The one your friends would pick." },
  unhinged: { label: "Absolutely Unhinged", emoji: "💀", blurb: "Bring a support system." },
};

export const SUBJECT_TYPE_LABELS: Record<SubjectType, { label: string; emoji: string }> = {
  myself: { label: "Myself", emoji: "🫠" },
  friend: { label: "My friend", emoji: "🤝" },
  partner: { label: "My partner", emoji: "💞" },
  coworker: { label: "My coworker", emoji: "🧑‍💻" },
  other: { label: "Someone else", emoji: "👀" },
};

const nonEmpty = z.string().trim().min(1);

/** Exactly the JSON contract we ask the model for. Validated before storage. */
export const aiRoastSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  headline: nonEmpty.max(240),
  summary: nonEmpty,
  roast: nonEmpty,
  red_flags: z.array(nonEmpty).min(3).max(7),
  green_flags: z.array(nonEmpty).min(2).max(5),
  main_character_energy: nonEmpty,
  career_roast: nonEmpty,
  money_roast: nonEmpty,
  social_roast: nonEmpty,
  dating_roast: nonEmpty,
  main_character_arc: nonEmpty,
  self_sabotage: nonEmpty,
  friends_would_roast: z.array(nonEmpty).min(2).max(5),
  final_verdict: nonEmpty,
  shareable_quote: nonEmpty.max(220),
  locked_sections: z.array(nonEmpty).default([]),
});

export type AiRoast = z.infer<typeof aiRoastSchema>;

export const roastInputSchema = z.object({
  subjectType: z.enum(SUBJECT_TYPES),
  pastedText: z.string().max(8000).optional().default(""),
  aboutText: z.string().max(8000).optional().default(""),
  imageUrls: z.array(z.string().url()).max(5).optional().default([]),
  roastLevel: z.enum(ROAST_LEVELS).default("savage"),
  categories: z.array(z.enum(ROAST_CATEGORIES)).min(1).max(7).default(["full_life"]),
  consentConfirmed: z.boolean().optional().default(false),
});

export type RoastInput = z.infer<typeof roastInputSchema>;

/**
 * There must be *something* to work with — either words or screenshots.
 * 40 chars is roughly "one real sentence about a person".
 */
export function hasEnoughAmmunition(input: {
  pastedText?: string;
  aboutText?: string;
  imageUrls?: string[];
}): boolean {
  const chars = `${input.pastedText ?? ""} ${input.aboutText ?? ""}`.trim().length;
  return chars >= 40 || (input.imageUrls?.length ?? 0) > 0;
}
