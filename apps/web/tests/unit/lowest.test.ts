import { describe, expect, it } from "vitest";
import { lowestIndex } from "@/lib/tiers";

describe("lowestIndex", () => {
  it("finds the cheapest price", () => {
    expect(lowestIndex([90000, 85000, 88000])).toBe(1);
  });
  it("skips offers with no unlocked tier", () => {
    expect(lowestIndex([null, 85000, null])).toBe(1);
  });
  it("returns -1 when nothing is unlocked", () => {
    expect(lowestIndex([null, null])).toBe(-1);
  });
});
