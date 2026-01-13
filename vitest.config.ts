import path from "node:path"
import { defineConfig } from "vitest/config"

const resolve = (segment: string) => path.resolve(__dirname, segment)

export default defineConfig({
  test: {
    setupFiles: ["src/setup.ts"],
    testTimeout: 10_000, // account for long first ast parse
  },
  resolve: { alias: { "@": resolve("src") } },
})
