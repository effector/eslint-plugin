const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");
const rule = require("./strict-effect-handlers");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
});

ruleTester.run("effector/strict-effect-handlers.test", rule, {
  valid: ["correct-only-async.js", "correct-only-fx.js"].map(
    readExampleForTheRule
  ),

  invalid: [
    {
      ...readExampleForTheRule("incorrect-mix-async-fx.js"),
      errors: [
        {
          messageId: "mixedCallsInHandler",
          type: "CallExpression",
          data: { effectName: "finalFx" },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-mix-async-fx-in-func.js"),
      errors: [
        {
          messageId: "mixedCallsInHandler",
          type: "CallExpression",
          data: { effectName: "finalFx" },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-mix-async-fx-in-named-func.js"),
      errors: [
        {
          messageId: "mixedCallsInHandler",
          type: "CallExpression",
          data: { effectName: "finalFx" },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-mix-in-simple-function.js"),
      errors: [
        {
          messageId: "mixedCallsInFunction",
          type: "FunctionDeclaration",
          data: { functionName: "justFunc" },
        },
      ],
    },
  ],
});
