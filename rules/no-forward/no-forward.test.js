const { RuleTester } = require("eslint");

const rule = require("./no-forward");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-forward.test", rule, {
  valid: [
    `
import { sample } from 'effector';
sample({ clock: eventOne, target: eventTwo });
`,
    `
import { forward } from 'someLibrary';
forward({ from: eventOne.prepend((v) => v.length), to: eventTwo });
`,
  ].map((code) => ({ code })),

  invalid: [
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne, to: eventTwo });
          `,
      errors: [
        {
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
sample({ clock: eventOne, target: eventTwo });
          `,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne.prepend((v) => v.length), to: eventTwo });
            `,
      errors: [
        {
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
sample({ clock: eventOne.prepend((v) => v.length), target: eventTwo });
            `,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne.map((v) => v.length), to: eventTwo });
`,
      errors: [
        {
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
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
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
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
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
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
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
sample({ clock: serviceOne.featureOne.eventOne, fn: (v) => v.length, target: eventTwo });
  `,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: merge(eventOne, eventOneOne), to: eventTwo });
  `,
      errors: [
        {
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
sample({ clock: merge(eventOne, eventOneOne), target: eventTwo });
    `,
            },
          ],
        },
      ],
    },
    {
      code: `
import { forward } from 'effector';
forward({ from: eventOne, to: [eventTwo, eventTwoTwo] });
    `,
      errors: [
        {
          messageId: "noForward",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import {sample} from 'effector';
sample({ clock: eventOne, target: [eventTwo, eventTwoTwo] });
      `,
            },
          ],
        },
      ],
    },
  ],
});
