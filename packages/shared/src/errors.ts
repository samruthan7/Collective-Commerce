import { z } from "zod";

/**
 * The ONE error shape every API error uses (Part 7.1), so the frontend
 * can handle errors in a single place.
 */
export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;