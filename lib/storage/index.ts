import { env } from "@/lib/env";
import { LocalStorageProvider } from "./local";
import { VercelBlobStorageProvider } from "./vercel-blob";
import type { StorageProvider } from "./types";

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!provider) {
    provider = env.storage.provider === "vercel-blob"
      ? new VercelBlobStorageProvider()
      : new LocalStorageProvider();
  }
  return provider;
}

export * from "./types";
