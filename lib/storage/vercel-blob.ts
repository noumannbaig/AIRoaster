import { del, put } from "@vercel/blob";
import { env } from "@/lib/env";
import { StorageError, type StorageProvider, type StoredFile } from "./types";

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob";

  isConfigured(): boolean {
    return Boolean(env.storage.blobToken);
  }

  async put({ key, body, mimeType }: { key: string; body: Buffer; mimeType: string }): Promise<StoredFile> {
    if (!this.isConfigured()) {
      throw new StorageError(
        "BLOB_READ_WRITE_TOKEN is not set. Add a Vercel Blob store to the project or set STORAGE_PROVIDER=local.",
        "not_configured",
      );
    }
    try {
      const result = await put(`${env.storage.bucket}/${key}`, body, {
        access: "public",
        contentType: mimeType,
        token: env.storage.blobToken,
        addRandomSuffix: false,
      });
      return { url: result.url, pathname: result.pathname, bytes: body.byteLength, mimeType };
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : "Blob upload failed", "upstream");
    }
  }

  async delete(pathname: string): Promise<void> {
    if (!this.isConfigured()) return;
    await del(pathname, { token: env.storage.blobToken }).catch(() => undefined);
  }
}
