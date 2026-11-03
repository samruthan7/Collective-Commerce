import { describe, expect, it } from "vitest";
import { parseSupabaseEnv } from "@/lib/supabaseEnv";

const validKey = "sb_publishable_exampleexampleexample";

describe("parseSupabaseEnv", () => {
  it("accepts a URL and a publishable key", () => {
    const env = parseSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: validKey,
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcdefghijklmnopqrst.supabase.co");
  });

  it("names the missing variables", () => {
    expect(() => parseSupabaseEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => parseSupabaseEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("rejects a URL that is not a URL and a key that is too short", () => {
    expect(() =>
      parseSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "abcdefghijklmnopqrst.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "short",
      }),
    ).toThrow(/Invalid Supabase environment configuration/);
  });
});
