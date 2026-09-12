import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { apiError, apiOk } from "@/lib/http";
import { getStorageProvider } from "@/lib/storage";
import { matchesAdminSecret } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deletes uploaded screenshots past the retention window.
 *
 * Intended to run on a schedule (Vercel Cron hits this path with the
 * Authorization header, or call it manually with the admin secret).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!matchesAdminSecret(token)) return apiError("unauthorized");

  const cutoff = new Date(Date.now() - env.storage.retentionHours * 60 * 60 * 1000);
  const stale = await prisma.uploadedImage.findMany({ where: { createdAt: { lt: cutoff } } });

  const storage = getStorageProvider();
  let deleted = 0;
  for (const image of stale) {
    await storage.delete(image.pathname).catch(() => undefined);
    await prisma.uploadedImage.delete({ where: { id: image.id } }).catch(() => undefined);
    deleted += 1;
  }

  return apiOk({ ok: true, deleted, retentionHours: env.storage.retentionHours });
}
