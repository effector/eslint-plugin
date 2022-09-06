# eslint-plugin-effector

Enforcing best practices for [Effector](http://effector.dev/)

> This plugin uses TypeScript for more precise results, but JavaScript is supported too.

## Installation

Install [ESLint](http://eslint.org) and `eslint-plugin-effector`:

### pnpm

```
$ pnpm install --dev eslint
$ pnpm install --dev eslint-plugin-effector
```

### yarn

```
$ yarn add --dev eslint
$ yarn add --dev eslint-plugin-effector
```

### npm

```
$ npm install --dev eslint
$ npm install --dev eslint-plugin-effector
```

## Usage

Add `effector` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/recommended", "plugin:effector/scope"]
}
```

To configure individual rules:

```json
{
  "rules": {
    "effector/enforce-store-naming-convention": "off"
  }
}
```

### Available rules by preset

#### plugin:effector/recommended

This preset is recommended for most projects.

- [effector/enforce-store-naming-convention](rules/enforce-store-naming-convention/enforce-store-naming-convention.md)
- [effector/enforce-effect-naming-convention](rules/enforce-effect-naming-convention/enforce-effect-naming-convention.md)
- [effector/no-getState](rules/no-getState/no-getState.md)
- [effector/no-useless-methods](rules/no-useless-methods/no-useless-methods.md)
- [effector/no-unnecessary-duplication](rules/no-unnecessary-duplication/no-unnecessary-duplication.md)
- [effector/prefer-sample-over-forward-with-mapping](rules/prefer-sample-over-forward-with-mapping/prefer-sample-over-forward-with-mapping.md)
- [effector/no-ambiguity-target](rules/no-ambiguity-target/no-ambiguity-target.md)
- [effector/no-watch](rules/no-watch/no-watch.md)
- [effector/no-unnecessary-combination](rules/no-unnecessary-combination/no-unnecessary-combination.md)
- [effector/no-duplicate-on](rules/no-duplicate-on/no-duplicate-on.md)
- [effector/keep-options-order](rules/keep-options-order/keep-options-order.md)

#### plugin:effector/scope

This preset is recommended for projects that use [Fork API](https://effector.dev/docs/api/effector/scope). You can read more about Fork API in [an article](https://dev.to/effector/the-best-part-of-effector-4c27).

- [effector/strict-effect-handlers](rules/strict-effect-handlers/strict-effect-handlers.md)

#### plugin:effector/react

This preset is recommended for projects that use [React](https://reactjs.org) with Effector.

- [effector/enforce-gate-naming-convention](rules/enforce-gate-naming-convention/enforce-gate-naming-convention.md)
- [effector/mandatory-scope-binding](rules/mandatory-scope-binding/mandatory-scope-binding.md)
- [effector/prefer-useUnit](rules/prefer-useUnit/prefer-useUnit.md)

#### plugin:effector/future

This preset contains rules, which enforce _future-effector_ code-style.

- [effector/no-forward](rules/no-forward/no-forward.md)
- [effector/no-guard](rules/no-guard/no-guard.md)

#### plugin:effector/patronum

This preset is recommended for projects that use [Patronum](https://patronum.effector.dev/).

- [effector/no-patronum-debug](rules/no-patronum-debug/no-patronum-debug.md)

## Maintenance

### Release flow

1. Bump `version` in [package.json](package.json)
2. Fill [CHANGELOG.md](CHANGELOG.md)
3. Commit changes by `git commit -m "Release X.X.X"`
4. Create git tag for release by `git tag -a vX.X.X -m "vX.X.X"`
5. Push changes to remote by `git push --follow-tags`
6. Release package to registry by `pnpm clean-publish`
7. Fill release page with changelog on GitHub
