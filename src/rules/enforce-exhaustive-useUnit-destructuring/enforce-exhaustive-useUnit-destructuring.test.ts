import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { tsx } from "@/shared/tag"

import rule from "./enforce-exhaustive-useUnit-destructuring"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.tsx"], defaultProject: "tsconfig.fixture.json" },
      ecmaFeatures: { jsx: true },
    },
  },
})

ruleTester.run("enforce-exhaustive-useUnit-destructuring", rule, {
  valid: [
    {
      name: "object: all keys were destructured",
      code: tsx`
        import { useUnit } from "effector-react"
        const { value, setValue } = useUnit({
          value: $store,
          setValue: event,
        })
      `,
    },
    {
      name: "array: all keys were destructured",
      code: tsx`
        import { useUnit } from "effector-react"
        const [value, setValue] = useUnit([$store, event])
      `,
    },
    {
      name: "object: with one element",
      code: tsx`
        import { useUnit } from "effector-react"
        const { value } = useUnit({ value: $store })
      `,
    },
    {
      name: "array: with one element",
      code: tsx`
        import { useUnit } from "effector-react"
        const [value] = useUnit([$store])
      `,
    },
    {
      name: "nocheck: is not useUnit",
      code: tsx`
        const { value } = someOtherFunction({
          value: $store,
          setValue: event,
        })
      `,
    },
    {
      name: "alias: all keys destructured",
      code: tsx`
        import { useUnit as useEffectorUnit } from "effector-react"
        const { value, setValue } = useEffectorUnit({
          value: $store,
          setValue: event,
        })
      `,
    },
    {
      name: "array: all elements destructured with no holes",
      code: tsx`
        import { useUnit } from "effector-react"
        const [a, b, c] = useUnit([$a, $b, $c])
      `,
    },
  ],

  invalid: [
    {
      name: "object: key is passed but not destructured",
      code: tsx`
        import { useUnit } from "effector-react"
        const { value } = useUnit({
          value: $store,
          setValue: event,
        })
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "setValue" },
          line: 2,
          column: 27,
          endLine: 5,
          endColumn: 2,
        },
      ],
    },
    {
      name: "object: key is destructured but does not exist in passed object",
      code: tsx`
        import { useUnit } from "effector-react"
        const { value, setValue, extra } = useUnit({
          value: $store,
          setValue: event,
        })
      `,
      errors: [
        {
          messageId: "missingKey",
          data: { name: "extra" },
        },
      ],
    },
    {
      name: "array: implicit subscription when not all elements are destructured",
      code: tsx`
        import { useUnit } from "effector-react"
        const [setValue] = useUnit([event, $store])
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "$store" },
          line: 2,
          column: 28,
          endLine: 2,
          endColumn: 43,
        },
      ],
    },
    {
      name: "array: several implicit subscriptions",
      code: tsx`
        import { useUnit } from "effector-react"
        const [value] = useUnit([$store, event, $anotherStore])
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "event" },
        },
        {
          messageId: "unusedKey",
          data: { name: "$anotherStore" },
        },
      ],
    },
    {
      name: "object: several keys are passed but not destructured",
      code: tsx`
        import { useUnit } from "effector-react"
        const { value } = useUnit({
          value: $store,
          setValue: event,
          reset: resetEvent,
        })
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "setValue" },
        },
        {
          messageId: "unusedKey",
          data: { name: "reset" },
        },
      ],
    },
    {
      name: "object: JSX component: key is passed but not destructured",
      code: tsx`
        import React, { Fragment } from "react"
        import { useUnit } from "effector-react"

        const ObjectShapeComponent = () => {
          const { value } = useUnit({
            value: $store,
            setValue: event,
          })
          return <Fragment>{value}</Fragment>
        }
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "setValue" },
        },
      ],
    },
    {
      name: "alias: key is passed but not destructured",
      code: tsx`
        import { useUnit as useEffectorUnit } from "effector-react"
        const { value } = useEffectorUnit({
          value: $store,
          setValue: event,
        })
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "setValue" },
        },
      ],
    },
    {
      name: "array: implicit subscription on skipped hole in pattern",
      code: tsx`
        import { useUnit } from "effector-react"
        const [a, , c] = useUnit([$a, $b, $c])
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "$b" },
        },
      ],
    },
    {
      name: "object: string literal key is passed but not destructured",
      code: tsx`
        import { useUnit } from "effector-react"
        const { value } = useUnit({
          value: $store,
          setValue: event,
        })
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { name: "setValue" },
        },
      ],
    },
  ],
})
