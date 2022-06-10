const { RuleTester } =
  require("@typescript-eslint/experimental-utils").ESLintUtils;
const { join } = require("path");

const {
  readExample,
  getCorrectExamples,
  getIncorrectExamples,
} = require("../../utils/read-example");

const rule = require("./mandatory-useEvent");

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

ruleTester.run("effector/mandatory-useEvent.ts.test", rule, {
  valid: getCorrectExamples(__dirname, { ext: ["tsx", "ts"] }).map(
    readExampleForTheRule
  ),

  invalid: [
    // Errors
    ...getIncorrectExamples(__dirname, { ext: "tsx" })
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "useEventNeeded",
            type: "Identifier",
          },
        ],
      })),
  ],
});
