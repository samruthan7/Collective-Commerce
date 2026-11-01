import request from "supertest";
import { describe, expect, it } from "vitest";
import { apiErrorBodySchema } from "@cc/shared";
import { createApp } from "../../src/app.js";
import { parseEnv } from "../../src/config/env.js";
import { createLogger } from "../../src/lib/logger.js";

const env = parseEnv({ NODE_ENV: "test", CORS_ORIGINS: "http://localhost:3000" });
const app = createApp({ env, logger: createLogger(env) });

describe("GET /health", () => {
  it("returns 200 with status ok and secure headers", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("cc-api");
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("keeps a valid client X-Request-Id and replaces an unsafe one", async () => {
    const kept = await request(app).get("/health").set("X-Request-Id", "abc-123_XYZ");
    expect(kept.headers["x-request-id"]).toBe("abc-123_XYZ");

    const replaced = await request(app).get("/health").set("X-Request-Id", "not a valid id!");
    expect(replaced.headers["x-request-id"]).not.toBe("not a valid id!");
    expect(replaced.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("API basics", () => {
  it("GET /api/v1 identifies the versioned API", async () => {
    const res = await request(app).get("/api/v1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "Collective Commerce API", version: "v1" });
  });

  it("unknown routes return 404 in the standard error shape", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    const body = apiErrorBodySchema.parse(res.body);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("malformed JSON returns 400 VALIDATION_FAILED in the standard error shape", async () => {
    const res = await request(app)
      .post("/api/v1/anything")
      .set("Content-Type", "application/json")
      .send("{ this is not json");
    expect(res.status).toBe(400);
    const body = apiErrorBodySchema.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("CORS allows the configured origin and not others", async () => {
    const allowed = await request(app).get("/health").set("Origin", "http://localhost:3000");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");

    const blocked = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
