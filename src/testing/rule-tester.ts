import path from "node:path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

const tsgo = process.env.TYPESCRIPT_ESLINT_EXPERIMENTAL_BACKEND === "tsgo"

const tsconfigRootDir = path.resolve(__dirname, "fixture")
const projectService = tsgo ? { EXPERIMENTAL_backend: "tsgo" as const } : true

type RuleTesterOptions = { jsx?: boolean }

export const createRuleTester = ({ jsx = false }: RuleTesterOptions = {}) =>
  new RuleTester({
    languageOptions: {
      parser,
      parserOptions: { projectService, tsconfigRootDir, ecmaFeatures: { jsx } },
    },
  })
