const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-on");

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

ruleTester.run("effector/no-on.ts.test", rule, {
  valid: ["correct.ts"].map(readExampleForTheRule),

  invalid: [
    ...["incorrect.ts"].map(readExampleForTheRule).map((result) => ({
      ...result,
      errors: [
        {
          messageId: "noOn",
          type: "CallExpression",
        },
      ],
    })),
    ...["incorrect-chaining.ts"].map(readExampleForTheRule).map((result) => ({
      ...result,
      errors: [
        {
          messageId: "noOn",
          type: "CallExpression",
        },
        {
          messageId: "noOn",
          type: "CallExpression",
        },
        {
          messageId: "noOn",
          type: "CallExpression",
        },
      ],
    })),
  ],
});
