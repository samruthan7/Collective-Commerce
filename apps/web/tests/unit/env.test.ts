import { describe, expect, it } from "vitest";
import { parseWebEnv } from "@/lib/env";

describe("parseWebEnv", () => {
  it("accepts a URL and removes trailing slashes", () => {
    expect(parseWebEnv({ NEXT_PUBLIC_API_URL: "http://localhost:4000/" }).NEXT_PUBLIC_API_URL).toBe(
      "http://localhost:4000",
    );
    expect(
      parseWebEnv({ NEXT_PUBLIC_API_URL: "https://api.example.com" }).NEXT_PUBLIC_API_URL,
    ).toBe("https://api.example.com");
  });

  it("requires NEXT_PUBLIC_API_URL", () => {
    expect(() => parseWebEnv({})).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("rejects values that are not URLs", () => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_API_URL: "localhost:4000" })).toThrow(
      /NEXT_PUBLIC_API_URL/,
    );
  });
});
