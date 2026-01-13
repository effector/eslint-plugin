import type { EnhanceAppContext } from "vitepress"
import theme from "vitepress/theme"

import RuleTable from "./components/RuleTable.vue"

import "./style.css"

export default {
  extends: theme,
  enhanceApp: ({ app }: EnhanceAppContext) => {
    app.component("RuleTable", RuleTable)
  },
}
