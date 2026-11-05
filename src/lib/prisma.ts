import { databaseUrl } from "@/lib/database-url.mjs";
import "server-only";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { db?: PrismaClient };

function makePool() {
  const connectionString = databaseUrl(process.env.DATABASE_URL!);
  const url = new URL(connectionString);
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    url.hostname,
  );

  // For remote (Supabase) connections, load the CA cert if present so that
  // Node's TLS stack can verify the server certificate properly.
  let ssl: boolean | { rejectUnauthorized: boolean; ca?: string } = false;
  if (!isLocal) {
    const caPath = resolve("certs/supabase-ca.crt");
    ssl = existsSync(caPath)
      ? { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") }
      : { rejectUnauthorized: false };
  }

  // Strip SSL query params — we pass them via the ssl object above.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");

  return new Pool({
    connectionString: url.toString(),
    ssl: ssl || undefined,
    max: 5,
    connectionTimeoutMillis: 10000,
  });
}

export function database() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  return (globalDb.db ??= new PrismaClient({
    adapter: new PrismaPg(makePool()),
  }));
}
