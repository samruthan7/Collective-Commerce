import { Router } from "express";
import type { Env } from "../../config/env.js";

/** Used by Render's health check and the uptime monitor (Part 13). */
export function createHealthRouter(env: Pick<Env, "NODE_ENV">): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "cc-api",
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
