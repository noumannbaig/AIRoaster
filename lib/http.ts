import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "bad_request"
  | "not_found"
  | "rate_limited"
  | "unauthorized"
  | "ai_failed"
  | "payment_failed"
  | "storage_failed"
  | "server_error";

/** Friendly, on-brand copy for every error the user can actually hit. */
export const ERROR_COPY: Record<ApiErrorCode, string> = {
  bad_request: "That input didn't give us enough to work with. Try again with a bit more.",
  not_found: "We can't find that roast. It may have expired or never existed.",
  rate_limited: "Easy. You've had enough roasts for today. Come back tomorrow.",
  unauthorized: "You don't have access to that.",
  ai_failed: "Even the AI needs a minute to process your questionable life choices.",
  payment_failed: "Checkout didn't open. Nothing was charged. Try again in a moment.",
  storage_failed: "That upload didn't stick. Try a different screenshot.",
  server_error: "Something broke on our side. Embarrassing for us, honestly.",
};

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  not_found: 404,
  rate_limited: 429,
  unauthorized: 401,
  ai_failed: 502,
  payment_failed: 502,
  storage_failed: 502,
  server_error: 500,
};

export function apiError(code: ApiErrorCode, detail?: string, init?: ResponseInit) {
  return NextResponse.json(
    { error: { code, message: ERROR_COPY[code], detail: detail ?? null } },
    { status: STATUS[code], ...init },
  );
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
