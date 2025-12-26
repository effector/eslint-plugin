import { defineConfig } from "tsdown"

export default defineConfig({
  entry: "src/index.ts",

  target: "es2022",
  format: ["esm", "cjs"],
  platform: "node",

  minify: "dce-only",

  external: ["typescript", "@typescript-eslint/utils"],
})
