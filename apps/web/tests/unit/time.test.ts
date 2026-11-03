import { describe, expect, it } from "vitest";
import { formatTimeLeft } from "@/lib/time";

const now = new Date("2026-11-02T10:00:00Z");

describe("formatTimeLeft", () => {
  it("shows days and hours", () => {
    expect(formatTimeLeft("2026-11-04T13:00:00Z", now)).toBe("2d 3h left");
  });
  it("shows hours and minutes, then minutes only", () => {
    expect(formatTimeLeft("2026-11-02T12:30:00Z", now)).toBe("2h 30m left");
    expect(formatTimeLeft("2026-11-02T10:05:00Z", now)).toBe("5m left");
  });
  it("says Closed once the time has passed", () => {
    expect(formatTimeLeft("2026-11-02T09:59:00Z", now)).toBe("Closed");
  });
});
