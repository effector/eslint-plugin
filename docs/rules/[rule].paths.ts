import path from "node:path"
import fs from "node:fs/promises"
import { defineRoutes } from "vitepress"

const rules = path.join(process.cwd(), "src/rules")
const watch = path.relative(path.dirname(__filename), rules)

const routes = defineRoutes({
  watch: path.join(watch, "*/*.md"),
  paths: async (paths) => {
    const promises = paths.map(async (name) => ({ name, content: await fs.readFile(name, { encoding: "utf-8" }) }))
    const files = await Promise.all(promises)

    return files.map(({ name, content }) => ({ params: { rule: path.basename(name, ".md") }, content }))
  },
})

export default routes
