import { defineConfig } from "vitest/config";

export default defineConfig({
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
