import { it, expect, inject } from "vitest";
import { Client } from "pg";
import { execFileSync } from "node:child_process";

it("deploys to plain PostgreSQL and preserves data when deployed again", async () => {
  const url = new URL(inject("databaseUrl"));
  const name = `migration_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  let client: Client | undefined;
  const deploy = () =>
    execFileSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      {
        env: {
          ...process.env,
          DATABASE_URL: url.toString(),
          DIRECT_URL: url.toString(),
        },
        stdio: "pipe",
      },
    );
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    url.pathname = `/${name}`;
    deploy();
    client = new Client({ connectionString: url.toString() });
    await client.connect();
    const id = crypto.randomUUID();
    await client.query(
      'INSERT INTO "User" (id,email,"fullName","passwordHash") VALUES($1,$2,$3,$4)',
      [
        id,
        "migration@example.test",
        "Existing Account",
        "existing-password-hash",
      ],
    );
    await client.query(
      'INSERT INTO "Session" ("tokenHash","userId","expiresAt") VALUES($1,$2,NOW()+INTERVAL \'30 days\')',
      ["a".repeat(64), id],
    );
    deploy();
    expect(
      (
        await client.query(
          'SELECT "fullName","passwordHash" FROM "User" WHERE id=$1',
          [id],
        )
      ).rows[0],
    ).toEqual({
      fullName: "Existing Account",
      passwordHash: "existing-password-hash",
    });
    expect(
      (await client.query('SELECT count(*)::int AS count FROM "Session"'))
        .rows[0].count,
    ).toBe(1);
    expect(
      (await client.query('SELECT migration_name FROM "_prisma_migrations"'))
        .rows,
    ).toEqual([{ migration_name: "20261106000000_neon_baseline" }]);
    expect(
      (await client.query("SELECT to_regnamespace('auth') IS NULL AS plain"))
        .rows[0].plain,
    ).toBe(true);
    expect(
      (
        await client.query(
          "SELECT count(*)::int AS count FROM pg_class WHERE relnamespace='public'::regnamespace AND relrowsecurity",
        )
      ).rows[0].count,
    ).toBe(4);
    expect(
      (
        await client.query(
          "SELECT count(*)::int AS count FROM pg_indexes WHERE schemaname='public' AND indexname IN ('Address_one_default_shipping','Address_one_default_billing')",
        )
      ).rows[0].count,
    ).toBe(2);
  } finally {
    await client?.end();
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
    await admin.end();
  }
}, 30000);
