import { Router } from "express";

export function createV1Router(): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).json({ name: "Collective Commerce API", version: "v1" });
  });

  // Phase 2+: router.use("/me", ...), router.use("/categories", ...), and so on.

  return router;
}
