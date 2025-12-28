import type { TSESLint } from "@typescript-eslint/utils"

import { name, version } from "../package.json"

import enforceEffectNamingConvention from "./rules/enforce-effect-naming-convention/enforce-effect-naming-convention"
import enforceGateNamingConvention from "./rules/enforce-gate-naming-convention/enforce-gate-naming-convention"
import enforceStoreNamingConvention from "./rules/enforce-store-naming-convention/enforce-store-naming-convention"
import keepOptionsOrder from "./rules/keep-options-order/keep-options-order"
import noForward from "./rules/no-forward/no-forward"
import noGetState from "./rules/no-getState/no-getState"
import noGuard from "./rules/no-guard/no-guard"
import noUselessMethods from "./rules/no-useless-methods/no-useless-methods"
import noWatch from "./rules/no-watch/no-watch"
import requirePickupInPersist from "./rules/require-pickup-in-persist/require-pickup-in-persist"
import { ruleset } from "./ruleset"

const base = {
  meta: { name, version, namespace: "effector" },
  rules: {
    "enforce-effect-naming-convention": enforceEffectNamingConvention,
    "enforce-gate-naming-convention": enforceGateNamingConvention,
    "enforce-store-naming-convention": enforceStoreNamingConvention,
    "keep-options-order": keepOptionsOrder,
    "no-forward": noForward,
    "no-getState": noGetState,
    "no-guard": noGuard,
    "no-useless-methods": noUselessMethods,
    "no-watch": noWatch,
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
