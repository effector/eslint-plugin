import path from "node:path"
import fs from "node:fs/promises"
import { defineRoutes } from "vitepress"

const changelog = path.join(process.cwd(), "CHANGELOG.md")
const watch = path.relative(path.dirname(__filename), changelog)

const loader = defineRoutes({
  watch,
  paths: async ([path]) => {
    const markdown = await fs.readFile(path, { encoding: "utf-8" })
    return [{ params: { external: "changelog" }, content: markdown }]
  },
})

export default loader
