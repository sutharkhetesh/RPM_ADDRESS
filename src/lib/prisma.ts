import { databasePoolConfig } from "@/lib/database-url.mjs";
import "server-only";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { db?: PrismaClient };

export function database() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  return (globalDb.db ??= new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        ...databasePoolConfig(process.env.DATABASE_URL),
        max: 5,
        connectionTimeoutMillis: 10000,
      }),
    ),
  }));
}
