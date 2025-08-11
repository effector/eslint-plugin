const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-duplicate-clock-or-source-array-values");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx"],
      },
      tsconfigRootDir: join(__dirname, "../.."),
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run(
  "no-duplicate-clock-or-source-array-values.ts.test",
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
          },
          {
            messageId: "duplicatesInClock",
            type: "MemberExpression",
          },
        ],
      })),
      ...["incorrect-guard.ts"].map(readExampleForTheRule).map((result) => ({
        ...result,
        errors: [
          {
            messageId: "duplicatesInClock",
            type: "MemberExpression",
          },
        ],
      })),
    ],
  }
);
