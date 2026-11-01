import { z } from "@cc/shared";

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

function parseOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/** A browser origin is scheme + host (+ port) with no path and no trailing slash. */
function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  } catch {
    return false;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform(parseOrigins)
    .refine(
      (origins) => origins.length > 0 && origins.every(isOrigin),
      "must be a comma-separated list of origins like http://localhost:3000 (no path, no trailing slash)",
    ),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables. Throws EnvValidationError listing every
 * problem, so the server refuses to boot with a bad configuration (Part 13).
 */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
    );
    throw new EnvValidationError(`Invalid environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}