import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Logger } from "pino";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Unique ID of this request, also returned in the X-Request-Id header. */
      id: string;
      /** Logger that already includes the request ID. */
      log: Logger;
    }
  }
}

// Only accept simple client-supplied IDs, so nobody can inject junk into our logs.
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function requestContext(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.header("x-request-id");
    req.id = incoming !== undefined && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    req.log = logger.child({ reqId: req.id });
    res.setHeader("X-Request-Id", req.id);

    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      req.log.info(
        {
          method: req.method,
          path: req.originalUrl.split("?")[0],
          status: res.statusCode,
          durationMs: Math.round(durationMs * 10) / 10,
        },
        "request completed",
      );
    });

    next();
  };
}