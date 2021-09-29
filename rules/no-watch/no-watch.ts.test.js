const { RuleTester } =
  require("@typescript-eslint/experimental-utils").ESLintUtils;
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-watch");

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

ruleTester.run("effector/no-watch.ts.test", rule, {
  valid: ["correct.ts"].map(readExampleForTheRule),

  invalid: [
    ...["incorrect-with-effect-watch.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
        ],
      })),
    ...["incorrect-with-event-watch.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
        ],
      })),
    ...["incorrect-with-store-watch.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
          {
            messageId: "abusiveCall",
            type: "CallExpression",
          },
        ],
      })),
  ],
});
