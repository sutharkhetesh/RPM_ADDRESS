import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { execFileSync } from "node:child_process";
import type { TestProject } from "vitest/node";

export async function createTestDatabase() {
  const dir = await mkdtemp(join(tmpdir(), "addressly-test-"));
  const port = await new Promise<number>((resolve, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const a = s.address();
      if (!a || typeof a === "string") throw new Error("No test port");
      s.close(() => resolve(a.port));
    });
  });
  const password = crypto.randomUUID();
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: "postgres",
    password,
    port,
    persistent: false,
    autoRehydrateSymlinks: true,
    onLog: () => {},
    onError: () => {},
  });
  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("addressly_test");
    const url = `postgresql://postgres:${password}@localhost:${port}/addressly_test`;
    const { Client } = await import("pg");
    const client = new Client({ connectionString: url });
    await client.connect();
    // A generic unprivileged role for isolation tests; no hosted-auth schema.
    await client.query("CREATE ROLE app_guest");
    await client.end();
    execFileSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      {
        env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
        stdio: "pipe",
      },
    );
    return {
      url,
      dispose: async () => {
        await pg.stop();
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await pg.stop().catch(() => {});
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}
export default async function setup(project: TestProject) {
  const db = await createTestDatabase();
  project.provide("databaseUrl", db.url);
  return db.dispose;
}
declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
