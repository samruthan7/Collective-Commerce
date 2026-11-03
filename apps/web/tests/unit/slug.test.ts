import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Demo Phone One!")).toBe("demo-phone-one");
  });
  it("strips accents and stray dashes", () => {
    expect(slugify("  Café --- Pro  ")).toBe("cafe-pro");
  });
});
