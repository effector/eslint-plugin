import path from "node:path"
import { ContentData, createContentLoader } from "vitepress"

const rules = path.join(process.cwd(), "src/rules")
const watch = path.relative(path.dirname(__dirname), rules)

type RuleEntry = { key: string; description: string }

const transform = (data: ContentData[]) =>
  data.map<RuleEntry>((item) => ({ key: path.basename(item.url, ".html"), description: item.frontmatter.description }))

const loader = createContentLoader(path.join(watch, "*/*.md"), { transform })

export default loader
