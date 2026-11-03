import { describe, expect, it } from "vitest";
import { isValidGstin, panFromGstin } from "../../src/lib/gstin";

describe("isValidGstin", () => {
  it("accepts a GSTIN with a correct check digit", () => {
    expect(isValidGstin("27AAPFU0939F1ZV")).toBe(true);
  });

  it("accepts lowercase and surrounding spaces", () => {
    expect(isValidGstin("  27aapfu0939f1zv ")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidGstin("27AAPFU0939F1ZX")).toBe(false);
  });

  it("rejects a wrong shape or state code", () => {
    expect(isValidGstin("12345")).toBe(false);
    expect(isValidGstin("99AAPFU0939F1ZV")).toBe(false);
  });

  it("reads the PAN from the middle", () => {
    expect(panFromGstin("27AAPFU0939F1ZV")).toBe("AAPFU0939F");
  });
});
