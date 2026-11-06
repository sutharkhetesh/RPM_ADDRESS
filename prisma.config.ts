import { databaseUrl } from "./src/lib/database-url.mjs";
import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: databaseUrl(
      process.env.DIRECT_URL ||
        process.env.DATABASE_URL ||
        "postgresql://localhost:5432/addressly",
    ),
  },
});
