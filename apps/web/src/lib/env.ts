import { z } from "@cc/shared";
function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .regex(/^https?:\/\/.+/i, "NEXT_PUBLIC_API_URL must start with http:// or https://")
    .transform(stripTrailingSlashes),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

/** Validates the browser-visible environment. Throws a readable error when invalid. */
export function parseWebEnv(source: Readonly<Record<string, string | undefined>>): WebEnv {
  const result = webEnvSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
    );
    throw new Error(`Invalid web environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}

// NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline them in the browser.
// The localhost default is for development only: production must set the variable explicitly.
export const env = parseWebEnv({
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "production" ? undefined : "http://localhost:4000"),
});
