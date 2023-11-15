const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-useless-methods");

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

ruleTester.run("effector/no-useless-methods.ts.test", rule, {
  valid: ["correct.ts", "correct-nested.ts"].map(readExampleForTheRule),

  invalid: [
    ...["incorrect-sample-clock.ts", "incorrect-sample-source.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "uselessMethod",
            type: "CallExpression",
            data: { methodName: "sample" },
          },
        ],
      })),
    ...["incorrect-guard-clock.ts", "incorrect-guard-source.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "uselessMethod",
            type: "CallExpression",
            data: { methodName: "guard" },
          },
        ],
      })),
  ],
});
