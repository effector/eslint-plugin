import type { TSESLint } from "@typescript-eslint/utils"

const recommended = {
  // "effector/enforce-effect-naming-convention": "error",
  // "effector/enforce-store-naming-convention": "error",
  // "effector/keep-options-order": "warn",
  // "effector/no-ambiguity-target": "warn",
  // "effector/no-duplicate-on": "error",
  "effector/no-forward": "error",
  "effector/no-getState": "error",
  "effector/no-guard": "error",
  // "effector/no-patronum-debug": "warn",
  // "effector/no-unnecessary-combination": "warn",
  // "effector/no-unnecessary-duplication": "warn",
  // "effector/no-useless-methods": "error",
  "effector/no-watch": "warn",
} satisfies TSESLint.Linter.RulesRecord

const scope = {
  "effector/require-pickup-in-persist": "error",
  // "effector/strict-effect-handlers": "error",
} satisfies TSESLint.Linter.RulesRecord

const react = {
  // "effector/enforce-gate-naming-convention": "error",
  // "effector/mandatory-scope-binding": "error",
  // "effector/prefer-useUnit": "warn",
} satisfies TSESLint.Linter.RulesRecord

export const ruleset = { recommended, scope, react }
