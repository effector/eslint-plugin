# eslint-plugin-effector

Enforcing best practices for [Effector](http://effector.dev/)

> This plugin can use TypeScript for more precise results, but JavaScript is supported too.

## Installation

You'll first need to install [ESLint](http://eslint.org):

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

- [effector/enforce-store-naming-convention](/rules/enforce-store-naming-convention.md)
