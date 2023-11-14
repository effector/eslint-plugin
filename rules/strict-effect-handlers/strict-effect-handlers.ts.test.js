const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./strict-effect-handlers");

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: join(__dirname, ".."),
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("effector/strict-effect-handlers.ts.test", rule, {
  valid: ["correct.ts"].map(readExampleForTheRule),

  invalid: [
    {
      ...readExampleForTheRule("incorrect-mix-async-fx.ts"),
      errors: [
        {
          messageId: "mixedCallsInHandler",
          type: "CallExpression",
          data: { effectName: "finalFx" },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-mix-async-fx-in-func.ts"),
      errors: [
        {
          messageId: "mixedCallsInHandler",
          type: "CallExpression",
          data: { effectName: "finalFx" },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-mix-async-fx-in-named-func.ts"),
      errors: [
        {
          messageId: "mixedCallsInHandler",
          type: "CallExpression",
          data: { effectName: "finalFx" },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-mix-in-simple-function.ts"),
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
