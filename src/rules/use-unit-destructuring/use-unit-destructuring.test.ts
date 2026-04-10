import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import rule from "./use-unit-destructuring"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.tsx"], defaultProject: "tsconfig.fixture.json" },
      ecmaFeatures: { jsx: true },
    },
  },
})

ruleTester.run("use-unit-destructuring", rule, {
  valid: [
    {
      name: "All keys were destructured (object shape)",
      code: `
        import { useUnit } from "effector-react";
        const { value, setValue } = useUnit({
          value: $store,
          setValue: event,
        });
      `,
    },
    {
      name: "All keys were destructured (array shape)",
      code: `
        import { useUnit } from "effector-react";
        const [value, setValue] = useUnit([$store, event]);
      `,
    },
    {
      name: "With one element in object shape",
      code: `
        import { useUnit } from "effector-react";
        const { value } = useUnit({ value: $store });
      `,
    },
    {
      name: "With one element in array shape",
      code: `
        import { useUnit } from "effector-react";
        const [value] = useUnit([$store]);
      `,
    },
    {
      name: "Is not useUnit - no check",
      code: `
        const { value } = someOtherFunction({
          value: $store,
          setValue: event,
        });
      `,
    },
    {
      name: "useUnit aliased import - all keys destructured",
      code: `
        import { useUnit as useEffectorUnit } from "effector-react";
        const { value, setValue } = useEffectorUnit({
          value: $store,
          setValue: event,
        });
      `,
    },
    {
      name: "Array: all elements destructured with no holes",
      code: `
        import { useUnit } from "effector-react";
        const [a, b, c] = useUnit([$a, $b, $c]);
      `,
    },
  ],

  invalid: [
    {
      name: "Object: key is passed but not destructured",
      code: `
        import { useUnit } from "effector-react";
        const { value } = useUnit({
          value: $store,
          setValue: event,
        });
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "setValue" },
        },
      ],
    },
    {
      name: "Object: key is destructured but does not exist in passed object",
      code: `
        import { useUnit } from "effector-react";
        const { value, setValue, extra } = useUnit({
          value: $store,
          setValue: event,
        });
      `,
      errors: [
        {
          messageId: "missingKey",
          data: { key: "extra" },
        },
      ],
    },
    {
      name: "Array: implicit subscription when not all elements are destructured",
      code: `
        import { useUnit } from "effector-react";
        const [setValue] = useUnit([event, $store]);
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "$store" },
        },
      ],
    },
    {
      name: "Array: several implicit subscriptions",
      code: `
        import { useUnit } from "effector-react";
        const [value] = useUnit([$store, event, $anotherStore]);
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "event" },
        },
        {
          messageId: "unusedKey",
          data: { key: "$anotherStore" },
        },
      ],
    },
    {
      name: "Object: several keys are passed but not destructured",
      code: `
        import { useUnit } from "effector-react";
        const { value } = useUnit({
          value: $store,
          setValue: event,
          reset: resetEvent,
        });
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "setValue" },
        },
        {
          messageId: "unusedKey",
          data: { key: "reset" },
        },
      ],
    },
    {
      name: "JSX component with object shape: key is passed but not destructured",
      code: `
        import React, { Fragment } from "react";
        import { useUnit } from "effector-react";
        
        const ObjectShapeComponent = () => {
          const { value } = useUnit({
            value: $store,
            setValue: event,
          });
          return <Fragment>{value}</Fragment>;
        };
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "setValue" },
        },
      ],
    },
    {
      name: "useUnit aliased import: key is passed but not destructured",
      code: `
        import { useUnit as useEffectorUnit } from "effector-react";
        const { value } = useEffectorUnit({
          value: $store,
          setValue: event,
        });
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "setValue" },
        },
      ],
    },
    {
      name: "Array: implicit subscription on skipped hole in pattern",
      code: `
        import { useUnit } from "effector-react";
        const [a, , c] = useUnit([$a, $b, $c]);
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "$b" },
        },
      ],
    },
    {
      name: "Object: string literal key is passed but not destructured",
      code: `
        import { useUnit } from "effector-react";
        const { value } = useUnit({
          value: $store,
          "setValue": event,
        });
      `,
      errors: [
        {
          messageId: "unusedKey",
          data: { key: "setValue" },
        },
      ],
    },
  ],
})
