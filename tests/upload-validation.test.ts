import { describe, expect, it } from "vitest";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  extensionFor,
  sniffImageMime,
} from "@/lib/storage/types";

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const webp = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.alloc(4),
  Buffer.from("WEBP", "ascii"),
  Buffer.alloc(16),
]);

describe("server-side image validation", () => {
  it("recognises the three accepted formats from magic bytes", () => {
    expect(sniffImageMime(png)).toBe("image/png");
    expect(sniffImageMime(jpeg)).toBe("image/jpeg");
    expect(sniffImageMime(webp)).toBe("image/webp");
  });

  it("rejects a file that merely claims to be an image", () => {
    const pdf = Buffer.concat([Buffer.from("%PDF-1.7", "ascii"), Buffer.alloc(16)]);
    expect(sniffImageMime(pdf)).toBeNull();
  });

  it("rejects an executable disguised with an image extension", () => {
    const elf = Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(16)]);
    expect(sniffImageMime(elf)).toBeNull();
  });

  it("rejects a truncated file", () => {
    expect(sniffImageMime(Buffer.from([0x89, 0x50]))).toBeNull();
  });

  it("maps every accepted type to a sane extension", () => {
    expect(ALLOWED_IMAGE_TYPES.map(extensionFor)).toEqual(["png", "jpg", "webp"]);
  });

  it("enforces the documented limits", () => {
    expect(MAX_IMAGES).toBe(5);
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });
});
