# effector/mandatory-useEvent

Forbids `Event` and `Effect` usage without `useEvent` in React components.
This ensures `Fork API` compatibility and allows to write isomorphic code for SSR apps.

```tsx
const increment = createEvent();

// 👍 Event usage is wrapped with `useEvent`
const GoodButton = () => {
  const incrementEvent = useEvent(increment);

  return <button onClick={incrementEvent}>+</button>;
};

// 👎 Event is not wrapped with `useEvent` - component is not suitable for isomorphic SSR app
const BadButton = () => {
  return <button onClick={increment}>+</button>;
};
```
