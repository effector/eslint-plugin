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
    // "$store.on(first, () => null).on(second, () => null);",
    // "$store.on(first, () => null);",
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
  ],
});
