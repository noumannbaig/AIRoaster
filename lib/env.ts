/**
 * Central, typed access to runtime configuration.
 *
 * Nothing in here throws at import time: the app must still boot (and render a
 * helpful error) when an integration is unconfigured, rather than crashing the
 * whole process. Each integration validates its own required vars when used.
 */

function str(value: string | undefined, fallback = ""): string {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : fallback;
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(str(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: string | undefined, fallback = false): boolean {
  const v = str(value).toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return fallback;
}

export const env = {
  nodeEnv: str(process.env.NODE_ENV, "development"),
  isProduction: process.env.NODE_ENV === "production",

  appUrl: str(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:43127").replace(/\/+$/, ""),

  databaseUrl: str(process.env.DATABASE_URL),

  openai: {
    apiKey: str(process.env.OPENAI_API_KEY),
    model: str(process.env.OPENAI_MODEL, "gpt-4o-mini"),
  },

  /**
   * Dev-only fixture path. Guarded twice: the flag must be on AND the process
   * must not be running in production. The real OpenAI integration is always
   * the production code path.
   */
  devFakeAi: bool(process.env.DEV_FAKE_AI) && process.env.NODE_ENV !== "production",

  lemonSqueezy: {
    apiKey: str(process.env.LEMON_SQUEEZY_API_KEY),
    storeId: str(process.env.LEMON_SQUEEZY_STORE_ID),
    variantIdFullRoast: str(process.env.LEMON_SQUEEZY_VARIANT_ID_FULL_ROAST),
    variantIdUltimateRoast: str(process.env.LEMON_SQUEEZY_VARIANT_ID_ULTIMATE_ROAST),
    webhookSecret: str(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET),
    testMode: bool(process.env.LEMON_SQUEEZY_TEST_MODE, true),
  },

  adminSecret: str(process.env.ADMIN_SECRET),

  analytics: {
    provider: str(process.env.ANALYTICS_PROVIDER, "db") as "db" | "posthog" | "none",
    key: str(process.env.NEXT_PUBLIC_ANALYTICS_KEY),
    host: str(process.env.NEXT_PUBLIC_ANALYTICS_HOST, "https://us.i.posthog.com"),
  },

  storage: {
    provider: str(process.env.STORAGE_PROVIDER, "local") as "local" | "vercel-blob",
    bucket: str(process.env.STORAGE_BUCKET, "roastme-uploads"),
    accessKey: str(process.env.STORAGE_ACCESS_KEY),
    secretKey: str(process.env.STORAGE_SECRET_KEY),
    blobToken: str(process.env.BLOB_READ_WRITE_TOKEN),
    retentionHours: int(process.env.UPLOAD_RETENTION_HOURS, 24),
  },

  rateLimits: {
    roastsPerDay: int(process.env.RATE_LIMIT_ROASTS_PER_DAY, 3),
    checkoutsPerHour: int(process.env.RATE_LIMIT_CHECKOUTS_PER_HOUR, 10),
    uploadsPerHour: int(process.env.RATE_LIMIT_UPLOADS_PER_HOUR, 20),
  },
} as const;

export const PRODUCTS = {
  FULL_ROAST: {
    id: "FULL_ROAST" as const,
    name: "Full Roast",
    priceCents: 199,
    currency: "USD",
    label: "$1.99",
  },
  ULTIMATE_ROAST: {
    id: "ULTIMATE_ROAST" as const,
    name: "Ultimate Roast",
    priceCents: 499,
    currency: "USD",
    label: "$4.99",
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;
