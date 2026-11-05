import { it, expect, inject } from "vitest";
import { Client } from "pg";
import { readFile } from "node:fs/promises";
it("removes branches without deleting addresses and consolidates defaults per user", async () => {
  const url = new URL(inject("databaseUrl")),
    name = `migration_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  let client: Client | undefined;
  async function migrate(folder: string) {
    await client!.query(
      await readFile(
        new URL(
          `../../prisma/migrations/${folder}/migration.sql`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
  }
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    url.pathname = `/${name}`;
    client = new Client({ connectionString: url.toString() });
    await client.connect();
    await client.query(
      "CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;",
    );
    await migrate("20261105000000_init");
    await migrate("20261105010000_database_auth");
    const userId = crypto.randomUUID(),
      first = crypto.randomUUID();
    await client.query('INSERT INTO "User" (id,email) VALUES($1,$2)', [
      userId,
      "legacy@example.test",
    ]);
    await client.query(
      'INSERT INTO "Address" (id,"userId","fullName",phone,"addressLine1",city,state,"postalCode","addressType","isDefaultShipping","isDefaultBilling","createdAt","updatedAt") VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,true,$10,NOW())',
      [
        first,
        userId,
        "Legacy RPM Office",
        "9876543210",
        "12 Main Road",
        "Chennai",
        "Tamil Nadu",
        "600001",
        "BOTH",
        new Date("2025-01-01T00:00:00Z"),
      ],
    );
    await migrate("20261105020000_branches");
    const second = crypto.randomUUID(),
      branch = crypto.randomUUID();
    await client.query(
      'INSERT INTO "Branch" (id,"userId",name,city,state,"updatedAt") VALUES($1,$2,$3,$4,$5,NOW())',
      [branch, userId, "Another location", "Delhi", "Delhi"],
    );
    await client.query(
      'INSERT INTO "Address" (id,"userId","branchId","fullName",phone,"addressLine1",city,state,"postalCode","addressType","isDefaultShipping","isDefaultBilling","createdAt","updatedAt") VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true,$11,NOW())',
      [
        second,
        userId,
        branch,
        "Second Office",
        "9876543211",
        "24 Main Road",
        "Delhi",
        "Delhi",
        "110001",
        "BOTH",
        new Date("2025-02-01T00:00:00Z"),
      ],
    );
    await migrate("20261105030000_user_onboarding");
    const { rows } = await client.query(
      'SELECT id,"userId","fullName","isDefaultShipping","isDefaultBilling" FROM "Address" ORDER BY "createdAt"',
    );
    expect(rows).toEqual([
      {
        id: first,
        userId,
        fullName: "Legacy RPM Office",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      {
        id: second,
        userId,
        fullName: "Second Office",
        isDefaultShipping: false,
        isDefaultBilling: false,
      },
    ]);
    const account = await client.query(
      'SELECT "fullName","onboardingCompletedAt" IS NOT NULL AS completed FROM "User" WHERE id=$1',
      [userId],
    );
    expect(account.rows[0]).toEqual({
      fullName: "Legacy RPM Office",
      completed: true,
    });
    expect(
      (await client.query("SELECT to_regclass('public.\"Branch\"') AS branch"))
        .rows[0].branch,
    ).toBeNull();
  } finally {
    await client?.end();
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
    await admin.end();
  }
});
