# effector/enforce-store-naming-convention

Enforcing naming conventions helps keep the codebase consistent, and reduces overhead when thinking about how to name a variable with store. Depending on the configuration your stores should be distinguished by a prefix or a postfix $. Enforces prefix convention by default.

## Prefix convention
When configured as:
```js
module.exports = {
  rules: {
    "effector/enforce-store-naming-convention": "error",
  },
};
```
Prefix convention will be enforced:
```ts
// 👍 nice name
const $name = createStore(null);

// 👎 bad name
const name = createStore(null);
```
## Postfix convention

When configured as:
```js
module.exports = {
  rules: {
    "effector/enforce-store-naming-convention": "error",
  },
  settings: {
    effector: {
      storeNameConvention: "postfix"
    }
  }
};
```
Postfix convention will be enforced:
```ts
// 👍 nice name
const name$ = createStore(null);

// 👎 bad name
const name = createStrore(null);
```
