const { RuleTester } = require("eslint");

const rule = require("./no-guard");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-guard.test", rule, {
  valid: [
    `
import { sample } from 'effector';
sample({ clock: eventOne, target: eventTwo });
`,
    `
import { guard } from 'effector';
guard({ clock: eventOne.map(() => true), target: eventTwo });
`,
    `
import { guard } from 'someLibrary';
forward({ clock: eventOne.prepend((v) => v.length), target: eventTwo });
`,
  ].map((code) => ({ code })),

  invalid: [
    {
      code: `
import { guard } from 'effector';
guard({ clock: eventOne, target: eventTwo, filter: Boolean });
`,
      errors: [
        {
          messageId: "noGuard",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { guard, sample } from 'effector';
sample({ clock: eventOne, filter: Boolean, target: eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { guard } from 'effector';
guard({ clock: eventOne, target: eventTwo.prepend((v) => v.length), filter: (v) => v.length > 0 });
`,
      errors: [
        {
          messageId: "noGuard",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { guard, sample } from 'effector';
sample({ clock: eventOne, filter: (v) => v.length > 0, fn: (v) => v.length, target: eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { guard } from 'effector';
guard({ clock: eventOne, target: serviceOne.featureOne.eventTwo.prepend((v) => v.length), filter: $store });
`,
      errors: [
        {
          messageId: "noGuard",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { guard, sample } from 'effector';
sample({ clock: eventOne, filter: $store, fn: (v) => v.length, target: serviceOne.featureOne.eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { guard } from 'effector';
guard({ source: $someStore, clock: merge(eventOne, eventOneOne), target: eventTwo, filter: Boolean });
`,
      errors: [
        {
          messageId: "noGuard",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { guard, sample } from 'effector';
sample({ clock: merge(eventOne, eventOneOne), source: $someStore, filter: Boolean, target: eventTwo });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { sample, guard } from 'effector';
guard({ clock: fFx.failData, filter: isAborted });
`,
      errors: [
        {
          messageId: "noGuard",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import { sample, guard } from 'effector';
sample({ clock: fFx.failData, filter: isAborted });
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import SmthDefault, { guard, forward } from 'effector';
guard(fFx.failData, { filter: isAborted });
`,
      errors: [
        {
          messageId: "noGuard",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: `
import SmthDefault, { guard, sample, forward } from 'effector';
sample({ clock: fFx.failData, filter: isAborted });
`,
            },
          ],
        },
      ],
    },
  ],
});
