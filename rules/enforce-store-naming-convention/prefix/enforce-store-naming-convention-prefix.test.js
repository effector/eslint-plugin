const { RuleTester } = require("eslint");

const { readExample } = require("../../../utils/read-example");

const rule = require("../enforce-store-naming-convention");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => readExample(__dirname, name);

ruleTester.run("effector/enforce-store-naming-convention-prefix.test", rule, {
  valid: [
    "correct-store-naming.js",
    "correct-store-naming-from-other-package.js",
    "correct-store-naming-in-domain.js",
    "correct-examples-issue-23.js",
    "correct-examples-issue-128.js",
    "correct-store-naming-with-handlers.js",
    "correct-store-naming-in-domain-with-handlers.js",
    "correct-factory.js",
  ]
    .map(readExampleForTheRule)
    .map((code) => ({ code })),

  invalid: [
    // Errors
    ...[
      "incorrect-createStore.js",
      "incorrect-createStore-alias.js",
      "incorrect-createStore-postfix.js",
      "incorrect-restore.js",
      "incorrect-restore-alias.js",
      "incorrect-combine.js",
      "incorrect-combine-alias.js",
      "incorrect-map.js",
      "incorrect-createStore-domain.js",
      "incorrect-store-naming-with-handlers.js",
      "incorrect-store-naming-in-domain-with-handlers.js",
    ]
      .map(readExampleForTheRule)
      .map((code) => ({
        code,
        errors: [
          {
            messageId: "invalidName",
            type: "VariableDeclarator",
          },
        ],
      })),
    // Suggestions
    {
      code: `
import {createStore} from 'effector';
const store = createStore(null);
`,
      errors: [
        {
          messageId: "invalidName",
          suggestions: [
            {
              messageId: "renameStore",
              data: { storeName: "store", correctedStoreName: "$store" },
              output: `
import {createStore} from 'effector';
const $store = createStore(null);
`,
            },
          ],
        },
      ],
    },
  ],
});
