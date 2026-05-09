---
description: Enforce Fx as a suffix for any Effector Effect
---

# effector/enforce-effect-naming-convention

Enforces Effector naming conventions to reduce code reading overhead by clearly and consistently marking all `Effect`s with an `Fx` suffix across the codebase.

`Effect`s must be distinguished from other variables by an `Fx` suffix. For example, `fetchUserInfoFx` is an effect, `fetchUserInfo` is not.

## Configuration

```json
{
  "rules": {
    "effector/enforce-effect-naming-convention": "error"
  }
}
```

## Examples

```ts
// 👍 nice name
const fetchUserFx = createEffect()
const { fetchUserFx, fetchPostFx } = useContext(ApiContext)

// 👎 bad name
const fetchUser = createEffect()
const { fetchUser, fetchPost } = useContext(ApiContext)
```
