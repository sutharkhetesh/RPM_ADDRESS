import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/validations/auth";
const valid = {
  fullName: "New Customer",
  email: "new@example.test",
  password: "Secure-password-123!",
  confirmPassword: "Secure-password-123!",
};
describe("User-owned registration credentials", () => {
  it("requires the user's full name", () => {
    expect(signupSchema.safeParse({ ...valid, fullName: "" }).success).toBe(
      false,
    );
  });
  it("requires matching passwords", () => {
    expect(
      signupSchema.safeParse({ ...valid, confirmPassword: "Mismatch-123!" })
        .success,
    ).toBe(false);
  });
  it("rejects missing and short credentials", () => {
    expect(
      signupSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
    expect(signupSchema.safeParse({ fullName: "New Customer" }).success).toBe(
      false,
    );
  });
  it("normalizes email and strips submitted account identifiers", () => {
    const parsed = signupSchema.parse({
      ...valid,
      email: " NEW@EXAMPLE.TEST ",
      userId: crypto.randomUUID(),
    });
    expect(parsed.email).toBe("new@example.test");
    expect(parsed).not.toHaveProperty("userId");
  });
  it("keeps existing login credentials valid without registration-only fields", () => {
    expect(
      loginSchema.safeParse({ email: valid.email, password: valid.password })
        .success,
    ).toBe(true);
  });
  it("allows a nonempty short password to reach login verification while enforcing signup strength", () => {
    expect(
      loginSchema.safeParse({ email: valid.email, password: "wrong" }).success,
    ).toBe(true);
    expect(
      signupSchema.safeParse({
        ...valid,
        password: "wrong",
        confirmPassword: "wrong",
      }).success,
    ).toBe(false);
  });
});
