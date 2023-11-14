const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-unnecessary-combination");

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

ruleTester.run("effector/no-unnecessary-combination.ts.test", rule, {
  valid: [
    "correct.ts",
    "correct-combine-in-clock-guard.ts",
    "correct-combine-in-clock-sample.ts",
    "correct-combine-in-from-forward.ts",
  ].map(readExampleForTheRule),

  invalid: [
    ...[
      "unnecessary-merge-in-source-guard.ts",
      "unnecessary-merge-in-clock-guard.ts",
      "unnecessary-merge-in-source-sample.ts",
      "unnecessary-merge-in-clock-sample.ts",
      "unnecessary-merge-in-from-forward.ts",
    ]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "unnecessaryCombination",
            type: "CallExpression",
            data: { methodName: "merge" },
          },
        ],
      })),
    ...[
      "unnecessary-combine-in-source-guard.ts",
      "unnecessary-combine-in-source-sample.ts",
    ]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "unnecessaryCombination",
            type: "CallExpression",
            data: { methodName: "combine" },
          },
        ],
      })),
  ],
});
