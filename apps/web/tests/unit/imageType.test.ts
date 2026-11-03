import { describe, expect, it } from "vitest";
import { detectImageKind } from "../../src/lib/imageType";

describe("detectImageKind", () => {
  it("recognises JPEG and PNG", () => {
    expect(detectImageKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
    expect(detectImageKind(new Uint8Array(png))?.ext).toBe("png");
  });

  it("recognises WebP", () => {
    const webp = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
    expect(detectImageKind(new Uint8Array(webp))?.ext).toBe("webp");
  });

  it("rejects other files, including PDFs", () => {
    expect(detectImageKind(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBeNull();
    expect(detectImageKind(new Uint8Array([]))).toBeNull();
  });
});
