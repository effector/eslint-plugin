import path from "node:path"
import { ContentData, createContentLoader } from "vitepress"

const rules = path.join(process.cwd(), "src/rules")
const watch = path.relative(path.dirname(__dirname), rules)

const transform = (data: ContentData[]) => data.map((item) => ({ key: path.basename(item.url, ".html") }))
const loader = createContentLoader(path.join(watch, "*/*.md"), { transform })

export default loader
