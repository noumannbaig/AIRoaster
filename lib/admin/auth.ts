import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const ADMIN_COOKIE = "roastme_admin";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * MVP admin protection: a single shared secret compared in constant time and
 * kept in an httpOnly cookie. Deliberately simple — the spec asks for
 * ADMIN_SECRET, not a user system.
 */
export async function isAdminAuthed(): Promise<boolean> {
  if (!env.adminSecret) return false;
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  return Boolean(value && safeEqual(value, env.adminSecret));
}

export function matchesAdminSecret(candidate: string): boolean {
  return Boolean(env.adminSecret) && safeEqual(candidate, env.adminSecret);
}
