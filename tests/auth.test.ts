import { beforeEach, afterAll, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  sessionUser: vi.fn(),
  get: vi.fn(),
  db: {},
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ database: () => mocks.db }));
vi.mock("@/lib/session-service", () => ({ sessionUser: mocks.sessionUser }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
import { requireUser } from "@/lib/auth";
const originalUrl = process.env.DATABASE_URL;
describe("Database session authentication boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DATABASE_URL = "postgresql://localhost/test";
    mocks.get.mockReturnValue({ value: "session-token" });
  });
  afterAll(() => {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  });
  it("rejects missing, expired or revoked sessions", async () => {
    mocks.sessionUser.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("redirect:/login");
  });
  it("derives identity from the session stored in PostgreSQL", async () => {
    const user = { id: crypto.randomUUID(), email: "owner@example.test" };
    mocks.sessionUser.mockResolvedValue(user);
    expect(await requireUser()).toEqual(user);
    expect(mocks.sessionUser).toHaveBeenCalledWith(mocks.db, "session-token");
  });
  it("only requires DATABASE_URL for configuration", async () => {
    delete process.env.DATABASE_URL;
    await expect(requireUser()).rejects.toThrow("redirect:/setup");
    expect(mocks.sessionUser).not.toHaveBeenCalled();
  });
  it("allows users without addresses to access their account", async () => {
    const user = {
      id: crypto.randomUUID(),
      email: "new@example.test",
      fullName: "New Customer",
      onboardingCompletedAt: null,
    };
    mocks.sessionUser.mockResolvedValue(user);
    expect(await requireUser()).toEqual(user);
  });
  it("allows completed users into their dashboard", async () => {
    const user = {
      id: crypto.randomUUID(),
      email: "ready@example.test",
      fullName: "Ready Customer",
      onboardingCompletedAt: new Date(),
    };
    mocks.sessionUser.mockResolvedValue(user);
    expect(await requireUser()).toEqual(user);
  });
});
