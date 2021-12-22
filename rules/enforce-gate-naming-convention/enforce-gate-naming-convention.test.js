const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");

const rule = require("./enforce-gate-naming-convention");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => readExample(__dirname, name);

ruleTester.run("effector/enforce-gate-naming-convention.test", rule, {
  valid: [
    "correct-gate-naming.js",
    "correct-gate-naming-from-other-package.js",
    "correct-gate-naming-in-domain.js",
  ]
    .map(readExampleForTheRule)
    .map((code) => ({ code })),

  invalid: [
    // Errors
    ...[
      "incorrect-createGate.js",
      "incorrect-createGate-alias.js",
      "incorrect-createGate-in-domain.js",
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
import {createGate} from 'effector-react';
const someGate = createGate();
    `,
      errors: [
        {
          messageId: "invalidName",
          suggestions: [
            {
              messageId: "renameGate",
              data: { effectName: "someGate" },
              output: `
import {createGate} from 'effector-react';
const SomeGate = createGate();
    `,
            },
          ],
        },
      ],
    },
  ],
});
