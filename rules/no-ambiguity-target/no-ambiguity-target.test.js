const { RuleTester } = require("eslint");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-ambiguity-target");

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

ruleTester.run("effector/no-ambiguity-target.js.test", rule, {
  valid: ["correct-example-issue-133.js"].map(readExampleForTheRule),

  invalid: [],
});
