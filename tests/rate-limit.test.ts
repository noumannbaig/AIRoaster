import { beforeEach, describe, expect, it, vi } from "vitest";

/** In-memory stand-in for the RateLimitHit table. */
const hits: { bucket: string; key: string; createdAt: Date }[] = [];

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    rateLimitHit: {
      findMany: vi.fn(async ({ where }: { where: { bucket: string; key: string; createdAt: { gte: Date } } }) =>
        hits
          .filter(
            (h) =>
              h.bucket === where.bucket &&
              h.key === where.key &&
              h.createdAt >= where.createdAt.gte,
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
      create: vi.fn(async ({ data }: { data: { bucket: string; key: string } }) => {
        const row = { ...data, createdAt: new Date() };
        hits.push(row);
        return row;
      }),
    },
  },
}));

process.env.RATE_LIMIT_ROASTS_PER_DAY = "3";
process.env.RATE_LIMIT_CHECKOUTS_PER_HOUR = "2";

const { checkRateLimit, clientIpFrom } = await import("@/lib/rate-limit");

beforeEach(() => {
  hits.length = 0;
});

describe("server-side rate limiting", () => {
  it("allows exactly the configured number of roasts then blocks", async () => {
    for (let i = 0; i < 3; i += 1) {
      const result = await checkRateLimit("roast", "ip:abc");
      expect(result.allowed).toBe(true);
    }
    const blocked = await checkRateLimit("roast", "ip:abc");
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(3);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each key independently", async () => {
    await checkRateLimit("roast", "ip:abc");
    await checkRateLimit("roast", "ip:abc");
    await checkRateLimit("roast", "ip:abc");
    expect((await checkRateLimit("roast", "ip:abc")).allowed).toBe(false);
    expect((await checkRateLimit("roast", "ip:xyz")).allowed).toBe(true);
  });

  it("keeps buckets separate", async () => {
    await checkRateLimit("checkout", "ip:abc");
    await checkRateLimit("checkout", "ip:abc");
    expect((await checkRateLimit("checkout", "ip:abc")).allowed).toBe(false);
    expect((await checkRateLimit("roast", "ip:abc")).allowed).toBe(true);
  });

  it("can peek without consuming", async () => {
    await checkRateLimit("roast", "ip:peek", { consume: false });
    await checkRateLimit("roast", "ip:peek", { consume: false });
    expect(hits).toHaveLength(0);
    expect((await checkRateLimit("roast", "ip:peek")).allowed).toBe(true);
  });

  it("ignores hits outside the window", async () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000);
    hits.push({ bucket: "roast", key: "ip:old", createdAt: old });
    hits.push({ bucket: "roast", key: "ip:old", createdAt: old });
    hits.push({ bucket: "roast", key: "ip:old", createdAt: old });
    expect((await checkRateLimit("roast", "ip:old")).allowed).toBe(true);
  });

  it("reports remaining requests", async () => {
    const first = await checkRateLimit("roast", "ip:count");
    expect(first.remaining).toBe(2);
    const second = await checkRateLimit("roast", "ip:count");
    expect(second.remaining).toBe(1);
  });
});

describe("client IP resolution", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(clientIpFrom(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("returns a stable placeholder when nothing is present", () => {
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
