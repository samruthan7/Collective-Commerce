import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Logger } from "pino";
import type { Env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";
import { createHealthRouter } from "./modules/health/routes.js";
import { createV1Router } from "./routes.js";

export interface AppDependencies {
  env: Env;
  logger: Logger;
}

/**
 * Builds the Express app without starting a server, so tests can call it directly.
 * Order matters: request context, security headers, CORS, body parsing, routes,
 * 404, then the error handler last.
 */
export function createApp({ env, logger }: AppDependencies): Express {
  const app = express();

  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") {
    // Render puts one proxy in front of the API; needed for correct client IPs later.
    app.set("trust proxy", 1);
  }

  app.use(requestContext(logger));
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "X-Request-Id"],
      exposedHeaders: ["X-Request-Id"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.use("/health", createHealthRouter(env));
  app.use("/api/v1", createV1Router());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
