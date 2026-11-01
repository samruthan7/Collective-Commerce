import { createApp } from "./app.js";
import { parseEnv, type Env } from "./config/env.js";
import { createLogger } from "./lib/logger.js";

function loadEnvOrExit(): Env {
  try {
    return parseEnv(process.env);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

const env = loadEnvOrExit();
const logger = createLogger(env);
const app = createApp({ env, logger });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, "API listening");
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logger.fatal({ port: env.PORT }, "Port is already in use");
  } else {
    logger.fatal({ err: error }, "Server error");
  }
  process.exit(1);
});

// Render sends SIGTERM on every deploy: stop accepting requests, finish in-flight ones, exit.
function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down");
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Error while closing the server");
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after 10 seconds");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  process.exit(1);
});