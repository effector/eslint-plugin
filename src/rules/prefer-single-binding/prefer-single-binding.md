# effector/prefer-single-binding

[Related documentation](https://effector.dev/en/api/effector-react/useunit/)

Recommends combining multiple `useUnit` calls into a single call for better performance and cleaner code.

## Rule Details

This rule detects when multiple `useUnit` hooks are called in the same component and suggests combining them into a single call.

Multiple `useUnit` calls can lead to:
- **Performance overhead**: Each `useUnit` creates separate subscriptions without batch-updates
- **Code duplication**: Repetitive hook calls make code harder to read
- **Maintenance issues**: Harder to track all units used in a component

Array, object and non-destructuring forms are all supported and can be merged together.
Mixed array and object forms collapse into the form of the **first** array/object call
(an all-non-destructuring group merges into the object form), and a non-destructuring
`const store = useUnit($store)` is treated as the binding `(store, $store)`.

### Ignored calls

The rule never reports — and never tries to combine — calls that cannot be soundly merged:

- The `@@unitShape` protocol (used by routers, queries, etc.) and any `useUnit(arg)` whose
  argument is **not** a single unit (e.g. `const products = useUnit(CartModel)` or
  `const list = useUnit([$a, $b])` without destructuring).
- Calls separated by an intervening declaration that a later unit depends on, where merging
  would move a unit above its definition (a temporal dead zone). For example, a unit obtained
  from `useContext` between two `useUnit` calls — those calls are left untouched:

  ```tsx
  const a = useUnit($a);
  const $b = useContext(MyContext); // $b is declared between the calls
  const b = useUnit($b);            // merging would hoist $b above its declaration
  ```

### No suggestion

A call is still reported as redundant, but **no** auto-merge suggestion is offered, when a
binding can't be safely converted between forms — rest elements (`[a, ...rest]`), array holes,
defaults (`{ a = 1 }`), nested/computed destructuring — or when merging would produce two
variables with the same name.

Renamed object keys are normalized to the local variable name on merge, so
`const { a: store } = useUnit({ a: $store })` is treated as `(store, $store)`.

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
  separation?: "forbid" | "allow" | "enforce";
};
```

### `separation`

**Default:** `"forbid"`

Controls how the rule handles separation of stores, events and effects into different `useUnit` calls.

| Value | Behavior |
|---|---|
| `"forbid"` | All `useUnit` calls must be combined into one (default) |
| `"allow"` | Stores, events and effects may be in separate calls, but multiple calls of the same type must be combined |
| `"enforce"` | A single `useUnit` call must not mix stores, events and effects |

Unit types are determined using TypeScript type information. The rule requires TypeScript to be configured in your project.

#### `separation: "forbid"` (default)

All `useUnit` calls in a component must be combined into a single call regardless of unit types.

Non-destructuring calls (`const store = useUnit($store)`) are merged together with the rest — this is
the most common form of accidental duplication from copy-pasting.

```tsx
// 👎 incorrect - multiple destructuring calls
const Component = () => {
  const [userName] = useUnit([$userName]);
  const [updateUser] = useUnit([updateUserEvent]);
  return null;
};

// 👎 incorrect - non-destructuring call alongside destructuring call
const Component = () => {
  const userName = useUnit($userName);
  const [updateUser] = useUnit([updateUserEvent]);
  return null;
};

// 👍 correct
const Component = () => {
  const [userName, updateUser] = useUnit([$userName, updateUserEvent]);
  return null;
};
```

#### `separation: "allow"`

Stores, events and effects may live in separate `useUnit` calls, but multiple calls of the same type must be combined. Non-destructuring calls participate in their type's group like any other call.

```tsx
// 👎 incorrect - multiple store calls
const Component = () => {
  const [userName] = useUnit([$userName]);
  const [userAge] = useUnit([$userAge]);
  const [updateUser] = useUnit([updateUserEvent]);
  return null;
};

// 👍 correct - stores combined, events separate
const Component = () => {
  const [userName, userAge] = useUnit([$userName, $userAge]);
  const [updateUser] = useUnit([updateUserEvent]);
  return null;
};
```

#### `separation: "enforce"`

A single `useUnit` call must not contain a mix of stores, events and effects. Each call must contain only one unit type. Non-destructuring calls hold a single unit, so they are never flagged under this option.

```tsx
// 👎 incorrect - mixed stores and events
const Component = () => {
  const [value, setValue] = useUnit([$store, event]);
  return null;
};

// 👍 correct - separated by type
const Component = () => {
  const [value] = useUnit([$store]);
  const [setValue] = useUnit([event]);
  return null;
};
```

Works with object form too:

```tsx
// 👎 incorrect
const Component = () => {
  const { value, setValue } = useUnit({ value: $store, setValue: event });
  return null;
};

// 👍 correct
const Component = () => {
  const { value } = useUnit({ value: $store });
  const { setValue } = useUnit({ setValue: event });
  return null;
};
```

## Import aliases

The rule correctly handles aliased imports:

```tsx
import { useUnit as useUnitEffector } from "effector-react";

// 👎 incorrect
const Component = () => {
  const [store] = useUnitEffector([$store]);
  const [event] = useUnitEffector([event]);
  return null;
};

// 👍 correct
const Component = () => {
  const [store, event] = useUnitEffector([$store, event]);
  return null;
};
```

## Configuration examples

### Strict single call (default)
```javascript
// eslint.config.js
export default {
  rules: {
    'effector/prefer-single-binding': 'warn'
  }
};
```

### Allow stores/events separation
```javascript
// eslint.config.js
export default {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      separation: 'allow'
    }]
  }
};
```

### Enforce stores/events separation
```javascript
// eslint.config.js
export default {
  rules: {
    'effector/prefer-single-binding': ['warn', {
      separation: 'enforce'
    }]
  }
};
```

## Suggestions

This rule provides **suggestions** (not auto-fixes) because merging or splitting `useUnit` calls may
change the order of subscriptions which can affect runtime behavior. Suggestions can be applied
manually via your editor or via `--fix-type suggestion` flag:

```bash
eslint --fix-type suggestion your-file.tsx
```

### Default behavior (`separation: "forbid"`)

Suggests combining all `useUnit` calls into a single one:

```tsx
// Before
const [value] = useUnit([$store]);
const [setValue] = useUnit([event]);

// After applying suggestion
const [value, setValue] = useUnit([$store, event]);
```

### `separation: "enforce"`

Suggests splitting mixed `useUnit` calls into separate calls per unit type:

```tsx
// Before
const [value, setValue] = useUnit([$store, event]);

// After applying suggestion
const [value] = useUnit([$store]);
const [setValue] = useUnit([event]);
```

### `separation: "allow"`

Suggests combining multiple calls of the same unit type:

```tsx
// Before
const [value1] = useUnit([$store1]);
const [value2] = useUnit([$store2]);
const [handler] = useUnit([event]);

// After applying suggestion
const [value1, value2] = useUnit([$store1, $store2]);
const [handler] = useUnit([event]);
```

## Real-world example

```tsx
import { createEvent, createStore } from "effector";
import { useUnit } from "effector-react";

const $userName = createStore("John");
const $userEmail = createStore("john@example.com");
const $isLoading = createStore(false);
const updateName = createEvent<string>();
const updateEmail = createEvent<string>();

// 👎 incorrect - scattered useUnit calls
const UserProfile = () => {
  const [userName] = useUnit([$userName]);
  const [userEmail] = useUnit([$userEmail]);
  const [isLoading] = useUnit([$isLoading]);
  const [handleUpdateName] = useUnit([updateName]);
  const [handleUpdateEmail] = useUnit([updateEmail]);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <input value={userName} onChange={(e) => handleUpdateName(e.target.value)} />
          <input value={userEmail} onChange={(e) => handleUpdateEmail(e.target.value)} />
        </>
      )}
    </div>
  );
};

// 👍 correct - single useUnit call (separation: "forbid")
const UserProfile = () => {
  const [userName, userEmail, isLoading, handleUpdateName, handleUpdateEmail] = useUnit([
    $userName,
    $userEmail,
    $isLoading,
    updateName,
    updateEmail,
  ]);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <input value={userName} onChange={(e) => handleUpdateName(e.target.value)} />
          <input value={userEmail} onChange={(e) => handleUpdateEmail(e.target.value)} />
        </>
      )}
    </div>
  );
};

// 👍 correct - separated by type (separation: "allow" or "enforce")
const UserProfile = () => {
  const [userName, userEmail, isLoading] = useUnit([$userName, $userEmail, $isLoading]);
  const [handleUpdateName, handleUpdateEmail] = useUnit([updateName, updateEmail]);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <input value={userName} onChange={(e) => handleUpdateName(e.target.value)} />
          <input value={userEmail} onChange={(e) => handleUpdateEmail(e.target.value)} />
        </>
      )}
    </div>
  );
};
```

## When Not To Use It

Disable the rule per-file if you need conditional `useUnit` calls for specific reasons:

```tsx
/* eslint-disable effector/prefer-single-binding */
const Component = () => {
  const [userStore] = useUnit([$userStore]);

  if (!userStore) return null;

  const [settingsStore] = useUnit([$settingsStore]);

  return null;
};
/* eslint-enable effector/prefer-single-binding */
```

Note that even in these cases, consider refactoring to a single `useUnit` call for better performance.

## References

- [useUnit API documentation](https://effector.dev/en/api/effector-react/useunit/)
- [Effector React hooks best practices](https://effector.dev/en/api/effector-react/)
