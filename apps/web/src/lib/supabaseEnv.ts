import { z } from "@cc/shared";

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("must be a full URL such as https://abc.supabase.co"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, "looks too short to be a real key"),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

/** Validates the browser-visible Supabase settings. Throws a readable error when invalid. */
export function parseSupabaseEnv(
  source: Readonly<Record<string, string | undefined>>,
): SupabaseEnv {
  const result = supabaseEnvSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
    );
    throw new Error(`Invalid Supabase environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}

/** NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline them. */
export function getSupabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
/** True when both Supabase settings are present and valid. Never throws. */
export function isSupabaseConfigured(): boolean {
  return supabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }).success;
}
