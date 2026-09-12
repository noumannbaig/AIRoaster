import type { AiRoast } from "./schema";
import type { RoastCategory, RoastLevel, SubjectType } from "./schema";

/**
 * DEV-ONLY fixture generator.
 *
 * This exists so the end-to-end funnel (input -> free roast -> paywall ->
 * webhook -> premium -> share card) can be exercised on a machine with no
 * OpenAI key. It is unreachable unless DEV_FAKE_AI=true AND NODE_ENV is not
 * "production" (see lib/env.ts), and it is never used by the production code
 * path in lib/ai/generate.ts.
 */

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return h;
}

/** Longest few "interesting" phrases from the user's input, so the fixture at
 * least echoes real supplied details rather than being pure lorem. */
function detailsFrom(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

export function buildFixtureRoast(args: {
  subjectType: SubjectType;
  roastLevel: RoastLevel;
  categories: RoastCategory[];
  pastedText: string;
  aboutText: string;
  imageCount: number;
}): AiRoast {
  const corpus = `${args.pastedText}\n${args.aboutText}`.trim();
  const seed = hash(corpus + args.roastLevel + args.categories.join(","));
  const details = detailsFrom(corpus);
  const quoted = details[0] ?? "absolutely nothing of substance";
  const second = details[1] ?? "a suspicious amount of silence";

  const score = 55 + (Math.abs(seed) % 42);

  const headline = pick(
    [
      "You are one productivity app away from becoming genuinely unbearable.",
      "High potential, terrible execution, excellent lighting.",
      "You've optimized everything except the part where you finish things.",
      "You are the pilot episode of a show that never got picked up.",
    ],
    seed,
  );

  return {
    overall_score: score,
    headline,
    summary: `Based on what you gave us — "${quoted}" — you are operating at roughly 40% of your own press release. It's not a tragedy. It's a running bit.`,
    roast: [
      `Let's start with the obvious. You wrote "${quoted}" as though that were a flex, and honestly, the confidence is the funniest part. You describe your life the way a startup describes a feature that doesn't exist yet: present tense, big verbs, no shipping date.`,
      `Then there's "${second}", which is where the whole thing quietly falls apart. You're not lazy. Lazy people don't build systems. You've built an entire scaffolding of plans, apps, notebooks and tabs whose only output is more scaffolding. Your to-do list has a to-do list and neither of them has spoken in weeks.`,
      `${args.imageCount > 0 ? `You also sent ${args.imageCount} screenshot(s), which is a bold move for someone whose camera roll is clearly evidence. ` : ""}The good news is you're interesting. The bad news is you're interesting the way a half-finished building is interesting — everyone slows down to look, nobody moves in.`,
    ].join("\n\n"),
    red_flags: [
      "You call opening seven tabs \"doing research.\"",
      "Your five-year plan has been rewritten more times than it has been acted on.",
      "You own the premium version of an app you last opened in February.",
      "You describe unfinished projects in the present tense.",
      "You've explained your idea to more people than you've shown it to.",
      "Your rest is just work you feel guilty about not doing.",
    ],
    green_flags: [
      "You're genuinely funny about your own mess, which is rarer than it sounds.",
      "You keep starting things. Most people stopped starting years ago.",
      "You gave a stranger on the internet real details about your life, which is either courage or content.",
      "You're self-aware enough to be here, which is 80% of the fix.",
    ],
    main_character_energy: `You have the specific energy of someone narrating their own montage while the montage hasn't started. Every Sunday you're the protagonist of a comeback arc. Every Wednesday you're a supporting character in someone else's group chat.`,
    career_roast: `You've built a career the way people build playlists: enthusiastically, in public, and with no clear ending. Based on what you supplied, your job title and your actual daily activity are two different documents that have never been in the same room. You're not underperforming — you're over-planning, which is underperforming with better handwriting.`,
    money_roast: `This is comedy, not financial advice, so relax. Your money personality is "abundance mindset with a scarcity calendar." You'll agonize over a $9 subscription and then spend $200 on equipment for a hobby you will describe in the past tense by March. The subscriptions aren't the problem. The subscriptions are a symptom with billing enabled.`,
    social_roast: `Your online presence reads like a highlight reel edited by someone who left halfway through. You post like you're being reviewed and lurk like you're being hunted. Based on what you gave us, you've drafted more replies than you've sent, and the drafts were funnier.`,
    dating_roast: `Keeping this playful: you present as low-maintenance and operate as a group project. You want someone who "gets it" without having to explain what "it" is, which is less a preference and more a riddle. The upside is you're genuinely warm. The downside is you communicate in hints and then grade people on comprehension.`,
    main_character_arc: `For entertainment purposes only, here's your arc: Season one, you discover a system. Season two, you evangelize the system. Season three, the system collapses under one busy week and you find out the thing that actually works is embarrassingly boring — doing one thing, badly, on a Tuesday. Season four is unaired.`,
    self_sabotage: `Your pattern is pre-emptive perfectionism. Based only on what you described, you don't quit projects — you upgrade them until they're too heavy to move. Every time something gets close to done, you discover a "better approach," which buys you another month of feeling productive without the terrifying experience of being judged.`,
    friends_would_roast: [
      "They'd bring up the thing you swore you'd launch \"next month\" — in a specific, dated way.",
      "They'd do an impression of you explaining your new system, and it would be devastating.",
      "They'd point out that you're the friend who suggests the plan and cancels the plan.",
      "They'd note that your camera roll is 90% screenshots you will never look at again.",
    ],
    final_verdict: `You're not a disaster. You're a high-potential person running production on beta software. Ship one thing. Badly. This week.`,
    shareable_quote: `"You're not a disaster. You're a high-potential person running production on beta software."`,
    locked_sections: [
      "Your biggest red flag",
      "What your friends probably think about you",
      "Your career trajectory",
      "Your money personality",
      "Your dating personality",
      "Your biggest self-sabotage pattern",
      "Your final verdict",
    ],
  };
}
