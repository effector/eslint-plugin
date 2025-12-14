const { RuleTester } = require("eslint");
const rule = require("./prefer-single-binding");

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
    },
});

ruleTester.run("effector/prefer-single-binding.test", rule, {
    valid: [
        // Once useUnit call - OK
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store, event] = useUnit([$store, $event]);
          
          return null;
        };
      `,
        },
        // Once useUnit with object-shape - OK
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { store, event } = useUnit({ store: $store, event: $event });
          
          return null;
        };
      `,
        },
        // useUnit outside of components - dont check
        {
            code: `
        import { useUnit } from "effector-react";
        const store = useUnit([$store]);
        const event = useUnit([$event]);
      `,
        },
    ],

    invalid: [
        // Two useUnit calls with array-shape
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store] = useUnit([$store]);
          const [event] = useUnit([$event]);
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store, event] = useUnit([$store, $event]);
          
          return null;
        };
      `,
        },
        // Three useUnit with array-shape
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store] = useUnit([$store]);
          const [event] = useUnit([$event]);
          const [another] = useUnit([$another]);
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store, event, another] = useUnit([$store, $event, $another]);
          
          return null;
        };
      `,
        },
        // Two useUnit calls with object-shape
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { store } = useUnit({ store: $store });
          const { event } = useUnit({ event: $event });
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const { store, event } = useUnit({ store: $store, event: $event });
          
          return null;
        };
      `,
        },
        // Multiple useUnit calls
        {
            code: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store1, store2] = useUnit([$store1, $store2]);
          const [event1, event2] = useUnit([event1, event2]);
          
          return null;
        };
      `,
            errors: [
                {
                    messageId: "multipleUseUnit",
                },
            ],
            output: `
        import { useUnit } from "effector-react";
        const Component = () => {
          const [store1, store2, event1, event2] = useUnit([$store1, $store2, $event1, $event2]);
          
          return null;
        };
      `,
        },
    ],
});