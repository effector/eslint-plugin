const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");

const rule = require("./prefer-sample-over-forward-with-mapping");

const readExampleForTheRule = (name) => readExample(__dirname, name);

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/prefer-sample-over-forward-with-mapping.test", rule, {
  valid: [
    `
import { forward } from 'effector';
forward({ from: eventOne, to: eventTwo });
`,
    `
import { forward } from 'effector';
forward({ from: eventOne.prepend((v) => v.length), to: eventTwo });
`,
  ].map((code) => ({ code })),

  invalid: [
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne.map((v) => v.length), to: eventTwo });
`,
      errors: [
        {
          messageId: "overMap",
          type: "CallExpression",
          data: { eventName: "eventOne" },
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { sample } from 'effector';
sample({ clock: eventOne, fn: (v) => v.length, target: eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne, to: eventTwo.prepend((v) => v.length) });
`,
      errors: [
        {
          messageId: "overPrepend",
          type: "CallExpression",
          data: { eventName: "eventTwo" },
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { sample } from 'effector';
sample({ clock: eventOne, fn: (v) => v.length, target: eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne, to: serviceOne.featureOne.eventTwo.prepend((v) => v.length) });
`,
      errors: [
        {
          messageId: "overPrepend",
          type: "CallExpression",
          data: { eventName: "eventTwo" },
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { sample } from 'effector';
sample({ clock: eventOne, fn: (v) => v.length, target: serviceOne.featureOne.eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: serviceOne.featureOne.eventOne.map((v) => v.length), to: eventTwo });
`,
      errors: [
        {
          messageId: "overMap",
          type: "CallExpression",
          data: { eventName: "eventOne" },
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { sample } from 'effector';
sample({ clock: serviceOne.featureOne.eventOne, fn: (v) => v.length, target: eventTwo });
`,
            },
          ],
        },
      ],
    },
  ],
});
