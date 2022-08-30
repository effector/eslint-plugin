const { RuleTester } = require("eslint");
const { readExample } = require("../../utils/read-example");
const rule = require("./enforce-store-naming-convention");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => readExample(__dirname, name);

ruleTester.run("effector/enforce-store-naming-convention-test", rule, {
  valid: [
    "correct-store-naming.js",
    "correct-store-naming-with-handlers.js",
    "correct-store-naming-in-domain.js",
    "correct-store-naming-in-domain-with-handlers.js",
  ]
    .map(readExampleForTheRule)
    .map((code) => ({ code })),
  invalid: [
    "incorrect-store-naming.js",
    "incorrect-store-naming-with-handlers.js",
    "incorrect-store-naming-in-domain.js",
    "incorrect-store-naming-in-domain-with-handlers.js",
  ]
    .map(readExampleForTheRule)
    .map((code) => ({
      code,
      errors: [
        {
          type: "VariableDeclarator",
          message:
            'Store "sum" should be named with prefix, rename it to "$sum"',
        },
      ],
    })),
});
