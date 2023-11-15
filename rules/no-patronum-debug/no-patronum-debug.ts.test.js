const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-patronum-debug");

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

ruleTester.run("effector/no-patronum-debug", rule, {
  valid: ["correct.ts", "correct-issue-127.ts"].map(readExampleForTheRule),
  invalid: [
    ...["incorrect-with-debug.ts"]
      .map(readExampleForTheRule)
      .map((example) => ({
        ...example,
        errors: [
          {
            messageId: "noPatronumDebug",
            type: "CallExpression",
            suggestions: [
              {
                messageId: "removePatronumDebug",
                output: `import { createStore } from "effector";
const $store = createStore({ fullname: "John Due" });
`,
              },
            ],
          },
        ],
      })),
    ...["incorrect-with-import-alias.ts"]
      .map(readExampleForTheRule)
      .map((example) => ({
        ...example,
        errors: [
          {
            messageId: "noPatronumDebug",
            type: "CallExpression",
            suggestions: [
              {
                messageId: "removePatronumDebug",
                output: `import { createEvent } from "effector";
const event = createEvent();
`,
              },
            ],
          },
        ],
      })),
    ...["incorrect-with-debug-fork.ts"]
      .map(readExampleForTheRule)
      .map((example) => ({
        ...example,
        errors: [
          {
            messageId: "noPatronumDebug",
            type: "CallExpression",
            suggestions: [
              {
                messageId: "removePatronumDebug",
                output: `import { fork, createStore } from "effector";
const $count = createStore(0);
const scopeA = fork({ values: [[$count, 42]] });
const scopeB = fork({ values: [[$count, 1337]] });
`,
              },
            ],
          },
        ],
      })),
  ],
});
