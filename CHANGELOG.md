# Changelog

## v0.12.0

- Migrate to TypeScript v5 and `@typescript-eslint/*` v6 ([PR #151](https://github.com/effector/eslint-plugin/pull/151)) by @7rulnik
- Drop support of Node.js 14 and Node.js 15 since its support is dropped by Node.js itself 2 years ago and new versions of TypeScript and `@typescript-eslint/*` don't support it as well

## v0.11.0

- Add support of Node.js 19 and Node.js 20 ([PR #146](https://github.com/effector/eslint-plugin/pull/146)) by @xarety
- Fixed edge-case of rule `enforce-store-naming-convention` ([PR #140](https://github.com/effector/eslint-plugin/pull/140)) by @raidenmiro

## v0.10.5

- Fix false-positive in `no-ambiguity-target` rule

## v0.10.4

- Fix false-positive in `enforce-store-naming-convention` rule ([PR #137](https://github.com/effector/eslint-plugin/pull/137))

## v0.10.3

- Fix unhandled rejection in `enforce-store-naming-convention` rule

## v0.10.2

- Fix unhandled exception in `no-patronum-debug` rule

## v0.10.1

- Fix false-positive in `no-patronum-debug` rule ([PR #126](https://github.com/effector/eslint-plugin/pull/126)) by @raidenmiro

## v0.10.0

- Allow using package on Node.js 15 and Node.js 17 ([PR #124](https://github.com/effector/eslint-plugin/pull/124))

## v0.9.1

- Fixed factory usage with `enforce-store-naming-convention` ([PR #122](https://github.com/effector/eslint-plugin/pull/122)) by @Lonli-Lokli

## v0.9.0

- Add new rule `no-patronum-debug` ([PR #121](https://github.com/effector/eslint-plugin/pull/121) by @raidenmiro)

## v0.8.2

- Fix false-negative in `enforce-store-naming-convention` rule ([PR #119](https://github.com/effector/eslint-plugin/pull/119) by @iposokhin)

## v0.8.1

- Fix typo in `react` preset config

## v0.8.0

- Rule `mandatory-useEvent` is renamed to `mandatory-scope-binding`
- Add new rule `prefer-useUnit`

## v0.7.6

- Fix `keep-options-order` case for operators with `greedy` option

## v0.7.5

- Fix `no-guard`/`no-forward` [suggestion bugs](https://github.com/effector/eslint-plugin/issues/87) ([PR #105](https://github.com/effector/eslint-plugin/pull/105) by @Minhir)

## v0.7.4

- Fix false-positive in `mandatory-useEvent` on effect stores

## v0.7.3

- Fix false-positive in `mandatory-useEvent`

## v0.7.2

- Handle case with two arguments in `guard` of `no-guard`

## v0.7.1

- Handle case with empty fields in `no-guard`/`no-forward`

## v0.7.0

### Rules

- Add new rule `no-guard` ([PR #88](https://github.com/effector/eslint-plugin/pull/88))
- Add new rule `mandatory-useEvent` ([PR #100](https://github.com/effector/eslint-plugin/pull/100) by @AlexandrHoroshih)
- Support Node.js 18 ([PR #101](https://github.com/effector/eslint-plugin/pull/101))

### Presets

- Add `mandatory-useEvent` to `scope` preset

## v0.6.0

- Add new rule `keep-options-order` ([PR #81](https://github.com/effector/eslint-plugin/pull/81))
- Add new rule `no-forward` ([PR #82](https://github.com/effector/eslint-plugin/pull/82))
- Fix false-positive on nested object with store in `no-duplicate-on` ([PR #86](https://github.com/effector/eslint-plugin/pull/86))
- Fix possible exception on WIP code in some IDEs in `no-duplicate-on`

## v0.5.2

- Fix error of parsing empty function in `strict-effect-handlers`

## v0.5.1

- Fix possible exceptions on non-effector code

## v0.5.0

### Rules

- Add new rule `no-duplicate-on` ([PR #76](https://github.com/effector/eslint-plugin/pull/76))
- Add new rule `strict-effect-handlers` ([PR #78](https://github.com/effector/eslint-plugin/pull/78))
- Add new rule `enforce-gate-naming-convention` ([PR #80](https://github.com/effector/eslint-plugin/pull/80))

### Presets

- Add new preset `scope` ([PR #79](https://github.com/effector/eslint-plugin/pull/79))
- Add new preset `react` ([PR #80](https://github.com/effector/eslint-plugin/pull/80))

### Fixes

- Fix incorrect suggestion in IDE in rule `enforce-store-naming-convention`

## v0.4.2

- Fix false-positive in `no-useless-methods` rule ([PR #77](https://github.com/effector/eslint-plugin/pull/77))

## v0.4.1

- Specify ESLint version in peerDependencies
- Fix false-positive in `no-unnecessary-combination` rule ([PR #64](https://github.com/effector/eslint-plugin/pull/64))

## v0.4.0

- Add new rule: `no-watch` ([PR #51](https://github.com/effector/eslint-plugin/pull/51) by @binjospookie)
- Add new rule: `no-unnecessary-combination` ([PR #43](https://github.com/effector/eslint-plugin/pull/43))
- Decrease package size in `node_modules` 42.4 kB -> 39.3 kB ([PR #54](https://github.com/effector/eslint-plugin/pull/54))
- Add links to rule docs to IDE prompts ([PR #55](https://github.com/effector/eslint-plugin/pull/55))
- Support ESLint 8 ([PR #58](https://github.com/effector/eslint-plugin/pull/58))

## v0.3.1

- Fixed false-positive in `no-ambiguity-target` with factories ([PR #50](https://github.com/effector/eslint-plugin/pull/50))

## v0.3.0

- Add new rule: `no-useless-methods` ([PR #41](https://github.com/effector/eslint-plugin/pull/41))
- Add new rule: `no-ambiguity-target` ([PR #42](https://github.com/effector/eslint-plugin/pull/42))
- Add possibility to configure store's naming convention — suffix of prefix ([PR #37](https://github.com/effector/eslint-plugin/pull/37) by @ilyaryabchinski)

## v0.2.0

- Add tests against Effector 22
- Specify supported Node.JS versions
- Add new rule: `prefer-sample-over-forward-with-mapping` ([PR #34](https://github.com/igorkamyshev/eslint-plugin-effector/pull/34))

## v0.1.4

- Exclude test-coverage report from npm-package
- Fixed SyntaxError in `no-unnecessary-duplication` suggestions ([PR #28](https://github.com/igorkamyshev/eslint-plugin-effector/pull/28))

## v0.1.3

- Fixed false-positive in `no-unnecessary-duplication` with composite `clock`/`source` ([PR #22](https://github.com/igorkamyshev/eslint-plugin-effector/pull/22))
- Fixed TypeError in `enforce-store-naming-convention` ([PR #25](https://github.com/igorkamyshev/eslint-plugin-effector/pull/25))
- Fixed false-positive in `enforce-effect-naming-convention` with `combine` ([PR #26](https://github.com/igorkamyshev/eslint-plugin-effector/pull/26))
