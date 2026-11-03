export interface AuthFormState {
  error: string | null;
  notice: string | null;
}

export const initialAuthFormState: AuthFormState = { error: null, notice: null };

/**
 * Only allows paths inside this site. Anything else (other sites, "//host",
 * backslashes, non-text values) falls back to a safe default.
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
