# effector/no-multiple-use-unit

[Related documentation](https://effector.dev/en/api/effector-react/useunit/)

Recommends combining multiple `useUnit` calls into a single call for better performance and cleaner code.

## Rule Details

This rule detects when multiple `useUnit` hooks are called in the same component and suggests combining them into a single call.

Multiple `useUnit` calls can lead to:
- **Performance overhead**: Each `useUnit` creates separate subscriptions without batch-updates
- **Code duplication**: Repetitive hook calls make code harder to read
- **Maintenance issues**: Harder to track all units used in a component

### Examples

```tsx
// 👎 incorrect - multiple useUnit calls
const Component = () => {
  const [store] = useUnit([$store]);
  const [event] = useUnit([$event]);
  
  return <button onClick={event}>{store}</button>;
};
```

```tsx
// 👍 correct - single useUnit call
const Component = () => {
  const [store, event] = useUnit([$store, $event]);
  
  return <button onClick={event}>{store}</button>;
};
```

## Why is this important?

### Performance

Each `useUnit` call creates its own subscription management overhead. Combining them reduces:
- Number of hook calls
- Subscription management overhead
- Re-render coordination complexity

### Code clarity

A single `useUnit` call makes it easier to:
- See all dependencies at a glance
- Understand component's reactive logic
- Maintain and refactor code

## Array shape examples

```tsx
// 👎 incorrect
const Component = () => {
  const [userName] = useUnit([$userName]);
  const [userAge] = useUnit([$userAge]);
  const [updateUser] = useUnit([updateUserEvent]);
  
  return (
    <div>
      <p>{userName}, {userAge}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  );
};
```

```tsx
// 👍 correct
const Component = () => {
  const [userName, userAge, updateUser] = useUnit([
    $userName,
    $userAge,
    updateUserEvent,
  ]);
  
  return (
    <div>
      <p>{userName}, {userAge}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  );
};
```

## Object shape examples

```tsx
// 👎 incorrect
const Component = () => {
  const { userName } = useUnit({ userName: $userName });
  const { userAge } = useUnit({ userAge: $userAge });
  const { updateUser } = useUnit({ updateUser: updateUserEvent });
  
  return (
    <div>
      <p>{userName}, {userAge}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  );
};
```

```tsx
// 👍 correct
const Component = () => {
  const { userName, userAge, updateUser } = useUnit({
    userName: $userName,
    userAge: $userAge,
    updateUser: updateUserEvent,
  });
  
  return (
    <div>
      <p>{userName}, {userAge}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  );
};
```

## Real-world example

```tsx
import React from "react";
import { createEvent, createStore } from "effector";
import { useUnit } from "effector-react";

const $userName = createStore("John");
const $userEmail = createStore("john@example.com");
const $isLoading = createStore(false);
const updateNameEvent = createEvent<string>();
const updateEmailEvent = createEvent<string>();

// 👎 incorrect - scattered useUnit calls
const UserProfile = () => {
  const [userName] = useUnit([$userName]);
  const [userEmail] = useUnit([$userEmail]);
  const [isLoading] = useUnit([$isLoading]);
  const [updateName] = useUnit([updateNameEvent]);
  const [updateEmail] = useUnit([updateEmailEvent]);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <input value={userName} onChange={(e) => updateName(e.target.value)} />
          <input value={userEmail} onChange={(e) => updateEmail(e.target.value)} />
        </>
      )}
    </div>
  );
};

// 👍 correct - single useUnit call
const UserProfile = () => {
  const [userName, userEmail, isLoading, updateName, updateEmail] = useUnit([
    $userName,
    $userEmail,
    $isLoading,
    updateNameEvent,
    updateEmailEvent,
  ]);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <input value={userName} onChange={(e) => updateName(e.target.value)} />
          <input value={userEmail} onChange={(e) => updateEmail(e.target.value)} />
        </>
      )}
    </div>
  );
};
```

## Auto-fix

This rule provides an automatic fix that combines all `useUnit` calls into a single one. When you run ESLint with the `--fix` flag, it will automatically refactor your code:

```bash
eslint --fix your-file.tsx
```

## When Not To Use It

In rare cases, you might want to keep `useUnit` calls separate for logical grouping or conditional logic. In such cases, you can disable the rule:

```tsx
/* eslint-disable effector/no-multiple-use-unit */
const Component = () => {
  const [userStore] = useUnit([$userStore]);
  
  // Some complex logic here...
  
  const [settingsStore] = useUnit([$settingsStore]);
  
  return null;
};
/* eslint-enable effector/no-multiple-use-unit */
```

However, even in these cases, consider refactoring to use a single `useUnit` call for better performance and clarity.

## Related Rules

- [effector/use-unit-destructuring](./use-unit-destructuring.md) - Ensures proper destructuring of useUnit results