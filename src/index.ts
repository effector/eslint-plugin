import type { ESLint, Linter } from "eslint"

import { name, version } from "../package.json"

import enforceEffectNamingConvention from "./rules/enforce-effect-naming-convention/enforce-effect-naming-convention"
import enforceGateNamingConvention from "./rules/enforce-gate-naming-convention/enforce-gate-naming-convention"
import enforceStoreNamingConvention from "./rules/enforce-store-naming-convention/enforce-store-naming-convention"
import keepOptionsOrder from "./rules/keep-options-order/keep-options-order"
import mandatoryScopeBinding from "./rules/mandatory-scope-binding/mandatory-scope-binding"
import noAmbiguityTarget from "./rules/no-ambiguity-target/no-ambiguity-target"
import noDomainUnitCreators from "./rules/no-domain-unit-creators/no-domain-unit-creators"
import noDuplicateClockOrSourceArrayValues from "./rules/no-duplicate-clock-or-source-array-values/no-duplicate-clock-or-source-array-values"
import noDuplicateOn from "./rules/no-duplicate-on/no-duplicate-on"
import noForward from "./rules/no-forward/no-forward"
import noGetState from "./rules/no-getState/no-getState"
import noGuard from "./rules/no-guard/no-guard"
import noPatronumDebug from "./rules/no-patronum-debug/no-patronum-debug"
import noUnnecessaryCombination from "./rules/no-unnecessary-combination/no-unnecessary-combination"
import noUnnecessaryDuplication from "./rules/no-unnecessary-duplication/no-unnecessary-duplication"
import noUselessMethods from "./rules/no-useless-methods/no-useless-methods"
import noWatch from "./rules/no-watch/no-watch"
import preferUseUnit from "./rules/prefer-useUnit/prefer-useUnit"
import requirePickupInPersist from "./rules/require-pickup-in-persist/require-pickup-in-persist"
import strictEffectHandlers from "./rules/strict-effect-handlers/strict-effect-handlers"
import { ruleset } from "./ruleset"

const base = {
  meta: { name, version, namespace: "effector" },
  rules: {
    "enforce-effect-naming-convention": enforceEffectNamingConvention,
    "enforce-gate-naming-convention": enforceGateNamingConvention,
    "enforce-store-naming-convention": enforceStoreNamingConvention,
    "keep-options-order": keepOptionsOrder,
    "mandatory-scope-binding": mandatoryScopeBinding,
    "no-ambiguity-target": noAmbiguityTarget,
    "no-domain-unit-creators": noDomainUnitCreators,
    "no-duplicate-clock-or-source-array-values": noDuplicateClockOrSourceArrayValues,
    "no-duplicate-on": noDuplicateOn,
    "no-forward": noForward,
    "no-getState": noGetState,
    "no-guard": noGuard,
    "no-patronum-debug": noPatronumDebug,
    "no-unnecessary-combination": noUnnecessaryCombination,
    "no-unnecessary-duplication": noUnnecessaryDuplication,
    "no-useless-methods": noUselessMethods,
    "no-watch": noWatch,
    "prefer-useUnit": preferUseUnit,
    "require-pickup-in-persist": requirePickupInPersist,
    "strict-effect-handlers": strictEffectHandlers,
  },
}

const legacyConfigs = {
  recommended: { rules: ruleset.recommended },
  scope: { rules: ruleset.scope },
  react: { rules: ruleset.react },
  future: { rules: ruleset.future },
  patronum: { rules: ruleset.patronum },
}

const self = base as unknown as ESLint.Plugin

const flatConfigs: Record<keyof typeof ruleset, Linter.Config> = {
  recommended: { plugins: { effector: self }, rules: ruleset.recommended },
  scope: { plugins: { effector: self }, rules: ruleset.scope },
  react: { plugins: { effector: self }, rules: ruleset.react },
  future: { plugins: { effector: self }, rules: ruleset.future },
  patronum: { plugins: { effector: self }, rules: ruleset.patronum },
}

const plugin = base as {
  flatConfigs: typeof flatConfigs

  /** @deprecated Migrate to modern ESLint v9+ Flat Config format */
  configs: typeof legacyConfigs
} & typeof base

plugin.configs = legacyConfigs
plugin.flatConfigs = flatConfigs

export default plugin
