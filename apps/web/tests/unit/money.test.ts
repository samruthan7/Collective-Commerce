import { describe, expect, it } from "vitest";
import { formatPaiseAsINR } from "@/lib/money";

describe("formatPaiseAsINR", () => {
  it("formats whole rupees without decimals", () => {
    expect(formatPaiseAsINR(1499900)).toMatch(/₹\s?14,999$/);
  });

  it("uses Indian digit grouping", () => {
    expect(formatPaiseAsINR(12345600)).toMatch(/1,23,456$/);
  });

  it("shows paise when there are any, and rejects fractions of a paisa", () => {
    expect(formatPaiseAsINR(150050)).toMatch(/1,500\.50$/);
    expect(() => formatPaiseAsINR(10.5)).toThrow(RangeError);
  });
});
