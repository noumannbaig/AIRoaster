import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import type { AnalyticsEventName } from "./events";

type Props = Record<string, string | number | boolean | null>;

/**
 * Analytics abstraction. The `db` provider writes to Postgres, which is what
 * powers /admin. `posthog` forwards to PostHog's capture API. `none` disables
 * collection entirely. Never pass raw user input here — only funnel metadata.
 */
export async function trackServer(
  name: AnalyticsEventName,
  args: { sessionId?: string | null; props?: Props } = {},
): Promise<void> {
  const provider = env.analytics.provider;
  if (provider === "none") return;

  try {
    if (provider === "posthog" && env.analytics.key) {
      await fetch(`${env.analytics.host}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.analytics.key,
          event: name,
          distinct_id: args.sessionId ?? "anonymous",
          properties: { ...(args.props ?? {}), $lib: "roastme-server" },
        }),
      });
    }

    // Always mirror into Postgres so /admin has a source of truth.
    await prisma.analyticsEvent.create({
      data: {
        name,
        sessionId: args.sessionId ?? null,
        props: (args.props ?? {}) as object,
      },
    });
  } catch {
    // Analytics must never break a user-facing request.
  }
}
