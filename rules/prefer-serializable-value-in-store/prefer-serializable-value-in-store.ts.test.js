const { RuleTester } =
  require("@typescript-eslint/experimental-utils").ESLintUtils;
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./prefer-serializable-value-in-store");

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

ruleTester.run("effector/prefer-serializable-value-in-store.ts.test", rule, {
  valid: [
    "correct.ts",
    "correct-date-mapped.ts",
    "correct-date-serialize-ignore.ts",
  ].map(readExampleForTheRule),

  invalid: [
    "incorrect-date.ts",
    "incorrect-date-or-null.ts",
    "incorrect-record.ts",
    "incorrect-array.ts",
    "incorrect-array-record.ts",
  ]
    .map(readExampleForTheRule)
    .map((result) => ({
      ...result,
      errors: [
        {
          messageId: "dangerousType",
          type: "VariableDeclarator",
          data: { typeName: "Date" },
        },
      ],
    })),
});
