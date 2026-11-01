import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody } from "@cc/shared";
import { AppError } from "../lib/errors.js";

/** body-parser errors carry a `type` such as "entity.parse.failed" or "entity.too.large". */
function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "type" in err) {
    const type = (err as { type: unknown }).type;
    if (typeof type === "string" && type.startsWith("entity.")) return type;
  }
  return undefined;
}

/** Runs when no route matched. */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError("NOT_FOUND", "The requested resource was not found.", 404));
}

/** Turns every error into the standard error body. Never leaks internals on 500s. */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on our side. Please try again.";
  let details: Record<string, unknown> = {};

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else {
    const parserErrorType = bodyParserErrorType(err);
    if (parserErrorType !== undefined) {
      const tooLarge = parserErrorType === "entity.too.large";
      status = tooLarge ? 413 : 400;
      code = tooLarge ? "PAYLOAD_TOO_LARGE" : "VALIDATION_FAILED";
      message = tooLarge ? "The request body is too large." : "The request body is not valid JSON.";
    }
  }

  if (status >= 500) {
    req.log.error({ err }, "Unhandled error");
  } else {
    req.log.warn({ code, status }, "Request rejected");
  }

  const body: ApiErrorBody = { error: { code, message, details } };
  res.status(status).json(body);
}
