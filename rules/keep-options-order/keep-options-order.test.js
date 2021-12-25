const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");

const rule = require("./keep-options-order");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => readExample(__dirname, name);

ruleTester.run("effector/keep-options-order.test", rule, {
  valid: ["correct-sample.js", "correct-guard.js"]
    .map(readExampleForTheRule)
    .map((code) => ({ code })),

  invalid: [
    // Errors
    ...["incorrect-sample.js", "incorrect-guard.js"]
      .map(readExampleForTheRule)
      .map((code) => ({
        code,
        errors: [
          {
            messageId: "invalidOrder",
            type: "CallExpression",
          },
        ],
      })),
  ],
});
