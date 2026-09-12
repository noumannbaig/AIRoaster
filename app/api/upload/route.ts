import crypto from "node:crypto";
import { trackServer } from "@/lib/analytics/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiOk } from "@/lib/http";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import { hashIp } from "@/lib/roast/service";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  StorageError,
  extensionFor,
  getStorageProvider,
  sniffImageMime,
} from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Screenshot upload.
 *
 * The browser-supplied MIME type is never trusted: every file is sniffed from
 * its magic bytes and rejected unless it is a real PNG/JPEG/WEBP. Storage
 * credentials stay server-side behind the StorageProvider abstraction.
 */
export async function POST(request: Request) {
  const ipHash = hashIp(clientIpFrom(request.headers));
  const limited = await checkRateLimit("upload", `ip:${ipHash}`);
  if (!limited.allowed) {
    return apiError("rate_limited", `Try again in ${limited.retryAfterSeconds}s`, {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("bad_request", "Expected multipart/form-data");
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return apiError("bad_request", "No files were attached");
  if (files.length > MAX_IMAGES) {
    return apiError("bad_request", `Maximum ${MAX_IMAGES} screenshots per roast`);
  }

  const storage = getStorageProvider();
  const uploaded: { url: string; pathname: string; mimeType: string; bytes: number }[] = [];

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return apiError("bad_request", `"${file.name}" is over the 5 MB limit`);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = sniffImageMime(buffer);
    if (!mimeType) {
      return apiError("bad_request", `"${file.name}" isn't a PNG, JPEG or WEBP image`);
    }

    const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extensionFor(mimeType)}`;
    try {
      const stored = await storage.put({ key, body: buffer, mimeType });
      await prisma.uploadedImage.create({
        data: {
          url: stored.url,
          pathname: stored.pathname,
          provider: storage.name,
          bytes: stored.bytes,
          mimeType: stored.mimeType,
        },
      });
      uploaded.push(stored);
    } catch (error) {
      const detail =
        error instanceof StorageError ? error.message : "Upload failed for an unknown reason";
      console.error("[upload] failed", error);
      return apiError("storage_failed", detail);
    }
  }

  await trackServer("image_uploaded", { props: { count: uploaded.length } });

  return apiOk({ files: uploaded }, { status: 201 });
}
