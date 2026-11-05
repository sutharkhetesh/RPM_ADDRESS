import "dotenv/config";
import pg from "pg";
import { databaseUrl } from "../src/lib/database-url.mjs";
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from .env.");
  process.exit(1);
}
const client = new pg.Client({
  connectionString: databaseUrl(process.env.DATABASE_URL),
  connectionTimeoutMillis: 10000,
});
try {
  await client.connect();
  const { rows } = await client.query(
    `SELECT to_regclass('public."Address"') IS NOT NULL AS migrated, to_regclass('public."User"') IS NOT NULL AS accounts, to_regclass('public."Session"') IS NOT NULL AS sessions`,
  );
  console.log(JSON.stringify({ connected: true, ...rows[0] }));
} catch (error) {
  console.error("Database check failed:", error.code ?? "CONNECTION_ERROR");
  if (
    error.code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  )
    console.error(
      "Download the CA certificate from Supabase Database Settings → SSL Configuration to certs/supabase-ca.crt.",
    );
  process.exitCode = 1;
} finally {
  await client.end();
}
