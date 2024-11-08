# effector/mandatory-scope-binding

Forbids `Event` and `Effect` usage without `useUnit` in React components.
This ensures `Fork API` compatibility and allows writing isomorphic code for SSR apps.

```tsx
const increment = createEvent();

// 👍 Event usage is wrapped with `useUnit`
const GoodButton = () => {
  const incrementEvent = useUnit(increment);

  return <button onClick={incrementEvent}>+</button>;
};

// 👎 Event is not wrapped with `useUnit` - component is not suitable for isomorphic SSR app
const BadButton = () => {
  const onClick = () => {
    increment()
  }
  return <button onClick={onClick}>+</button>;
};
```
