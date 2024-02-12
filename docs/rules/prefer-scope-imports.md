# effector/no-scope-imports

This rule prefers scoped namespace imports.

Works with `effector-react`, `effector-solid`by default.

```js
// from
import { useUnit, useList } from "effector-react";
```

---

```js
// to
import { useUnit, useList } from "effector-react/scope";
```

You can also provide extra packages to include.

```json
{
  "effector/prefer-scope-imports": [
    "error",
    {
      "packages": ["@effector/reflect", "@farfetched/core", "another-lib"]
    }
  ]
}
```

```js
import { stuff } from "@effector/reflect/scope";
```
