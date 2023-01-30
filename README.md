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

## Usage (legacy: `.eslintrc*`)

Add `effector` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/recommended", "plugin:effector/scope"]
}
```

Or all configuration available:

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/all"]
}
```

## Usage (new: `eslint.config.js`)

From [`v8.21.0`](https://github.com/eslint/eslint/releases/tag/v8.21.0), eslint announced a new config system.
In the new system, `.eslintrc*` is no longer used. `eslint.config.js` would be the default config file name.
In eslint `v8`, the legacy system (`.eslintrc*`) would still be supported, while in eslint `v9`, only the new system would be supported.

And from [`v8.23.0`](https://github.com/eslint/eslint/releases/tag/v8.23.0), eslint CLI starts to look up `eslint.config.js`.
**So, if your eslint is `>=8.23.0`, you're 100% ready to use the new config system.**

You might want to check out the official blog posts,

- <https://eslint.org/blog/2022/08/new-config-system-part-1/>
- <https://eslint.org/blog/2022/08/new-config-system-part-2/>
- <https://eslint.org/blog/2022/08/new-config-system-part-3/>

and the [official docs](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new).

### Plugin

The default export of `eslint-plugin-effector` is a plugin object.

```js
const effector = require('eslint-plugin-effector');

module.exports = [
  …
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      effector,
    },
    rules: {
      // ... any rules you want
    "effector/enforce-store-naming-convention": "warn",
    "effector/enforce-effect-naming-convention": "error",
     },
    // ... others are omitted for brevity
  },
  …
];
```

### Configuring shared settings

Refer to the [official docs](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new#configuring-shared-settings).

The schema of the `settings.effector` object would be identical to that of what's already described above in the legacy config section.

### Shareable configs

There're also 6 shareable configs.

- `eslint-plugin-effector/config/all`
- `eslint-plugin-effector/config/recommended`
- `eslint-plugin-effector/config/future`
- `eslint-plugin-effector/config/patronum`
- `eslint-plugin-effector/config/react`
- `eslint-plugin-effector/config/scope`

If your eslint.config.js is ESM, include the `.js` extension (e.g. `eslint-plugin-effector/config/recommended.js`). Note that the next semver-major will require omitting the extension for these imports.

In the new config system, `plugin:` protocol(e.g. `plugin:effector/recommended`) is no longer valid.
As eslint does not automatically import the preset config (shareable config), you explicitly do it by yourself.

```js
const effectorRecommended = require('eslint-plugin-effector/config/recommended');

module.exports = [
  …
  effectorRecommended, // This is not a plugin object, but a shareable config object
  …
];
```

You can of course add/override some properties.

**Note**: Our shareable configs does not preconfigure e.g `files`.
For most of the cases, you probably want to configure some properties by yourself.

```js
const effectorRecommended = require('eslint-plugin-effector/config/recommended');

module.exports = [
  …
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    ...effectorRecommended,
  },
  …
];
```

The above example is same as the example below, as the new config system is based on chaining.

```js
const effectorRecommended = require('eslint-plugin-effector/config/recommended');
const effectorReact = require('eslint-plugin-effector/config/react');

module.exports = [
  …
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    ...effectorRecommended,
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    ...effectorReact,
  },
  …
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
