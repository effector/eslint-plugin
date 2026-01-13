import { ESLintUtils } from "@typescript-eslint/utils"

export const createRule = ESLintUtils.RuleCreator((name) => `https://eslint.effector.dev/rules/${name}`)
