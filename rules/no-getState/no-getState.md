# effector/no-getState

`.getState` gives rise to difficult to debug imperative code and kind of race condition. Prefer declarative `sample` to pass data from store and `attach` for effects.

```ts
const $username = createStore(null);
const userLoggedIn = createEvent();

// 👍 good solution
const fetchUserCommentsFx = createEffect((name) => /* ... */);
sample({ source: $username, clock: userLoggedIn, target: fetchUserCommentsFx });

// 👎 bad solution
const fetchUserCommentsInBadWayFx = createEffect(() => {
    const name = $username.getState();

    /* ... */
});
forward({ from: userLoggedIn, to: fetchUserCommentsInBadWayFx });
```
