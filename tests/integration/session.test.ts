import { beforeAll, afterAll, describe, it, expect, inject } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  authenticateUser,
  sessionUser,
  revokeSession,
  consumeAuthAttempt,
} from "@/lib/session-service";
import { digestToken, verifyPassword } from "@/lib/password";
let db: PrismaClient;
const email = `${crypto.randomUUID()}@example.test`,
  password = "Secure-password-123!";
beforeAll(() => {
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: inject("databaseUrl") }),
  });
});
afterAll(async () => {
  await db.user.deleteMany({ where: { email } });
  await db.$disconnect();
});
describe("Database-only account and session lifecycle", () => {
  it("registers with a salted password hash and a hashed session token", async () => {
    const result = await authenticateUser(
      db,
      "signup",
      email,
      password,
      "Test Account",
    );
    expect("token" in result).toBe(true);
    if (!("token" in result)) throw new Error("Registration failed");
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).not.toContain(password);
    expect(await verifyPassword(password, user.passwordHash)).toBe(true);
    expect(
      await db.session.findUnique({
        where: { tokenHash: digestToken(result.token) },
      }),
    ).not.toBeNull();
    expect(
      await db.session.findUnique({ where: { tokenHash: result.token } }),
    ).toBeNull();
    expect(await sessionUser(db, result.token)).toMatchObject({
      id: user.id,
      email,
      fullName: "Test Account",
      onboardingCompletedAt: null,
    });
    await revokeSession(db, result.token);
    expect(await sessionUser(db, result.token)).toBeNull();
  });
  it("rejects wrong passwords and unknown accounts", async () => {
    expect(
      await authenticateUser(db, "login", email, "wrong-password"),
    ).toEqual({ error: "Incorrect password. Please try again." });
    expect(
      await authenticateUser(db, "login", "missing@example.test", password),
    ).toEqual({ error: "No account found with this email. Please sign up." });
  });
  it("signs in and rejects expired sessions", async () => {
    const result = await authenticateUser(db, "login", email, password);
    if (!("token" in result)) throw new Error("Login failed");
    await db.session.update({
      where: { tokenHash: digestToken(result.token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await sessionUser(db, result.token)).toBeNull();
  });
  it("rejects forged and malformed tokens", async () => {
    expect(await sessionUser(db, "0".repeat(64))).toBeNull();
    expect(await sessionUser(db, "arbitrary-client-user-id")).toBeNull();
  });
  it("throttles attempts in the database", async () => {
    const account = `${crypto.randomUUID()}@example.test`;
    for (let i = 0; i < 10; i++)
      expect(await consumeAuthAttempt(db, account)).toBe(true);
    expect(await consumeAuthAttempt(db, account)).toBe(false);
  });
  it("prevents duplicate email registration from replacing credentials", async () => {
    expect(
      await authenticateUser(
        db,
        "signup",
        email,
        "Other-password-123!",
        "Another Name",
      ),
    ).toEqual({
      error: "An account with this email already exists. Please sign in.",
    });
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(await verifyPassword(password, user.passwordHash)).toBe(true);
  });
});
