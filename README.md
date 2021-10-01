# eslint-plugin-effector

Enforcing best practices for [Effector](http://effector.dev/)

> This plugin uses TypeScript for more precise results, but JavaScript is supported too.

## Installation

First, install [ESLint](http://eslint.org):

```
$ yarn add -D eslint
```

Next, install `eslint-plugin-effector`:

```
$ yarn add -D eslint-plugin-effector
```

## Usage

Add `effector` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/recommended"]
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

## Supported Rules

- [effector/enforce-store-naming-convention](/rules/enforce-store-naming-convention/enforce-store-naming-convention.md)
- [effector/enforce-effect-naming-convention](/rules/enforce-effect-naming-convention/enforce-effect-naming-convention.md)
- [effector/no-getState](/rules/no-getState/no-getState.md)
- [effector/no-unnecessary-duplication](/rules/no-unnecessary-duplication/no-unnecessary-duplication.md)
- [effector/no-useless-methods](/rules/no-useless-methods/no-useless-methods.md)
- [effector/no-ambiguity-target](/rules/no-ambiguity-target/no-ambiguity-target.md)
- [effector/prefer-sample-over-forward-with-mapping](/rules/prefer-sample-over-forward-with-mapping/prefer-sample-over-forward-with-mapping.md)
- [effector/@typescript-no-watch](/rules/@typescript-no-watch/@typescript-no-watch.md)
