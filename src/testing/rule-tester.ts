import path from "node:path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

const tsconfigRootDir = path.resolve(__dirname, "fixture")

type RuleTesterOptions = { jsx?: boolean }

export const createRuleTester = ({ jsx = false }: RuleTesterOptions = {}) =>
  new RuleTester({
    languageOptions: {
      parser,
      parserOptions: { projectService: true, tsconfigRootDir, ecmaFeatures: { jsx } },
    },
  })
