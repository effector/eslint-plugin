const { RuleTester } = require("eslint");

const rule = require("./no-inline-units");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-inline-units.test", rule, {
  valid: [
    `
      import { sample } from 'effector';
      sample({ clock: event, target: effectFx });
    `,
    `
      import { sample } from 'someLibrary';
      sample({
        clock: event,
        source: $shouldExecute,
        filter: (shouldExecute) => shouldExecute,
        target: effectFx
      });
    `,
    `
      import { sample, attach } from 'effector';
      sample({
        clock: event,
        target: attach({
          effect: originalFx,
          mapParams: params => {
            return { wrapped: params }
          },
        })
      });
    `,
  ].map((code) => ({ code })),
  invalid: [
    `
      import { forward, createEffect } from 'effector';
      forward({ from: eventOne, to: createEffect() });
    `,
    `
      import { forward, createStore } from 'effector';
      forward({ from: eventOne, to: createStore(null) });
    `,
    `
      import { forward, createEvent } from 'effector';
      forward({ from: eventOne, to: createEvent() });
    `,
    `
      import { attach, createEffect } from 'effector';
      attach({
        effect: createEffect(),
        mapParams: params => {
          return {wrapped: params}
        },
      });
    `,
    `
      import { sample, attach, createEffect } from 'effector';
      sample({
        clock: event,
        target: attach({
          effect: createEffect(),
          mapParams: params => {
            return {wrapped: params}
          },
        })
      });
    `,
  ].map((code) => ({
    code,
    errors: [
      {
        messageId: "noInlineUnits",
        type: "CallExpression",
      },
    ],
  })),
});
