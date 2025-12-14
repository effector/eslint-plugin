# effector/prefer-single-binding

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

## Options

This rule accepts an options object with the following properties:

```typescript
type Options = {
  allowSeparateStoresAndEvents?: boolean;
  enforceStoresAndEventsSeparation?: boolean;
};
```

### `allowSeparateStoresAndEvents`

**Default:** `false`

When set to `true`, allows separate `useUnit` calls for stores and events, but still enforces combining multiple calls within each group.

The rule uses heuristics to determine whether a unit is a store or an event:
- **Stores**: Names starting with `$`, or matching patterns like `is*`, `has*`, `*Store`, `*State`, `data`, `value`, `items`
- **Events**: Names ending with `*Event`, `*Changed`, `*Triggered`, `*Clicked`, `*Pressed`, or starting with `on*`, `handle*`, `set*`, `update*`, `submit*`

#### Configuration

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      allowSeparateStoresAndEvents: true
    }]
  }
};
```

#### Examples with `allowSeparateStoresAndEvents: true`

```tsx
// 👍 correct - separate groups for stores and events
const Component = () => {
  const [userName, userAge] = useUnit([$userName, $userAge]);
  const [updateUser, deleteUser] = useUnit([updateUserEvent, deleteUserEvent]);
  
  return (
    <div>
      <p>{userName}, {userAge}</p>
      <button onClick={updateUser}>Update</button>
      <button onClick={deleteUser}>Delete</button>
    </div>
  );
};
```

```tsx
// 👎 incorrect - multiple stores in separate calls
const Component = () => {
  const [userName] = useUnit([$userName]);
  const [userAge] = useUnit([$userAge]);
  const [updateUser, deleteUser] = useUnit([updateUserEvent, deleteUserEvent]);
  
  return <div>...</div>;
};
```

```tsx
// 👎 incorrect - multiple events in separate calls
const Component = () => {
  const [userName, userAge] = useUnit([$userName, $userAge]);
  const [updateUser] = useUnit([updateUserEvent]);
  const [deleteUser] = useUnit([deleteUserEvent]);
  
  return <div>...</div>;
};
```

### `enforceStoresAndEventsSeparation`

**Default:** `false`

When set to `true`, enforces separation of stores and events into different `useUnit` calls. This option detects when a single `useUnit` call contains both stores and events and suggests splitting them.

This is useful when you want to maintain clear logical separation between state (stores) and actions (events) in your components.

#### Configuration

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      enforceStoresAndEventsSeparation: true
    }]
  }
};
```

#### Examples with `enforceStoresAndEventsSeparation: true`

```tsx
// 👎 incorrect - mixed stores and events
const Component = () => {
  const [value, setValue] = useUnit([$store, event]);
  
  return <input value={value} onChange={setValue} />;
};
```

```tsx
// 👍 correct - separated stores and events
const Component = () => {
  const [value] = useUnit([$store]);
  const [setValue] = useUnit([event]);
  
  return <input value={value} onChange={setValue} />;
};
```

```tsx
// 👎 incorrect - mixed in object form
const Component = () => {
  const { value, setValue } = useUnit({ 
    value: $store, 
    setValue: event 
  });
  
  return <input value={value} onChange={setValue} />;
};
```

```tsx
// 👍 correct - separated in object form
const Component = () => {
  const { value } = useUnit({ value: $store });
  const { setValue } = useUnit({ setValue: event });
  
  return <input value={value} onChange={setValue} />;
};
```

### Combining both options

You can use both options together to enforce a specific code style:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      allowSeparateStoresAndEvents: true,
      enforceStoresAndEventsSeparation: true
    }]
  }
};
```

With both options enabled:
- Mixed `useUnit` calls will be split into separate calls for stores and events
- Multiple calls of the same type (stores or events) will be combined

```tsx
// 👎 incorrect - mixed types
const Component = () => {
  const [value1, setValue1, value2, setValue2] = useUnit([
    $store1, 
    event1, 
    $store2, 
    event2
  ]);
  
  return null;
};
```

```tsx
// 👍 correct - separated and combined by type
const Component = () => {
  const [value1, value2] = useUnit([$store1, $store2]);
  const [setValue1, setValue2] = useUnit([event1, event2]);
  
  return null;
};
```

#### Working with models

This combination is especially useful when working with Effector models:

```tsx
// 👎 incorrect - mixed stores and events
const Component = () => {
  const [isFormSent, submit, reset, isLoading] = useUnit([
    FormModel.$isFormSent,
    FormModel.submitForm,
    FormModel.resetForm,
    FormModel.$isLoading,
  ]);
  
  return (
    <form onSubmit={submit}>
      {isLoading && <Spinner />}
      <button type="submit" disabled={isFormSent}>Submit</button>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  );
};
```

```tsx
// 👍 correct - stores and events are separated by logical groups
const Component = () => {
  // All stores from the model
  const [isFormSent, isLoading] = useUnit([
    FormModel.$isFormSent,
    FormModel.$isLoading,
  ]);
  
  // All events from the model
  const [submit, reset] = useUnit([
    FormModel.submitForm,
    FormModel.resetForm,
  ]);
  
  return (
    <form onSubmit={submit}>
      {isLoading && <Spinner />}
      <button type="submit" disabled={isFormSent}>Submit</button>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  );
};
```

## Why is this important?

### Performance

Each `useUnit` call creates its own subscription management overhead. Combining them reduces:
- Number of hook calls
- Subscription management overhead
- Re-render coordination complexity

### Code clarity

A single `useUnit` call (or logically separated calls) makes it easier to:
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
// 👍 correct - combined (default behavior)
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

```tsx
// 👍 also correct - separated (with enforceStoresAndEventsSeparation: true)
const Component = () => {
  const [userName, userAge] = useUnit([$userName, $userAge]);
  const [updateUser] = useUnit([updateUserEvent]);
  
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
// 👍 correct - combined (default behavior)
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

```tsx
// 👍 also correct - separated (with enforceStoresAndEventsSeparation: true)
const Component = () => {
  const { userName, userAge } = useUnit({
    userName: $userName,
    userAge: $userAge,
  });
  const { updateUser } = useUnit({ updateUser: updateUserEvent });
  
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

// 👎 incorrect - scattered useUnit calls (default behavior)
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

// 👍 correct - single useUnit call (default behavior)
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

// 👍 also correct - separated stores and events 
// (with allowSeparateStoresAndEvents: true or enforceStoresAndEventsSeparation: true)
const UserProfile = () => {
  const [userName, userEmail, isLoading] = useUnit([
    $userName,
    $userEmail,
    $isLoading,
  ]);
  
  const [updateName, updateEmail] = useUnit([
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

This rule provides automatic fixes based on the configuration:

### Default behavior
When you run ESLint with the `--fix` flag, it will combine all `useUnit` calls into a single one:

```bash
eslint --fix your-file.tsx
```

### With `enforceStoresAndEventsSeparation: true`
The auto-fix will split mixed `useUnit` calls into separate calls for stores and events:

```tsx
// Before
const [value, setValue] = useUnit([$store, event]);

// After auto-fix
const [value] = useUnit([$store]);
const [setValue] = useUnit([event]);
```

### With both options enabled
The auto-fix will both split mixed calls and combine multiple calls of the same type:

```tsx
// Before
const [value1] = useUnit([$store1]);
const [value2, handler] = useUnit([$store2, event1]);
const [handler2] = useUnit([event2]);

// After auto-fix
const [value1, value2] = useUnit([$store1, $store2]);
const [handler, handler2] = useUnit([event1, event2]);
```

## Configuration examples

### Strict single call (default)
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': 'warn'
  }
};
```

### Allow stores/events separation
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      allowSeparateStoresAndEvents: true
    }]
  }
};
```

### Enforce stores/events separation
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      enforceStoresAndEventsSeparation: true
    }]
  }
};
```

### Enforce separation and combine duplicates
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      allowSeparateStoresAndEvents: true,
      enforceStoresAndEventsSeparation: true
    }]
  }
};
```

## When Not To Use It

In rare cases, you might want to keep `useUnit` calls separate for specific reasons:

```tsx
/* eslint-disable effector/prefer-single-binding */
const Component = () => {
  const [userStore] = useUnit([$userStore]);
  
  // Some complex logic that depends on userStore...
  if (!userStore) return null;
  
  const [settingsStore] = useUnit([$settingsStore]);
  
  return null;
};
/* eslint-enable effector/prefer-single-binding */
```

However, even in these cases, consider refactoring to use a single `useUnit` call (or enabling the appropriate options) for better performance and clarity.

## References

- [useUnit API documentation](https://effector.dev/en/api/effector-react/useunit/)
- [Effector React hooks best practices](https://effector.dev/en/api/effector-react/)
```
