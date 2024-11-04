const { RuleTester } = require("eslint");
const { join } = require("path");

const {
  readExample,
  getCorrectExamples,
  getIncorrectExamples,
} = require("../../utils/read-example");

const rule = require("./require-pickup-in-persist");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("effector/require-pickup-in-persist.js.test", rule, {
  valid: getCorrectExamples(__dirname).map(readExampleForTheRule),

  invalid:
    // Errors
    getIncorrectExamples(__dirname)
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "pickupMissing",
            type: "CallExpression",
          },
        ],
      })),
});
