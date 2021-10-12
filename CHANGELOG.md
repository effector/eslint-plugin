# Changelog

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
