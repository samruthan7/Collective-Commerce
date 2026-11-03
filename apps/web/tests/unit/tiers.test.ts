import { describe, expect, it } from "vitest";
import { effectiveTier, nextTier } from "@/lib/tiers";

const tiers = [
  { minMembers: 10, unitPricePaise: 90000 },
  { minMembers: 25, unitPricePaise: 85000 },
  { minMembers: 50, unitPricePaise: 80000 },
];

describe("tiers", () => {
  it("returns the best unlocked tier", () => {
    expect(effectiveTier(tiers, 30)?.unitPricePaise).toBe(85000);
    expect(effectiveTier(tiers, 50)?.unitPricePaise).toBe(80000);
  });
  it("returns null below the first tier", () => {
    expect(effectiveTier(tiers, 9)).toBeNull();
  });
  it("finds the next tier", () => {
    expect(nextTier(tiers, 30)?.minMembers).toBe(50);
    expect(nextTier(tiers, 50)).toBeNull();
  });
});
