---
description: Forbid Event and Effect usage without useUnit in React components
---

# effector/mandatory-scope-binding

Forbids `EventCallable` and `Effect` usage without `useUnit` in React. This ensures `Fork API` compatibility for easy testing via `fork()` and running isomorphic code in SSR/SSG apps.

```tsx
const increment = createEvent()

// 👍 Event usage is wrapped with `useUnit`
const GoodButton = () => {
  const onClick = useUnit(increment)

  return <button onClick={onClick /* bound to Scope */}>+</button>
}

// 👎 Event is not wrapped with `useUnit` - component is not suitable for isomorphic SSR app
const BadButton = () => {
  return <button onClick={increment}>+</button>
}
```

This rule doesn't enforce using a `Scope` by itself – your app will run scopeless unless configured. However, when you do, `mandatory-scope-binding` rule ensures no additional work needed to ensure `Scope` is not lost.

### Custom Hooks and Components

You don't need `useUnit` everywhere – passing a unit straight to a custom `effector` aware hook or component whose signature openly declares a unit-typed parameter is fine. It is assumed the receiver takes responsibility of binding event to `Scope` via `useUnit`.

```tsx
type Props = { event: EventCallable<void> }
const PressButton = ({ event }: Props) => <button onClick={useUnit(event) /* <== bound to Scope */}>click</button>

// 👍 PressButton's `event` is typed as a Unit – just pass it in, no issue
const Page = () => <PressButton event={pressed} />
```

::: warning Receiver Type Guarantee
A receiver declared as plain `() => void` does not count – TypeScript accepts the unit structurally, but the consumer hasn't promised to bind it to `Scope`.

Either explicitly type the parameter as a Unit (`EventCallable` / `Effect`) and opt-in to provide this guarantee, or wrap with `useUnit` at the call site.
:::
