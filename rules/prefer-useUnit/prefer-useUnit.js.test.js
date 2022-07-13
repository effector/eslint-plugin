const { RuleTester } = require("eslint");
const { join } = require("path");

const {
  readExample,
  getCorrectExamples,
  getIncorrectExamples,
} = require("../../utils/read-example");

const rule = require("./prefer-useUnit");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("effector/prefer-useUnit.js.test", rule, {
  valid: getCorrectExamples(__dirname, { ext: ["jsx", "jx"] }).map(
    readExampleForTheRule
  ),

  invalid:
    // Errors
    getIncorrectExamples(__dirname, { ext: ["jsx", "js"] })
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "useUnitNeeded",
            type: "CallExpression",
          },
        ],
      })),
});
