const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-getState");

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("no-getState.ts.test", rule, {
  valid: ["correct.ts"].map(readExampleForTheRule),

  invalid: [
    "incorrect-with-convential-name.ts",
    "incorrect-with-random-name.ts",
    "incorrect-with-nested-object.ts",
  ]
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
});
