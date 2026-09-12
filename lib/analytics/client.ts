"use client";

import type { AnalyticsEventName } from "./events";

type Props = Record<string, string | number | boolean | null>;

/**
 * Client-side funnel tracking. Fires and forgets to /api/analytics, which
 * routes to whichever provider ANALYTICS_PROVIDER selects. Never blocks the UI
 * and never throws.
 */
export function track(name: AnalyticsEventName, props: Props = {}, sessionId?: string | null): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ name, props, sessionId: sessionId ?? null });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through to fetch
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
