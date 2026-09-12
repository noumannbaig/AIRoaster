import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type { StorageProvider, StoredFile } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Local-disk storage for development. Not suitable for Vercel (the filesystem
 * is ephemeral and per-instance) — production should use vercel-blob.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  isConfigured(): boolean {
    return true;
  }

  async put({ key, body, mimeType }: { key: string; body: Buffer; mimeType: string }): Promise<StoredFile> {
    const target = path.join(UPLOAD_DIR, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return {
      url: `${env.appUrl}/uploads/${key}`,
      pathname: key,
      bytes: body.byteLength,
      mimeType,
    };
  }

  async delete(pathname: string): Promise<void> {
    const target = path.resolve(UPLOAD_DIR, pathname);
    const relative = path.relative(UPLOAD_DIR, target);
    // Windows-safe traversal check: `startsWith` fails across mixed slashes.
    if (relative.startsWith("..") || path.isAbsolute(relative)) return;
    await unlink(target).catch(() => undefined);
  }
}
