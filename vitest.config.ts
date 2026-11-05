import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/database-setup.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
