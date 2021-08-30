const { RuleTester } = require("eslint");

const { readExample } = require("../../utils/read-example");

const rule = require("./no-unnecessary-duplication");

const readExampleForTheRule = (name) => readExample(__dirname, name);

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-unnecessary-duplication.test", rule, {
  valid: [
    readExampleForTheRule("correct-examples-issue-21.js"),
    `
import { sample } from 'effector';
sample({ source: event });
`,
    `
import { sample } from 'effector';
sample({ source: $store });
`,
    `
import { sample } from 'effector';
sample({ clock: $store });
`,
    `
import { sample } from 'effector';
sample({ clock: event });
`,
    `
import { sample } from 'effector';
sample({
    clock: event,
    fn() {
        return 'CONST';
    },
});
`,
    `
import { sample } from 'effector';
sample({ clock: event, target: otherEvent });
`,
    `
import { sample } from 'effector';
sample({ source: event, target: otherEvent });
`,
    `
import { guard } from 'effector';
guard({ source: event, filter: $store });
`,
    `
import { guard } from 'effector';
guard({ clock: event, filter: $store });
`,
    `
import { guard } from 'effector';
guard({ source: event, filter: (v) => v > 0 });
`,
  ].map((code) => ({ code })),

  invalid: [
    // cases with complex formatting
    {
      code: `
import { sample } from 'effector';
sample({ source: [$store], clock: [
  $store
] });
`,
      errors: [
        {
          messageId: "unnecessaryDuplication",
          type: "CallExpression",
        },
      ],
    },
    // source + clock in sample
    {
      code: `
import { sample } from 'effector';
sample({ source: $store, clock: $store });
`,
      errors: [
        {
          messageId: "unnecessaryDuplication",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removeClock",
              output: `
import { sample } from 'effector';
sample({ source: $store });
`,
            },
            {
              messageId: "removeSource",
              output: `
import { sample } from 'effector';
sample({ clock: $store });
`,
            },
          ],
        },
      ],
    },
    // source + clock + target in sample
    {
      code: `
  import { sample } from 'effector';
  sample({ source: $store, clock: $store, target: event });
  `,
      errors: [
        {
          messageId: "unnecessaryDuplication",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removeClock",
              output: `
  import { sample } from 'effector';
  sample({ source: $store, target: event });
  `,
            },
            {
              messageId: "removeSource",
              output: `
  import { sample } from 'effector';
  sample({ clock: $store, target: event });
  `,
            },
          ],
        },
      ],
    },
    // source + clock + target + fn in sample
    {
      code: `
    import { sample } from 'effector';
    sample({ source: $store, clock: $store, target: event, fn: (source) => ({ source }) });
    `,
      errors: [
        {
          messageId: "unnecessaryDuplication",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removeClock",
              output: `
    import { sample } from 'effector';
    sample({ source: $store, target: event, fn: (source) => ({ source }) });
    `,
            },
            {
              messageId: "removeSource",
              output: `
    import { sample } from 'effector';
    sample({ clock: $store, target: event, fn: (source) => ({ source }) });
    `,
            },
          ],
        },
      ],
    },
  ],
});
