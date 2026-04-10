---
description: Forbid creating Effector units inside React components or hooks
---

# effector/no-units-spawn-in-render

Forbids creating Effector units or calling operators inside React components or hooks.

Creating units in render leads to:
- New units created on every render, causing memory leaks
- Subscriptions and relationships being recreated unnecessarily
- Unpredictable application state

## Examples

### Invalid

```tsx
// 👎 Units created inside component will be recreated on every render
function Component() {
  const $store = createStore(0)
  const clicked = createEvent()

  sample({ clock: clicked, target: $store })

  return <button onClick={clicked}>click</button>
}

// 👎 Units inside hooks (useMemo, useEffect, useCallback) are still problematic
function Component() {
  const $store = useMemo(() => createStore(0), [])

  useEffect(() => {
    sample({ clock: clicked, target: $store })
  }, [])

  return <div>hello</div>
}

// 👎 Custom factory functions that return units are also forbidden
function createModel() {
  const $store = createStore(0)
  return { $store }
}

function Component() {
  const model = createModel()
  return <div>hello</div>
}

// 👎 Same rules apply to custom hooks
function useMyStore() {
  return useMemo(() => createStore(0), [])
}
```

### Valid

```tsx
// 👍 Units created at module level (outside components)
const $store = createStore(0)
const clicked = createEvent()

sample({ clock: clicked, target: $store })

function Component() {
  const value = useUnit($store)
  const click = useUnit(clicked)

  return <button onClick={click}>{value}</button>
}

// 👍 Units accessed via useContext are OK
const ModelContext = createContext({ $store })

function Component() {
  const { $store } = useContext(ModelContext)
  const value = useUnit($store)

  return <div>{value}</div>
}

// 👍 effector-factorio's useModel() retrieves units from context, not creating new ones
import { counterFactory } from "./model"

function Counter() {
  const { $count, inc } = counterFactory.useModel()
  const count = useUnit($count)

  return <button onClick={inc}>{count}</button>
}
```

## Rule Details

This rule detects:

1. **Direct Effector API calls**: `createStore`, `createEvent`, `createEffect`, `createDomain`, `createApi`, `restore`
2. **Effector operators**: `sample`, `guard`, `forward`, `merge`, `split`, `combine`, `attach`
3. **Custom factory functions**: Functions that return objects containing Effector units (requires TypeScript)

The rule uses TypeScript type information to detect custom factories that return Effector units.

## Configuration

### `detectCustomFactories`

Controls whether the rule detects custom factory functions (functions that return objects containing Effector units). Defaults to `true`.

**Disable custom factory detection entirely:**

```jsonc
// Only flag direct Effector API calls and operators — ignore custom factories
"effector/no-units-spawn-in-render": ["error", { "detectCustomFactories": false }]
```

**Allow specific functions (allowlist):**

```jsonc
// Detect custom factories, but skip these specific function names
"effector/no-units-spawn-in-render": ["error", {
  "detectCustomFactories": { "allowlist": ["useModel", "getViewModel"] }
}]
```

The allowlist matches against the resolved callee name — `"getModel"` will skip both `getModel()` and `obj.getModel()`.

## Known Exceptions

### `effector-factorio`

The [`effector-factorio`](https://github.com/Kelin2025/effector-factorio) library provides a `factory.useModel()` hook that retrieves pre-created units from React context (similar to `useContext`). This rule has a built-in exception for `useModel` — it will not be flagged.

Note that `factory.createModel()` **will** still be flagged if called inside a component, since it creates new unit instances.

## When Not To Use It

If you have a specific use case where creating units dynamically is intentional and properly managed (e.g., in a factory pattern with proper cleanup), you may disable this rule for that specific case.
