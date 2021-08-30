const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");

const rule = require("./enforce-effect-naming-convention");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => readExample(__dirname, name);

ruleTester.run("effector/enforce-effect-naming-convention.test", rule, {
  valid: [
    "correct-effect-naming.js",
    "correct-effect-naming-from-other-package.js",
    "correct-effect-naming-in-domain.js",
    "correct-examples-issue-24.js",
  ]
    .map(readExampleForTheRule)
    .map((code) => ({ code })),

  invalid: [
    // Errors
    ...[
      "incorrect-createEffect.js",
      "incorrect-createEffect-alias.js",
      "incorrect-createEffect-in-domain.js",
      "incorrect-attach.js",
      "incorrect-attach-alias.js",
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
import {createEffect} from 'effector';
const effect = createEffect();
    `,
      errors: [
        {
          messageId: "invalidName",
          suggestions: [
            {
              messageId: "renameEffect",
              data: { effectName: "effect" },
              output: `
import {createEffect} from 'effector';
const effectFx = createEffect();
    `,
            },
          ],
        },
      ],
    },
  ],
});
