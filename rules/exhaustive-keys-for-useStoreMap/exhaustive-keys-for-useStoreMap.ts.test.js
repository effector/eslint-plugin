const { RuleTester } =
  require("@typescript-eslint/experimental-utils").ESLintUtils;
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./exhaustive-keys-for-useStoreMap");

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

ruleTester.run("effector/exhaustive-keys-for-useStoreMap.test", rule, {
  valid: ["correct.tsx"].map(readExampleForTheRule),

  invalid: [
    {
      ...readExampleForTheRule("incorrect-unused-keys.tsx"),
      errors: [
        {
          messageId: "unusedKeys",
          type: "CallExpression",
          data: { keys: ["idx"] },
        },
      ],
    },
    {
      ...readExampleForTheRule("incorrect-unused-key.tsx"),
      errors: [
        {
          messageId: "unusedKeys",
          type: "CallExpression",
          data: { keys: ["oth"] },
        },
      ],
    },
  ],
});
