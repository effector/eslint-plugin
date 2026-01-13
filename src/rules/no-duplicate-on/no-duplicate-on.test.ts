import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-duplicate-on"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-duplicate-on", rule, {
  valid: [
    {
      name: "chained calls different units",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const second = createEvent()

        const $store = createStore(null)

        $store.on(first, () => null).on(second, () => null)
      `,
    },
    {
      name: "one call different units",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const second = createEvent()

        const $store = createStore(null)

        $store.on([first, second], () => null)
      `,
    },
    {
      name: "chained calls effect unit",
      code: ts`
        import { createStore, createEffect } from "effector"

        const firstFx = createEffect()
        const $store = createStore(null)

        $store.on(firstFx, () => null).on(firstFx.doneData, () => null)
      `,
    },
    {
      name: "unrelated call",
      code: ts`
        import { createEvent } from "effector"

        const first = createEvent()
        const $store = { on: () => {} }

        $store.on(first, () => null).on(first, () => null)
      `,
    },
    {
      name: "spread",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const $store = createStore(null)
        const call = [first, () => null]

        $store.on(...call).on(...call)
      `,
    },
    {
      name: "unknown unit",
      code: ts`
        import { createStore } from "effector"

        const $store = createStore(null)
          .on(window.unknown, () => null)
          .on(window.unknown, () => null)
      `,
    },
    {
      name: "store in separate scopes",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const $store = createStore(null).on(first, () => null)

        const factory = () => {
          const $store = createStore(null)

          $store.on(first, () => null)

          return $store
        }
      `,
    },
    {
      name: "(false negative) anonymous store",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()

        createStore(null)
          .on(first, () => null)
          .on(first, () => null)
      `,
    },
    {
      name: "(false negative) broken variable attribution store",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()

        const obj = { store: createStore(null) }

        const on = createStore(null)
          .on(first, () => null)
          .on(first, () => null).on

        const state = createStore(null)
          .on(first, () => null)
          .on(first, () => null).defaultState

        obj["store"].on(first, () => null).on(first, () => null)
      `,
    },

    {
      name: "(false negative) broken variable attribution unit",
      code: ts`
        import { createStore, createEvent } from "effector"

        const obj = { first: createEvent() }

        const $store = createStore(null)
          .on(obj["first"], () => null)
          .on(obj["first"], () => null)
      `,
    },
    {
      name: "(false negative) computed property store",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()

        const $store = createStore(null)
          ["on"](first, () => null)
          ["on"](first, () => null)
          ["reset"](first)
      `,
    },
  ],
  invalid: [
    {
      name: "chained calls same unit",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const $store = createStore(null)

        $store.on(first, () => null).on(first, () => null)
      `,
      errors: [{ messageId: "duplicate", line: 6, column: 11, data: { store: "$store", unit: "first" } }],
    },
    {
      name: "multiple calls same unit",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const $store = createStore(null)

        $store.on(first, () => null)
        $store.on(first, () => null)
      `,
      errors: [{ messageId: "duplicate", line: 7, column: 11, data: { store: "$store", unit: "first" } }],
    },
    {
      name: "multiple calls same unit in array",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const second = createEvent()
        const $store = createStore(null)

        $store.on(first, () => null)
        $store.on([first, second, first], () => null)
      `,
      errors: [
        { messageId: "duplicate", line: 8, column: 12, endColumn: 17, data: { store: "$store", unit: "first" } },
        { messageId: "duplicate", line: 8, column: 27, endColumn: 32, data: { store: "$store", unit: "first" } },
      ],
    },
    {
      name: "same effect derived unit",
      code: ts`
        import { createStore, createEffect } from "effector"

        const firstFx = createEffect()
        const $store = createStore(null)

        $store.on(firstFx.doneData, () => null).on(firstFx.doneData, () => null)
      `,
      errors: [{ messageId: "duplicate", line: 6, column: 11, data: { store: "$store", unit: "firstFx.doneData" } }],
    },
    {
      name: "same event through other chained calls",
      code: ts`
        import { createStore, createEffect } from "effector"

        const first = createEvent()
        const second = createEvent()
        const $store = createStore(null)

        $store
          .on(first, () => null)
          .reset(second)
          .on(first, () => null)
      `,
      errors: [{ messageId: "duplicate", line: 8, column: 7, data: { store: "$store", unit: "first" } }],
    },
    {
      name: "assigned store",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()

        const $store = createStore(null)
          .on(first, () => null)
          .on(first, () => null)
      `,
      errors: [{ messageId: "duplicate", line: 6, column: 7, data: { store: "$store", unit: "first" } }],
    },
    {
      name: "assigned chained store + later call",
      code: ts`
        import { createStore, createEvent } from "effector"

        const first = createEvent()
        const second = createEvent()

        const $store = createStore(null)
          .on(first, () => null)
          .reset(second)

        $store.on(first, () => null)
      `,
      errors: [{ messageId: "duplicate", line: 10, column: 11, data: { store: "$store", unit: "first" } }],
    },
  ],
})
