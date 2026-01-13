---
description: Disallow using Domain methods to create units
---

# effector/no-domain-unit-creators

Disallow calling domain methods like `.createEvent()`, `.createStore()`, and `.createEffect()` to create units. These method-based APIs are difficult to parse with AST-aware plugins and tools, leading to compatibility issues.

Instead, prefer to use standard factory functions from `effector` package and provide the `domain` parameter. This is compatible with AST-based tools and is generally more consistent with other Effector API.

```ts
import { createDomain } from "effector"

const domain = createDomain()

// 👎 hard to parse & work with
const event = domain.createEvent() // [!code --]
const $store = domain.createStore("value") // [!code --]
const effectFx = domain.createEffect() // [!code --]

// 👍 clean and consistent
const event = createEvent({ domain }) // [!code ++]
const $store = createStore("value", { domain }) // [!code ++]
const effectFx = createEffect({ domain }) // [!code ++]
```
