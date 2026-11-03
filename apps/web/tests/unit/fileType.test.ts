import { describe, expect, it } from "vitest";
import { detectFileKind } from "../../src/lib/fileType";

describe("detectFileKind", () => {
  it("recognises a PDF", () => {
    expect(detectFileKind(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))?.ext).toBe("pdf");
  });

  it("recognises a PNG", () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
    expect(detectFileKind(new Uint8Array(png))?.ext).toBe("png");
  });

  it("recognises a JPEG", () => {
    expect(detectFileKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
  });

  it("rejects anything else", () => {
    expect(detectFileKind(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
    expect(detectFileKind(new Uint8Array([]))).toBeNull();
  });
});
