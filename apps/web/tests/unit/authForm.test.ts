import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/authForm";

describe("safeRedirectPath", () => {
  it("allows paths inside this site", () => {
    expect(safeRedirectPath("/seller")).toBe("/seller");
    expect(safeRedirectPath("/dashboard?tab=groups")).toBe("/dashboard?tab=groups");
  });

  it("falls back when the value is missing or not text", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(42)).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
  });

  it("rejects other sites and backslash tricks", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("evil", "/home")).toBe("/home");
  });
});
