import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "packages/frontend/src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/backend/src/**/*.test.ts",
      "packages/frontend/src/**/*.test.ts",
      "packages/shared/src/**/*.test.ts",
    ],
  },
});
