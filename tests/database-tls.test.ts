import { beforeEach, describe, expect, it, vi } from "vitest";
const files = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("node:fs", () => ({
  readFileSync: files.read,
}));
import { databasePoolConfig, databaseUrl } from "@/lib/database-url.mjs";

describe("Database TLS configuration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    files.read.mockReturnValue("trusted-ca");
  });
  it("verifies remote certificates even when no custom CA exists", () => {
    const config = databasePoolConfig(
      "postgresql://user:secret@db.example.test/app?sslmode=no-verify",
    );
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
    expect(new URL(config.connectionString).searchParams.has("sslmode")).toBe(
      false,
    );
  });
  it("uses system trust for Neon without loading a provider-specific CA", () => {
    const connection =
      "postgresql://user:secret@ep-rpm-pooler.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    expect(databasePoolConfig(connection).ssl).toEqual({
      rejectUnauthorized: true,
    });
    expect(databasePoolConfig(connection).enableChannelBinding).toBe(true);
    expect(
      new URL(databaseUrl(connection)).searchParams.has("sslrootcert"),
    ).toBe(false);
    expect(files.read).not.toHaveBeenCalled();
  });
  it("supports an explicit system trust setting", () => {
    expect(
      databasePoolConfig("postgresql://db.example.test/app?sslrootcert=system")
        .ssl,
    ).toEqual({ rejectUnauthorized: true });
    expect(files.read).not.toHaveBeenCalled();
  });
  it("honors an explicitly configured CA instead of replacing it", () => {
    const connection =
      "postgresql://db.example.test/app?sslrootcert=/tmp/custom-ca.crt";
    expect(
      new URL(databaseUrl(connection)).searchParams.get("sslrootcert"),
    ).toBe("/tmp/custom-ca.crt");
    expect(databasePoolConfig(connection).ssl?.rejectUnauthorized).toBe(true);
    expect(files.read).toHaveBeenCalledWith("/tmp/custom-ca.crt", "utf8");
  });
  it("fails closed when the configured CA cannot be read", () => {
    files.read.mockImplementation(() => {
      throw new Error("Missing CA");
    });
    expect(() =>
      databasePoolConfig(
        "postgresql://db.example.test/app?sslrootcert=/tmp/missing-ca.crt",
      ),
    ).toThrow("Missing CA");
  });
  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "keeps local test connections working on %s",
    (host) => {
      expect(
        databasePoolConfig(`postgresql://${host}/test`).ssl,
      ).toBeUndefined();
      expect(files.read).not.toHaveBeenCalled();
    },
  );
});
