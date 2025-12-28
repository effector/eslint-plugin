import type { TSESLint } from "@typescript-eslint/utils"

import { name, version } from "../package.json"

import noForward from "./rules/no-forward/no-forward"
import noGetState from "./rules/no-getState/no-getState"
import noGuard from "./rules/no-guard/no-guard"
import noWatch from "./rules/no-watch/no-watch"
import requirePickupInPersist from "./rules/require-pickup-in-persist/require-pickup-in-persist"
import { ruleset } from "./ruleset"

const base = {
  meta: { name, version, namespace: "effector" },
  rules: {
    "no-getState": noGetState,
    "no-watch": noWatch,
    "no-guard": noGuard,
    "no-forward": noForward,
    "require-pickup-in-persist": requirePickupInPersist,
  },
}

const configs = {
  recommended: { plugins: { effector: base as TSESLint.FlatConfig.Plugin }, rules: ruleset.recommended },
  scope: { plugins: { effector: base as TSESLint.FlatConfig.Plugin }, rules: ruleset.scope },
  react: { plugins: { effector: base as TSESLint.FlatConfig.Plugin }, rules: ruleset.react },
}

const plugin = base as typeof base & { configs: typeof configs }

plugin.configs = configs

export default plugin
