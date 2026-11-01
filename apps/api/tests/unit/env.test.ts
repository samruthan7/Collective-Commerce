import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv } from "../../src/config/env.js";

describe("parseEnv", () => {
  it("applies safe defaults when nothing is set", () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: "development",
      PORT: 4000,
      LOG_LEVEL: "info",
      CORS_ORIGINS: ["http://localhost:3000"],
    });
  });

  it("parses explicit values, including several CORS origins", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      PORT: "5000",
      LOG_LEVEL: "warn",
      CORS_ORIGINS: "http://localhost:3000, https://app.example.com",
    });
    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(5000);
    expect(env.LOG_LEVEL).toBe("warn");
    expect(env.CORS_ORIGINS).toEqual(["http://localhost:3000", "https://app.example.com"]);
  });

  it("refuses invalid PORT, NODE_ENV and LOG_LEVEL and names the variable", () => {
    const cases: Array<[string, Record<string, string>]> = [
      ["PORT", { PORT: "abc" }],
      ["PORT", { PORT: "0" }],
      ["PORT", { PORT: "70000" }],
      ["NODE_ENV", { NODE_ENV: "staging" }],
      ["LOG_LEVEL", { LOG_LEVEL: "loud" }],
    ];
    for (const [variable, source] of cases) {
      expect(() => parseEnv(source), JSON.stringify(source)).toThrow(EnvValidationError);
      expect(() => parseEnv(source), JSON.stringify(source)).toThrow(new RegExp(variable));
    }
  });

  it("refuses CORS origins that are not plain origins", () => {
    for (const bad of ["localhost", "http://localhost:3000/", "http://localhost:3000/app", ""]) {
      expect(() => parseEnv({ CORS_ORIGINS: bad }), `value: "${bad}"`).toThrow(/CORS_ORIGINS/);
    }
  });
});
