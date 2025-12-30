import path from "node:path"
import { ContentData, createContentLoader } from "vitepress"
import { ruleset } from "../../src/ruleset"

const rules = path.join(process.cwd(), "src/rules")
const watch = path.relative(path.dirname(__dirname), rules)

type RuleEntry = { key: string; description: string; category: string | undefined }

const presetMap = ruleset as Record<string, Record<string, unknown>>
const categoryOf = (name: string): keyof typeof ruleset | undefined =>
  Object.keys(ruleset).find((preset) => presetMap[preset][`effector/${name}`]) as keyof typeof ruleset

const transform = (data: ContentData[]) =>
  data.map<RuleEntry>((item) => {
    const key = path.basename(item.url, ".html")
    return { key, description: item.frontmatter.description, category: categoryOf(key) }
  })

const loader = createContentLoader(path.join(watch, "*/*.md"), { transform })

export default loader
