import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-ambiguity-target"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-ambiguity-target", rule, {
  valid: [
    {
      name: "sample target",
      code: ts`
        import { sample, createEvent } from "effector"

        const trigger = createEvent()
        const target = createEvent()

        sample({ clock: trigger, fn: Boolean, target })
        sample({ source: trigger, fn: Boolean, target })
      `,
    },
    {
      name: "guard target",
      code: ts`
        import { sample, guard, createEvent } from "effector"

        const trigger = createEvent()
        const target = createEvent()

        guard({ clock: trigger, filter: Boolean, target })
        guard({ source: trigger, filter: Boolean, target })
      `,
    },
    {
      name: "sample assignment",
      code: ts`
        import { sample, createEvent } from "effector"

        const trigger = createEvent()
        const target = createEvent()

        const a = sample({ clock: trigger, fn: Boolean })
        const b = sample({ source: trigger, fn: Boolean })
        const c = sample(trigger, trigger, () => null)
      `,
    },
    {
      name: "guard assignment",
      code: ts`
        import { sample, guard, createEvent } from "effector"

        const trigger = createEvent()
        const target = createEvent()

        const a = guard({ clock: trigger, filter: Boolean })
        const b = guard({ source: trigger, filter: Boolean })
        const c = guard(trigger, { filter: Boolean })
      `,
    },
    {
      name: "sample object member",
      code: ts`
        import { sample, createEvent } from "effector"

        const source = createEvent()

        const $$ = { a: sample({ source }) }
      `,
    },
    {
      name: "sample returned from factory",
      code: ts`
        import { sample, createEvent, Store } from "effector"

        const source = createEvent()

        const createSourced = (clock: Store<unknown>) => sample(clock, source)
        const createSourcedObject = (clock: Store<unknown>) => sample({ clock, source })

        const truthful = (clock: Store<unknown>) => {
          return sample({ clock, filter: Boolean })
        }
      `,
    },
    {
      // https://github.com/igorkamyshev/eslint-plugin-effector/issues/133
      name: "function in object",
      code: ts`
        import { createStore, createEvent, sample } from "effector"

        const obj = {
          fn: () => {
            const $store = createStore(0)
            const event = createEvent()

            sample({ source: event, target: $store })
          },
        }
      `,
    },
  ],
  invalid: [
    {
      name: "guard object",
      code: ts`
        import { guard, createEvent } from "effector"

        const trigger = createEvent()
        const target = createEvent()

        const result = {
          something: guard({ clock: trigger, filter: Boolean, target }),
        }
      `,
      errors: [{ messageId: "ambiguous", line: 7, column: 14, data: { method: "guard" } }],
    },
    {
      name: "sample",
      code: ts`
        import { sample, createEvent } from "effector"

        const trigger = createEvent()
        const target = createEvent()

        const result = sample({ clock: trigger, fn: Boolean, target })
      `,
      errors: [{ messageId: "ambiguous", line: 6, column: 16, data: { method: "sample" } }],
    },
    {
      name: "factory",
      code: ts`
        import { sample, createEvent, Store } from "effector"

        const target = createEvent<unknown>()

        const truthful = (clock: Store<unknown>) => sample({ clock, filter: Boolean, target })
      `,
      errors: [{ messageId: "ambiguous", line: 5, column: 45, data: { method: "sample" } }],
    },
    {
      name: "nested",
      code: ts`
        import { sample, createEvent, Store } from "effector"

        const clock = createEvent<unknown>()
        const target = createEvent<unknown>()

        sample({ clock: sample({ clock, filter: Boolean, target }), fn: () => true, target })
      `,
      errors: [{ messageId: "ambiguous", line: 6, column: 17, data: { method: "sample" } }],
    },
  ],
})
