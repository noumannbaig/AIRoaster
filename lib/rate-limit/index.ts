import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export const RATE_LIMIT_BUCKETS = {
  roast: () => ({ limit: env.rateLimits.roastsPerDay, windowSeconds: 24 * 60 * 60 }),
  checkout: () => ({ limit: env.rateLimits.checkoutsPerHour, windowSeconds: 60 * 60 }),
  upload: () => ({ limit: env.rateLimits.uploadsPerHour, windowSeconds: 60 * 60 }),
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMIT_BUCKETS;

/**
 * Server-side fixed-window rate limiting backed by Postgres.
 *
 * Postgres is used deliberately: serverless instances don't share memory, so an
 * in-process counter would be trivially bypassed by hitting a cold lambda.
 * Limits come from env so they can be tuned without a deploy.
 */
export async function checkRateLimit(
  bucket: RateLimitBucket,
  key: string,
  options: { consume?: boolean } = {},
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = RATE_LIMIT_BUCKETS[bucket]();
  const consume = options.consume ?? true;

  if (limit <= 0) {
    return { allowed: true, limit, remaining: Number.POSITIVE_INFINITY, retryAfterSeconds: 0 };
  }

  const since = new Date(Date.now() - windowSeconds * 1000);
  const hits = await prisma.rateLimitHit.findMany({
    where: { bucket, key, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (hits.length >= limit) {
    const oldest = hits[0].createdAt.getTime();
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowSeconds * 1000 - Date.now()) / 1000));
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }

  if (consume) {
    await prisma.rateLimitHit.create({ data: { bucket, key } });
  }

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - hits.length - (consume ? 1 : 0)),
    retryAfterSeconds: 0,
  };
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}
