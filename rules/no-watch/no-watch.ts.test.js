const { RuleTester } = require("@typescript-eslint/rule-tester");
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
    ...[join("incorrect", "effect", "done.ts")]
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
    ...[join("incorrect", "effect", "fail.ts")]
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
    ...[join("incorrect", "effect", "finally.ts")]
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
    ...[join("incorrect", "effect", "base.ts")]
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
    ...[join("incorrect", "event.ts")]
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
    ...[join("incorrect", "guard.ts")]
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
    ...[join("incorrect", "sample.ts")]
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
    ...[join("incorrect", "store.ts")]
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
