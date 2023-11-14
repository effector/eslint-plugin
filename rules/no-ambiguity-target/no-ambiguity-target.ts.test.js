const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-ambiguity-target");

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

ruleTester.run("effector/no-ambiguity-target.ts.test", rule, {
  valid: ["correct.ts", "correct-examples-issue-49.ts"].map(
    readExampleForTheRule
  ),

  invalid: [
    ...["incorrect-sample.ts"].map(readExampleForTheRule).map((result) => ({
      ...result,
      errors: [
        {
          messageId: "ambiguityTarget",
          type: "CallExpression",
          data: { methodName: "sample" },
        },
      ],
    })),
    ...["incorrect-guard.ts", "incorrect-guard-nested.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "ambiguityTarget",
            type: "CallExpression",
            data: { methodName: "guard" },
          },
        ],
      })),
  ],
});
