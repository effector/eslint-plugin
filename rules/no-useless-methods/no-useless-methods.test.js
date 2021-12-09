const { RuleTester } = require("eslint");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-useless-methods");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
});

ruleTester.run("effector/no-useless-methods.test", rule, {
  valid: ["correct-examples-issue-74.js"].map(readExampleForTheRule),

  invalid: [],
});
