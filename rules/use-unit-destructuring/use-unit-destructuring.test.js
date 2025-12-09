const { RuleTester } = require("eslint");
const rule = require("./use-unit-destructuring");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

ruleTester.run("effector/use-unit-destructuring.test", rule, {
  valid: [
    // All keys were destructured
    {
      code: `
        import { useUnit } from "effector-react";
        const { value, setValue } = useUnit({
          value: $store,
          setValue: event,
        });
      `,
    },
    // All keys were destructured
    {
      code: `
        import { useUnit } from "effector-react";
        const [value, setValue] = useUnit([$store, event]);
      `,
    },
    // With one element in object-shape
    {
      code: `
        import { useUnit } from "effector-react";
        const { value } = useUnit({ value: $store });
      `,
    },
    // With one element in array-shape
    {
      code: `
        import { useUnit } from "effector-react";
        const [value] = useUnit([$store]);
      `,
    },
    // Is not useUnit - no check
    {
      code: `
        const { value } = someOtherFunction({
          value: $store,
          setValue: event,
        });
      `,
    },
  ],

  invalid: [
    // Object: not destructured
    {
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
    // Object: destructured, but key does not exist
    {
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
    // Array: implicit subscription (not all elements were destructuring)
    {
      code: `
        import { useUnit } from "effector-react";
        const [setValue] = useUnit([event, $store]);
      `,
      errors: [
        {
          messageId: "implicitSubscription",
          data: { index: 1, name: "$store" },
        },
      ],
    },
    // Array: several implicit subscriptions
    {
      code: `
        import { useUnit } from "effector-react";
        const [value] = useUnit([$store, event, $anotherStore]);
      `,
      errors: [
        {
          messageId: "implicitSubscription",
          data: { index: 1, name: "event" },
        },
        {
          messageId: "implicitSubscription",
          data: { index: 2, name: "$anotherStore" },
        },
      ],
    },
    // Object: several unused keys
    {
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
  ],
});
