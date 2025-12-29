import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-useless-methods"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-useless-methods", rule, {
  valid: [
    {
      name: "simple assign",
      code: ts`
        import { sample, guard } from "effector"

        // with simple assign
        const a = sample({ clock: trigger, fn: Boolean })
        const b = sample({ source: trigger, fn: Boolean })

        const c = guard({ clock: trigger, filter: Boolean })
        const d = guard({ source: trigger, filter: Boolean })
      `,
    },
    {
      name: "with target",
      code: ts`
        import { sample, guard } from "effector"

        // with target
        sample({ clock: trigger, fn: Boolean, target })
        sample({ source: trigger, fn: Boolean, target })

        guard({ clock: trigger, filter: Boolean, target })
        guard({ source: trigger, filter: Boolean, target })
      `,
    },
    {
      name: "complex assign",
      code: ts`
        import { sample, guard } from "effector"

        const complex = {
          target: guard({ source: trigger, filter: Boolean }),
        }
      `,
    },
    {
      name: "function result",
      code: ts`
        function createFactory() {
          const otherTrigger = createEvent()

          return sample({ source: otherTrigger, filter: Boolean })
        }

        const createBooleanGuard = (otherTrigger) => sample({ source: otherTrigger, filter: Boolean })
      `,
    },
    {
      name: "deep nested usage",
      code: ts`
        import { createEvent, createStore, guard, sample } from "effector"

        const fired = createEvent()
        const $exists = createStore(false)
        const $email = createStore("")
        const $error = createStore(false)

        sample({
          clock: guard({ clock: fired, source: $exists, filter: (v) => !v }),
          source: $email,
          fn: Boolean,
          target: $error,
        })
      `,
    },
    // https://github.com/igorkamyshev/eslint-plugin-effector/issues/74
    {
      name: "operator as argument",
      code: ts`
        import { guard } from "effector"

        $name.on(guard({ clock: updated, filter: Boolean }), (prev, updated) => updated)
      `,
    },
    {
      name: "used for watch",
      code: ts`
        import { sample } from "effector"

        sample($store, event).watch(console.log)
      `,
    },
  ],
  invalid: [
    {
      name: "guard clock",
      code: ts`
        import { guard, createEvent } from "effector"

        const trigger = createEvent()
        guard({ clock: trigger, filter: Boolean })
      `,
      errors: [{ messageId: "uselessMethod", line: 4, data: { method: "guard" } }],
    },
    {
      name: "guard source",
      code: ts`
        import { guard, createEvent } from "effector"

        const trigger = createEvent()
        guard({ source: trigger, filter: Boolean })
      `,
      errors: [{ messageId: "uselessMethod", line: 4, data: { method: "guard" } }],
    },
    {
      name: "sample clock",
      code: ts`
        import { sample, createEvent } from "effector"

        const trigger = createEvent()
        sample({ clock: trigger, fn: Boolean })
      `,
      errors: [{ messageId: "uselessMethod", line: 4, data: { method: "sample" } }],
    },
    {
      name: "sample source",
      code: ts`
        import { sample, createEvent } from "effector"

        const trigger = createEvent()
        sample({ source: trigger, fn: Boolean })
      `,
      errors: [{ messageId: "uselessMethod", line: 4, data: { method: "sample" } }],
    },
    {
      name: "sample positional",
      code: ts`
        import { sample } from "effector"

        sample(trigger, source)
      `,
      errors: [{ messageId: "uselessMethod", line: 3, data: { method: "sample" } }],
    },
    {
      name: "function nested",
      code: ts`
        import { sample } from "effector"

        const target = sample({
          clock: event,
          fn: () => {
            sample({ clock: a, fn: Boolean }) // useless
          },
        })
      `,
      errors: [{ messageId: "uselessMethod", line: 6, data: { method: "sample" } }],
    },
    {
      name: "sample in for loop",
      code: ts`
        import { sample, createEvent } from "effector"

        const source = createEvent()

        for (const i = 0; i < 10; i++) sample({ source })
      `,
      errors: [{ messageId: "uselessMethod", line: 5, column: 32, data: { method: "sample" } }],
    },
  ],
})
