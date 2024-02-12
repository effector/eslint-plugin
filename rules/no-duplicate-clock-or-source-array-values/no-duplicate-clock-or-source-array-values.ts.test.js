const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-duplicate-clock-or-source-array-values");

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

ruleTester.run(
  "effector/no-duplicate-clock-or-source-array-values.ts.test",
  rule,
  {
    valid: ["correct-sample.ts"].map(readExampleForTheRule),

    invalid: [
      ...["incorrect-sample.ts"].map(readExampleForTheRule).map((result) => ({
        ...result,
        errors: [
          {
            messageId: "duplicatesInSource",
            type: "Identifier",
            suggestions: [
              {
                messageId: "removeDuplicate",
              },
            ],
          },
          {
            messageId: "duplicatesInClock",
            type: "MemberExpression",
            suggestions: [
              {
                messageId: "removeDuplicate",
              },
            ],
          },
        ],
      })),
      ...["incorrect-guard.ts"].map(readExampleForTheRule).map((result) => ({
        ...result,
        errors: [
          {
            messageId: "duplicatesInClock",
            type: "MemberExpression",
            suggestions: [
              {
                messageId: "removeDuplicate",
              },
            ],
          },
        ],
      })),
    ],
  }
);
