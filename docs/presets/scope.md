# plugin:effector/scope

This preset is recommended for projects that use [Fork API](https://effector.dev/docs/api/effector/scope). You can read more about Fork API in [an article](https://dev.to/effector/the-best-part-of-effector-4c27).

<!--@include: ../shared/install.md-->

## Configuration

Add `effector` to the plugin section of your `.eslintrc` configuration file, and add `plugin:effector/scope` to the extends section.

```json
{
  "plugins": ["effector"],
  "extends": ["plugin:effector/scope"]
}
```

## Rules

<!--@include: ./__scope.md-->
