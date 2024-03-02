const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-duplicate-on");

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

ruleTester.run("effector/no-duplicate-on.ts.test", rule, {
  valid: [
    "correct.ts",
    "correct-with-scopes.ts",
    "correct-with-factories.ts",
    "correct-with-nesting.ts",
    "correct-with-empty-on.ts",
  ].map(readExampleForTheRule),
  invalid: ["incorrect-with-invalid-naming.ts"]
    .map(readExampleForTheRule)
    .map((example) => ({
      ...example,
      errors: [
        {
          messageId: "duplicateOn",
          type: "CallExpression",
          data: { storeName: "counterStore", unitName: "inc" },
        },
      ],
    })),
});
