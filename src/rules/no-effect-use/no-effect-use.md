---
description: Forbid .use on Effector effects
---

# effector/no-effect-use

Forbids `.use` on any [`Effect`](https://effector.dev/en/api/effector/Effect/), including `.use.getCurrent()`. `.use` sets the handler away from where the effect is created, so the declaration no longer shows what the effect does, which degrades usability and type inference. Triggering an effect before `.use` sets its handler throws `no handler used in effectFx`.

```ts
// 👎 handler is set elsewhere, the effect throws if called before `.use`
const fetchUserFx = createEffect<string, User>()
fetchUserFx.use((id) => api.getUser(id))

// 👍 handler is part of the effect declaration
const fetchUserFx = createEffect((id: string) => api.getUser(id))
```

To mock an effect in tests, replace its handler within a `Scope` via `fork`:

```ts
// 👎 replaces the handler for every scope
fetchUserFx.use(async () => mockUser)

// 👍 replaces the handler only within this scope
const scope = fork({ handlers: [[fetchUserFx, async () => mockUser]] })
```
