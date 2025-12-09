# effector/use-unit-destructuring

[Related documentation](https://effector.dev/en/api/effector-react/useunit/)

Ensures that all units passed to useUnit are properly destructured to avoid unused subscriptions and implicit re-renders.

## Rule Details
This rule enforces that:
- All properties passed in an object to useUnit must be destructured to prevent implicit subscriptions;
- All elements passed in an array to useUnit must be destructured to prevent implicit subscriptions also.

### Object shape
When using useUnit with an object, you must destructure all keys that you pass. Otherwise, unused units will still create subscriptions and cause unnecessary re-renders.
TypeScript

```ts
// 👍 correct - all properties are destructured
const { value, setValue } = useUnit({
  value: $store,
  setValue: event,
});
```

```ts
// 👎 incorrect - setValue is not destructured but still creates subscription
const { value } = useUnit({
  value: $store,
  setValue: event, // unused but subscribed!
});
```

```ts
// 👎 incorrect - extra is destructured but not passed
const { 
    value, 
    setValue, 
    extra // extra is missing - will be undefined
} = useUnit({
  value: $store,
  setValue: event,
});
```

### Array shape
When using useUnit with an array, you must destructure all elements. Elements that are not destructured will still create subscriptions, leading to implicit re-renders.
TypeScript

```ts
// 👍 correct - all elements are destructured
const [value, setValue] = useUnit([$store, event]);
```

```ts
// 👎 incorrect - $store is not destructured but creates implicit subscription
const [setValue] = useUnit([event, $store]);
// Component will re-render when $store changes, even though you don't use it!
```

```ts
// 👎 incorrect - event and $anotherStore cause implicit subscriptions
const [value] = useUnit([$store, event, $anotherStore]);
// Component re-renders on $store, event, and $anotherStore changes
```

## Why is this important?
Implicit subscriptions can lead to:
- Performance issues: unnecessary re-renders when unused stores update
- Hard-to-debug behavior: component re-renders for unclear reasons
- Memory leaks: subscriptions that are never cleaned up properly

## Examples

### Real-world example

```tsx
import React, { Fragment } from "react";
import { createEvent, createStore } from "effector";
import { useUnit } from "effector-react";

const $store = createStore("Hello World!");
const event = createEvent();

// 👎 incorrect
const BadComponent = () => {
    const { value } = useUnit({
        value: $store,
        setValue: event, // ❌ not used but subscribed!
    });
    
    return <Fragment>{value}</Fragment>;
};

// 👍 correct
const GoodComponent = () => {
    const { value, setValue } = useUnit({
        value: $store, 
        setValue: event,
    });

    return <button onClick={() => setValue("New value")}>{value}</button>;
};
```

```tsx
import React, { Fragment } from "react";
import { createEvent, createStore } from "effector";
import { useUnit } from "effector-react";

const $store = createStore("Hello World!");
const event = createEvent();

// 👎 incorrect - implicit subscription to $store
const BadComponent = () => {
    const [setValue] = useUnit([event, $store]); // ❌ $store not used but subscribed!
    
    return <button onClick={() => setValue("New value")}>Click</button>;
};

// 👍 correct - explicit destructuring
const GoodComponent = () => {
    const [value, setValue] = useUnit([$store, event]);
    
    return <button onClick={() => setValue("New value")}>{value}</button>;
};

// 👍 also correct - only pass what you need
const AlsoGoodComponent = () => {
    const [setValue] = useUnit([event]); // ✅ no implicit subscriptions
    
    return <button onClick={() => setValue("New value")}>Click</button>;
};
```

### When Not To Use It
If you intentionally want to subscribe to a store without using its value (rare case), you can disable this rule for that line:

```tsx
// eslint-disable-next-line effector/use-unit-destructuring
const { value } = useUnit({
    value: $store,
    trigger: $triggerStore, // intentionally subscribing without using
});
```

However, in most cases, you should refactor your code to avoid implicit subscriptions.