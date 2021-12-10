const { RuleTester } = require("eslint");

const rule = require("./no-duplicate-on");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-duplicate-on.test", rule, {
  valid: [
    "$store.on(first, () => null).on(second, () => null);",
    "$store.on([first, second], () => null);",
    "$store.on(first, () => null);",
    "$store.on(firstFx, () => null).on(firstFx.doneData, () => null);",
  ].map((code) => ({ code })),

  invalid: [
    {
      code: "$store.on(first, () => null).on(first, () => null);",
      errors: [
        {
          messageId: "duplicateOn",
          type: "CallExpression",
          data: { storeName: "$store", unitName: "first" },
        },
      ],
    },
    {
      code: `
        $store.on(first, () => null);
        $store.on(first, () => null);
      `,
      errors: [
        {
          messageId: "duplicateOn",
          type: "CallExpression",
          data: { storeName: "$store", unitName: "first" },
        },
      ],
    },
    {
      code: `
        $store.on(first, () => null);
        $store.on([first, second], () => null);
      `,
      errors: [
        {
          messageId: "duplicateOn",
          type: "CallExpression",
          data: { storeName: "$store", unitName: "first" },
        },
      ],
    },
    {
      code: "$store.on(firstFx.doneData, () => null).on(firstFx.doneData, () => null);",
      errors: [
        {
          messageId: "duplicateOn",
          type: "CallExpression",
          data: { storeName: "$store", unitName: "firstFx.doneData" },
        },
      ],
    },
    {
      code: "$store.on(service.firstFx.doneData, () => null).on(service.firstFx.doneData, () => null);",
      errors: [
        {
          messageId: "duplicateOn",
          type: "CallExpression",
          data: { storeName: "$store", unitName: "service.firstFx.doneData" },
        },
      ],
    },
  ],
});
