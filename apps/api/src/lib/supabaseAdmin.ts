import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "@cc/shared";

const apiSupabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url("must be a full URL such as https://abc.supabase.co"),
  SUPABASE_SECRET_KEY: z.string().min(20, "looks too short to be a real key"),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20, "looks too short to be a real key"),
});

export type ApiSupabaseEnv = z.infer<typeof apiSupabaseEnvSchema>;

/** Validates the API's Supabase settings. Throws a readable error when invalid. */
export function parseSupabaseEnv(
  source: Readonly<Record<string, string | undefined>>,
): ApiSupabaseEnv {
  const result = apiSupabaseEnvSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
    );
    throw new Error(`Invalid Supabase environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}

const serverOptions = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Full access, bypasses row level security. Use only for trusted server-side work. */
export function createSupabaseAdmin(env: ApiSupabaseEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, serverOptions);
}

/** Same access as a logged-out visitor. Obeys row level security. */
export function createSupabasePublic(env: ApiSupabaseEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, serverOptions);
}
