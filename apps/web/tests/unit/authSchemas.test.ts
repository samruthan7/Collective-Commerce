import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/authSchemas";

describe("loginSchema", () => {
  it("accepts valid details and tidies the email", () => {
    const result = loginSchema.parse({ email: "  Asha@Example.COM ", password: "anything" });
    expect(result.email).toBe("asha@example.com");
  });

  it("rejects an empty password and a bad email", () => {
    expect(loginSchema.safeParse({ email: "asha@example.com", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = { fullName: "Asha Rao", email: "asha@example.com", password: "long-enough-1" };

  it("accepts valid details", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a short password, a short name and an over-long password", () => {
    expect(signupSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, fullName: "A" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "x".repeat(73) }).success).toBe(false);
  });
});
