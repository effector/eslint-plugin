const { RuleTester } = require("eslint");

const rule = require("./no-getState");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-getState.test", rule, {
  valid: [
    "sample({ source: $store, target: event });",
    "forward({ from: $store, to: event });",
    "guard({ clock: $store, filter: Boolean, target: event })",
    "someObject.getState();",
  ].map((code) => ({ code })),

  invalid: [
    {
      code: "$store.getState();",
      errors: [
        {
          messageId: "abusiveCall",
          type: "CallExpression",
          data: { storeName: "$store" },
        },
      ],
    },
  ],
});
