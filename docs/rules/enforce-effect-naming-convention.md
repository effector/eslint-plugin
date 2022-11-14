# effector/enforce-effect-naming-convention

Enforcing naming conventions helps keep the codebase consistent, and reduces overhead when thinking about how to name a variable with effect. Your effect should be distinguished by a suffix `Fx`. For example, `fetchUserInfoFx` is an effect, `fetchUserInfo` is not.

```ts
// 👍 nice name
const fetchNameFx = createEffect();

// 👎 bad name
const fetchName = createEffect();
```
