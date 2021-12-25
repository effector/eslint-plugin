const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");

const rule = require("./keep-options-order");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => readExample(__dirname, name);

ruleTester.run("effector/keep-options-order.test", rule, {
  valid: ["correct-sample.js", "correct-guard.js"]
    .map(readExampleForTheRule)
    .map((code) => ({ code })),

  invalid: [
    // Errors
    ...["incorrect-sample.js", "incorrect-guard.js"]
      .map(readExampleForTheRule)
      .map((code) => ({
        code,
        errors: [
          {
            messageId: "invalidOrder",
            type: "CallExpression",
          },
        ],
      })),
    // Suggestions
    {
      code: `
import {sample} from 'effector';
sample({ source, clock, fn, target });
      `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: `
import {sample} from 'effector';
sample({ clock, source, fn, target });
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
import {sample} from 'effector';
sample({ fn() { return null }, clock, target });
        `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: `
import {sample} from 'effector';
sample({ clock, fn() { return null }, target });
        `,
            },
          ],
        },
      ],
    },
    {
      code: `
import {sample} from 'effector';
sample({ fn, clock: event.map(() => null), target });
          `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: `
import {sample} from 'effector';
sample({ clock: event.map(() => null), fn, target });
          `,
            },
          ],
        },
      ],
    },
    {
      code: `
import {sample} from 'effector';
sample({ source: combine({ a: $a }), clock, target });
            `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: `
import {sample} from 'effector';
sample({ clock, source: combine({ a: $a }), target });
            `,
            },
          ],
        },
      ],
    },
  ],
});
