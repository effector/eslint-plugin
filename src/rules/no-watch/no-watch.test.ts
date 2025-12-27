import path from "node:path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-watch"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("no-watch", rule, {
  valid: [
    {
      name: "correct sample usage",
      code: ts`
        import { createEvent, sample } from "effector"

        const clock = createEvent()
        const derived = sample({ clock, fn: () => true })
      `,
    },
    {
      name: "unrelated watch method",
      code: ts`
        const event = { watch: (fn: () => void) => fn() }

        event.watch(console.log)
      `,
    },
    {
      name: "createWatch",
      code: ts`
        import { createEvent, sample, createWatch } from "effector"

        const clock = createEvent()
        const derived = sample({ clock, fn: () => true })

        createWatch({ unit: derived, fn: console.log })
      `,
    },
  ],
  invalid: [
    {
      name: "store units",
      code: ts`
        import { createStore } from "effector"

        const watcher = (v: unknown) => v
        const $watchable = createStore(0)

        $watchable.watch(watcher)
        $watchable.updates.watch(watcher)
      `,
      errors: [
        { line: 6, column: 9, messageId: "restricted" },
        { line: 7, column: 9, messageId: "restricted" },
      ],
    },
    {
      name: "sample",
      code: ts`
        import { createEvent, sample } from "effector"

        const watcher = (v: unknown) => v
        const clock = createEvent()
        const derived = sample({ clock, fn: () => true })

        sample({ clock, fn: () => true }).watch(watcher)
        derived.watch(watcher)
      `,
      errors: [
        { line: 7, column: 9, messageId: "restricted" },
        { line: 8, column: 9, messageId: "restricted" },
      ],
    },
    {
      name: "guard",
      code: ts`
        import { createEvent, guard } from "effector"

        const watcher = (v: unknown) => v
        const clock = createEvent()

        guard({ clock, filter: () => Math.random() > 0.5 }).watch(watcher)
      `,
      errors: [{ line: 6, column: 9, messageId: "restricted" }],
    },
    {
      name: "event",
      code: ts`
        import { createEvent } from "effector"

        const watcher = (v: unknown) => v
        const event = createEvent()

        event.watch(watcher)
      `,
      errors: [{ line: 6, column: 9, messageId: "restricted" }],
    },
    {
      name: "effect",
      code: ts`
        import { createEffect } from "effector"

        const watcher = (v: unknown) => v
        const effectFx = createEffect()

        effectFx.watch(watcher)

        effectFx.done.watch(watcher)
        effectFx.doneData.watch(watcher)

        effectFx.fail.watch(watcher)
        effectFx.failData.watch(watcher)

        effectFx.finally.watch(watcher)
      `,
      errors: [
        { line: 6, column: 9, messageId: "restricted" },
        { line: 8, column: 9, messageId: "restricted" },
        { line: 9, column: 9, messageId: "restricted" },
        { line: 11, column: 9, messageId: "restricted" },
        { line: 12, column: 9, messageId: "restricted" },
        { line: 14, column: 9, messageId: "restricted" },
      ],
    },
    {
      name: "imported units",
      code: ts`
        import { $store, event } from "${fixture("units")}"

        $store.watch(console.log)
        event.watch(console.log)
      `,
      errors: [
        { line: 3, column: 9, messageId: "restricted" },
        { line: 4, column: 9, messageId: "restricted" },
      ],
    },
  ],
})
