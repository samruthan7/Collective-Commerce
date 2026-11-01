import { pino, type Logger, type LoggerOptions } from "pino";
import type { Env } from "../config/env.js";

export function createLogger(env: Pick<Env, "NODE_ENV" | "LOG_LEVEL">): Logger {
  const options: LoggerOptions = {
    level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,
    base: { service: "cc-api" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.token",
        "*.authorization",
      ],
      censor: "[REDACTED]",
    },
  };

  if (env.NODE_ENV === "development") {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,service",
      },
    };
  }

  return pino(options);
}
