import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("dotenv/config", () => ({}));
vi.mock("prisma/config", () => ({ defineConfig: (config: unknown) => config }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
describe("Prisma migration connection", () => {
  it("uses the direct Neon connection for migrations", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://user:secret@ep-rpm-pooler.aws.neon.tech/neondb",
    );
    vi.stubEnv(
      "DIRECT_URL",
      "postgresql://user:secret@ep-rpm.aws.neon.tech/neondb",
    );
    const { default: config } = await import("../prisma.config");
    const url = new URL(config.datasource!.url!);
    expect(url.hostname).toBe("ep-rpm.aws.neon.tech");
    expect(url.searchParams.get("sslmode")).toBe("verify-full");
  });
  it("supports a single direct URL when DIRECT_URL is absent", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/existing");
    vi.stubEnv("DIRECT_URL", "");
    const { default: config } = await import("../prisma.config");
    expect(new URL(config.datasource!.url!).pathname).toBe("/existing");
  });
});
