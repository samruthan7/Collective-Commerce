import { apiErrorBodySchema, type z } from "@cc/shared";
import { env } from "./env";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * GET a path from the API and validate the response with a Zod schema.
 * `path` starts with "/" (for example "/health" or "/api/v1/me").
 */
export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Cannot reach the server. Check your connection and try again.",
      0,
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = apiErrorBodySchema.safeParse(payload);
    if (parsed.success) {
      throw new ApiError(parsed.data.error.code, parsed.data.error.message, response.status);
    }
    throw new ApiError("UNKNOWN_ERROR", `Unexpected response (${response.status}).`, response.status);
  }

  return schema.parse(payload);
}