import type { RawConfigurationOrFn } from "knip/dist/types/config.js";

const config: RawConfigurationOrFn = {
  workspaces: {
    ".": {
      entry: [
        "caido.config.ts",
        "eslint.config.mjs",
        "vitest.config.ts",
        "scripts/check-file-length.mjs",
      ],
    },
    "packages/shared": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
    },
    "packages/backend": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["caido", "shared"],
    },
    "packages/frontend": {
      entry: [
        "src/index.ts",
        "src/plugins/sdk.ts",
        "src/services/script/worker.ts",
        "src/vite-env.d.ts",
      ],
      project: ["src/**/*.{ts,tsx,vue}"],
      ignoreDependencies: ["shared"],
    },
  },
};

export default config;
