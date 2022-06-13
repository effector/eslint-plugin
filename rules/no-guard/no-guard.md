# effector/no-guard

Any `guard` call could be replaced with `sample` call.

```ts
// 👎 could be replaced
guard({ clock: trigger, source: $data, filter: Boolean, target: reaction });

// 👍 makes sense
sample({ clock: trigger, source: $data, filter: Boolean, target: reaction });
```

Nice bonus: `sample` is extendable. You can add transformation by `fn`.

```ts
// 👎 could be replaced
guard({
  clock: trigger,
  source: $data.map((data) => data.length),
  filter: Boolean,
  target: reaction,
});

// 👍 makes sense
sample({
  clock: trigger,
  source: $data,
  filter: Boolean,
  fn: (data) => data.length,
  target: reaction,
});
```
