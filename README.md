# eslint-plugin-effector

Enforcing best practices for [Effector](http://effector.dev/). Documentation available at [eslint.effector.dev](https://eslint.effector.dev/).

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

### ESLint <= 8

Add `effector` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/recommended", "plugin:effector/scope"]
}
```

### ESLint 9

```mjs
import { fixupPluginRules } from "@eslint/compat";
import effector from "eslint-plugin-effector";

export default [
  {
    plugins: {
      effector: fixupPluginRules(effector),
    },
    rules: {
      ...effector.configs.recommended.rules,
      ...effector.configs.scope.rules,
    },
  },
];
```

Read more detailed docs on [eslint.effector.dev](https://eslint.effector.dev/)

## Maintenance

### Release flow

1. Bump `version` in [package.json](package.json)
2. Fill [CHANGELOG.md](CHANGELOG.md)
3. Commit changes by `git commit -m "Release X.X.X"`
4. Create git tag for release by `git tag -a vX.X.X -m "vX.X.X"`
5. Push changes to remote by `git push --follow-tags`
6. Release package to registry by `pnpm clean-publish`
7. Fill release page with changelog on GitHub
