export type StoredFile = {
  url: string;
  pathname: string;
  bytes: number;
  mimeType: string;
};

/**
 * Storage abstraction so uploads can move between local disk, Vercel Blob,
 * Cloudinary or S3 without touching the upload route.
 */
export interface StorageProvider {
  readonly name: string;
  isConfigured(): boolean;
  put(args: { key: string; body: Buffer; mimeType: string }): Promise<StoredFile>;
  delete(pathname: string): Promise<void>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "upstream",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 5;

/**
 * MIME types from the browser are advisory. Sniff magic bytes server-side and
 * only trust the sniffed result.
 */
export function sniffImageMime(buffer: Buffer): (typeof ALLOWED_IMAGE_TYPES)[number] | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function extensionFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}
