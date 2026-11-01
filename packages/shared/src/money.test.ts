import { describe, expect, it } from "vitest";
import {
  formatINR,
  isPaise,
  paiseSchema,
  parsePaise,
  positivePaiseSchema,
  rupeesToPaise,
} from "./money.js";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(7450000)).toBe("₹74,500");
    expect(formatINR(74500000)).toBe("₹7,45,000");
    expect(formatINR(123456700)).toBe("₹12,34,567");
    expect(formatINR(10_000_000_000)).toBe("₹10,00,00,000");
  });

  it("shows paise only when they are not zero", () => {
    expect(formatINR(100)).toBe("₹1");
    expect(formatINR(12345)).toBe("₹123.45");
    expect(formatINR(5)).toBe("₹0.05");
    expect(formatINR(7450050)).toBe("₹74,500.50");
  });

  it("always shows two decimals when requested", () => {
    expect(formatINR(100000, { fractionDigits: "always" })).toBe("₹1,000.00");
    expect(formatINR(12345, { fractionDigits: "always" })).toBe("₹123.45");
  });

  it("formats negative amounts (discounts)", () => {
    expect(formatINR(-200000)).toBe("-₹2,000");
    expect(formatINR(-5)).toBe("-₹0.05");
  });

  it("throws on anything that is not a safe integer of paise", () => {
    expect(() => formatINR(10.5)).toThrow(RangeError);
    expect(() => formatINR(Number.NaN)).toThrow(RangeError);
    expect(() => formatINR(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => formatINR(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe("rupeesToPaise", () => {
  it("converts exactly, avoiding floating-point errors", () => {
    expect(rupeesToPaise("74500")).toBe(7450000);
    expect(rupeesToPaise("74500.5")).toBe(7450050);
    expect(rupeesToPaise("19.99")).toBe(1999); // 19.99 * 100 === 1998.9999999999998 in floats
    expect(rupeesToPaise("0.05")).toBe(5);
    expect(rupeesToPaise("10.1")).toBe(1010);
    expect(rupeesToPaise("0")).toBe(0);
  });

  it("accepts the rupee sign, commas and spaces", () => {
    expect(rupeesToPaise("₹7,45,000")).toBe(74500000);
    expect(rupeesToPaise(" 1,000.00 ")).toBe(100000);
  });

  it("handles negative amounts", () => {
    expect(rupeesToPaise("-2000")).toBe(-200000);
  });

  it("rejects invalid input", () => {
    for (const bad of ["", "abc", "1.234", "12.", "--5", "1e5", "12345678901234"]) {
      expect(() => rupeesToPaise(bad), `input: "${bad}"`).toThrow(RangeError);
    }
  });
});

describe("parsePaise", () => {
  it("accepts strings (pg BIGINT), numbers and bigints", () => {
    expect(parsePaise("7450000")).toBe(7450000);
    expect(parsePaise(7450000)).toBe(7450000);
    expect(parsePaise(7450000n)).toBe(7450000);
    expect(parsePaise("-200000")).toBe(-200000);
    expect(parsePaise("0")).toBe(0);
  });

  it("rejects decimals, text and values beyond the safe range", () => {
    expect(() => parsePaise("12.5")).toThrow(RangeError);
    expect(() => parsePaise("abc")).toThrow(RangeError);
    expect(() => parsePaise("")).toThrow(RangeError);
    expect(() => parsePaise("9007199254740993")).toThrow(RangeError);
    expect(() => parsePaise(1.5)).toThrow(RangeError);
    expect(() => parsePaise(Number.NaN)).toThrow(RangeError);
    expect(() => parsePaise(9007199254740993n)).toThrow(RangeError);
  });
});

describe("paise Zod schemas", () => {
  it("paiseSchema accepts zero and positive integers only", () => {
    expect(paiseSchema.safeParse(0).success).toBe(true);
    expect(paiseSchema.safeParse(7450000).success).toBe(true);
    expect(paiseSchema.safeParse(-1).success).toBe(false);
    expect(paiseSchema.safeParse(1.5).success).toBe(false);
    expect(paiseSchema.safeParse("100").success).toBe(false);
    expect(isPaise(100)).toBe(true);
  });

  it("positivePaiseSchema rejects zero", () => {
    expect(positivePaiseSchema.safeParse(1).success).toBe(true);
    expect(positivePaiseSchema.safeParse(0).success).toBe(false);
    expect(positivePaiseSchema.safeParse(-5).success).toBe(false);
  });
});