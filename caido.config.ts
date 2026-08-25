import path from "path";

import tailwindCaido from "@caido/tailwindcss";
import { defineConfig } from "@caido-community/dev";
import vue from "@vitejs/plugin-vue";
import prefixwrap from "postcss-prefixwrap";
import tailwindcss from "tailwindcss";
// @ts-expect-error no declared types at this time
import tailwindPrimeui from "tailwindcss-primeui";

const id = "race";

export default defineConfig({
  id,
  name: "Race",
  description:
    "Fire synchronized request bursts to catch HTTP race conditions.",
  version: "0.2.0",
  author: {
    name: "Amr Elsagaei",
    email: "info@amrelsagaei.com",
    url: "https://amrelsagaei.com",
  },
  plugins: [
    {
      kind: "backend",
      id: "race-backend",
      root: "packages/backend",
    },
    {
      kind: "frontend",
      id: "race-frontend",
      root: "packages/frontend",
      backend: {
        id: "race-backend",
      },
      vite: {
        plugins: [vue()],
        build: {
          rollupOptions: {
            external: [
              "@caido/frontend-sdk",
              "@caido/sdk-frontend",
              "@codemirror/autocomplete",
              "@codemirror/commands",
              "@codemirror/language",
              "@codemirror/lint",
              "@codemirror/search",
              "@codemirror/state",
              "@codemirror/view",
              "@lezer/common",
              "@lezer/highlight",
              "@lezer/lr",
              "vue",
            ],
          },
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "packages/frontend/src"),
          },
        },
        css: {
          postcss: {
            plugins: [
              tailwindcss({
                corePlugins: {
                  preflight: false,
                },
                content: [
                  "./packages/frontend/src/**/*.{vue,ts}",
                  "./node_modules/@caido/primevue/dist/primevue.mjs",
                ],
                darkMode: ["selector", '[data-mode="dark"]'],
                plugins: [tailwindPrimeui, tailwindCaido],
              }),
              prefixwrap(`.plugin--${id}`),
            ],
          },
        },
      },
    },
  ],
});
