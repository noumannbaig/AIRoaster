import OpenAI from "openai";
import { env } from "@/lib/env";
import { buildFixtureRoast } from "./fixtures";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import {
  aiRoastSchema,
  type AiRoast,
  type RoastCategory,
  type RoastLevel,
  type SubjectType,
} from "./schema";

export type GenerateArgs = {
  subjectType: SubjectType;
  roastLevel: RoastLevel;
  categories: RoastCategory[];
  pastedText: string;
  aboutText: string;
  imageUrls: string[];
};

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: "missing_key" | "timeout" | "invalid_response" | "upstream",
  ) {
    super(message);
    this.name = "AiError";
  }
}

const REQUEST_TIMEOUT_MS = 90_000;

/**
 * Screenshots are passed as public URLs; the model fetches them itself.
 * Local-storage URLs (http://localhost/...) are unreachable from OpenAI, so we
 * only forward absolute URLs that are not loopback addresses.
 */
function visionParts(imageUrls: string[]) {
  return imageUrls
    .filter((url) => !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url))
    .map((url) => ({ type: "image_url" as const, image_url: { url, detail: "low" as const } }));
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new AiError("Model did not return JSON", "invalid_response");
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      throw new AiError("Model returned malformed JSON", "invalid_response");
    }
  }
}

/** Parse + validate a raw model payload. Exported for tests. */
export function parseAiRoast(raw: string): AiRoast {
  const parsed = aiRoastSchema.safeParse(extractJson(raw));
  if (!parsed.success) {
    throw new AiError(
      `Model response failed validation: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
      "invalid_response",
    );
  }
  return parsed.data;
}

/**
 * One AI call produces the entire roast — free and premium sections together.
 * The premium fields are stored but withheld from API responses until a
 * verified webhook marks the session paid (see lib/roast/service.ts). This is
 * the cost-control decision from the spec: never call the model twice for the
 * same session.
 */
export async function generateRoast(args: GenerateArgs): Promise<{ roast: AiRoast; model: string }> {
  const prompt = buildUserPrompt({
    subjectType: args.subjectType,
    roastLevel: args.roastLevel,
    categories: args.categories,
    pastedText: args.pastedText,
    aboutText: args.aboutText,
    imageCount: args.imageUrls.length,
  });

  if (env.devFakeAi) {
    // Dev fixture path — see lib/ai/fixtures.ts. Never reachable in production.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return {
      roast: buildFixtureRoast({
        subjectType: args.subjectType,
        roastLevel: args.roastLevel,
        categories: args.categories,
        pastedText: args.pastedText,
        aboutText: args.aboutText,
        imageCount: args.imageUrls.length,
      }),
      model: "dev-fixture",
    };
  }

  if (!env.openai.apiKey) {
    throw new AiError("OPENAI_API_KEY is not configured", "missing_key");
  }

  const client = new OpenAI({ apiKey: env.openai.apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  const images = visionParts(args.imageUrls);

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: env.openai.model,
      temperature: 1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: images.length > 0 ? [{ type: "text" as const, text: prompt }, ...images] : prompt,
        },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error";
    if (/timeout|abort/i.test(message)) throw new AiError(message, "timeout");
    throw new AiError(message, "upstream");
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new AiError("Model returned an empty response", "invalid_response");

  return { roast: parseAiRoast(raw), model: completion.model ?? env.openai.model };
}
