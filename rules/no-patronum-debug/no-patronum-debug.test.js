const { RuleTester } = require("eslint");

const rule = require("./no-patronum-debug");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("effector/no-patronum-debug.test", rule, {
  valid: [
    `
import { debug } from 'some-library';
debug(variable);
`,
    `
import { debug } from 'patronum';
const fn = () => {};
`,
    `
const debug = (...args) => console.log(...args);
debug(store);
`,
    `
import { debug } from 'patronum/debug'
sample({ clock: tick, target: runFx })
`,
    `
const $store = createStore(false).on(open, () => true)
`,
  ].map((code) => ({ code })),

  invalid: [
    {
      code: `
import { debug } from 'patronum';
import { createStore } from 'effector';
const $store = createStore('John Due');
debug($store);
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
import { createStore } from 'effector';
const $store = createStore('John Due');
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { createEvent } from 'effector';
import { debug, timeout } from 'patronum';
const buttonClicked = createEvent(); 
debug(buttonClicked);
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
import { createEvent } from 'effector';
import { timeout } from 'patronum';
const buttonClicked = createEvent();
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { delay, debug, condition } from 'patronum';
const effectFx = createEffect(() => 'effectFx');
debug({ trace: true }, $store);
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
import { delay, condition } from 'patronum';
const effectFx = createEffect(() => 'effectFx');
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { debug } from 'patronum';
const $count = createStore(0);
const scopeA = fork({
  values: [[$count, 42]],
});
const scopeB = fork({
  values: [[$count, 1337]],
});
debug.registerScope(scopeA, { name: 'scope_42' });
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
const $count = createStore(0);
const scopeA = fork({
  values: [[$count, 42]],
});
const scopeB = fork({
  values: [[$count, 1337]],
});
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { debug, delay, condition } from 'patronum/debug';
const $store = createStore({});
debug.unregisterAllScopes();
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
import { delay, condition } from 'patronum/debug';
const $store = createStore({});
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { debug as debugPatronum } from 'patronum';
const $store = createStore({});
debugPatronum($store);
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
const $store = createStore({});
`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { debug } from 'patronum'
const effectFx = createEffect()
debug({ trace: true }, effectFx)`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
const effectFx = createEffect()`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { condition, debug } from 'patronum'
const event = createEvent()
debug(event)`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
import { condition } from 'patronum'
const event = createEvent()`,
            },
          ],
        },
      ],
    },
    {
      code: `
import { condition, debug, delay } from 'patronum'

const $store = createStore(false)

const createTest = () => {
  const state = {
    equal(a, b) {
      return a === b
    }
  }
  debug($store)
  return state
}
`,
      errors: [
        {
          messageId: "noPatronumDebug",
          type: "CallExpression",
          suggestions: [
            {
              messageId: "removePatronumDebug",
              output: `
import { condition, delay } from 'patronum'

const $store = createStore(false)

const createTest = () => {
  const state = {
    equal(a, b) {
      return a === b
    }
  }
  return state
}
`,
            },
          ],
        },
      ],
    },
  ],
});
