import { defineConfig } from "vitest/config";
import path from "node:path";

// `pnpm test`: pure unit tests. `pnpm test:db`: tests that need the docker-compose MySQL.
const db = process.env.TEST_DB === "1";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: db ? ["src/**/*.db.test.ts"] : ["src/**/*.test.ts"],
    exclude: db ? [] : ["src/**/*.db.test.ts"],
  },
});
