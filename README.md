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

### Available presets

#### plugin:effector/recommended

This preset is recommended for most projects.

#### plugin:effector/scope

This preset is recommended for projects that use [Fork API](https://effector.dev/docs/api/effector/scope). You can read more about Fork API in [an article](https://dev.to/effector/the-best-part-of-effector-4c27).

### Supported rules

- [effector/enforce-store-naming-convention](rules/enforce-store-naming-convention/enforce-store-naming-convention.md)
- [effector/enforce-effect-naming-convention](rules/enforce-effect-naming-convention/enforce-effect-naming-convention.md)
- [effector/no-getState](rules/no-getState/no-getState.md)
- [effector/no-unnecessary-duplication](rules/no-unnecessary-duplication/no-unnecessary-duplication.md)
- [effector/no-useless-methods](rules/no-useless-methods/no-useless-methods.md)
- [effector/no-ambiguity-target](rules/no-ambiguity-target/no-ambiguity-target.md)
- [effector/prefer-sample-over-forward-with-mapping](rules/prefer-sample-over-forward-with-mapping/prefer-sample-over-forward-with-mapping.md)
- [effector/no-watch](rules/no-watch/no-watch.md)
- [effector/no-unnecessary-combination](rules/no-unnecessary-combination/no-unnecessary-combination.md)
- [effector/no-duplicate-on](rules/no-duplicate-on/no-duplicate-on.md)
- [effector/strict-effect-handlers](rules/strict-effect-handlers/strict-effect-handlers.md)

## Maintenance

### Release flow

1. Bump `version` in [package.json](package.json)
2. Fill [CHANGELOG.md](CHANGELOG.md)
3. Commit changes by `git commin -m "Release X.X.X"`
4. Create git tag for release by `git tag -a vX.X.X -m "vX.X.X"`
5. Push changes to remote by `git push --follow-tags`
6. Release package to registry by `yarn clean-publish`
7. Fill release page with changelog on GitHub
