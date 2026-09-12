import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics/events";
import { trackServer } from "@/lib/analytics/server";
import { apiError, apiOk } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { name?: string; sessionId?: string | null; props?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "Body must be JSON");
  }

  if (!body.name || !(ANALYTICS_EVENTS as readonly string[]).includes(body.name)) {
    return apiError("bad_request", "Unknown event name");
  }

  // Only scalars are persisted — no free-text user content ends up in analytics.
  const props: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(body.props ?? {})) {
    if (["string", "number", "boolean"].includes(typeof value) || value === null) {
      props[key] = value as string | number | boolean | null;
    }
  }

  await trackServer(body.name as AnalyticsEventName, { sessionId: body.sessionId ?? null, props });
  return apiOk({ ok: true });
}
