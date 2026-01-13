import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-unnecessary-combination"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-unnecessary-combination", rule, {
  valid: [
    {
      name: "no combination",
      code: ts`
        import { createEvent, createStore, forward, guard, sample } from "effector"

        const a = createEvent()
        const b = createEvent()
        const $x = createStore(null)
        const $y = createStore(null)

        sample({ clock: [a, b], source: [$x, $y] })
        sample({ clock: a, source: [$x, $y] })
        sample({ clock: a, source: { a: $x, b: $y } })

        guard({ clock: [a, b], source: $x, filter: Boolean })
        guard({ clock: a, source: { a: $x }, filter: Boolean })
      `,
    },
    {
      name: "combine in clock",
      code: ts`
        import { combine, createStore, sample, guard } from "effector"

        const $x = createStore(null)
        const $y = createStore(null)

        guard({ clock: combine({ $x, $y }) })
        sample({ clock: combine($x, $y) })
      `,
    },
    {
      name: "merge/combine outside",
      code: ts`
        import { merge, createEvent, createStore, combine } from "effector"

        const a = createEvent()
        const b = createEvent()
        const $x = createStore(null)
        const $y = createStore(null)

        const merged = merge([a, b])
        const combined = combine({ a, b }, (v) => Object.values(v))
      `,
    },
    {
      name: "nested source -> clock -> combine",
      code: ts`
        import { combine, createStore, merge, sample, guard } from "effector"

        const a = createEvent()

        const $x = createStore(null)
        const $y = createStore(null)

        sample({ source: sample({ clock: combine({ $x, $y }) }) })
      `,
    },
    {
      name: "combine with fn",
      code: ts`
        import { combine, createStore, sample } from "effector"

        const $x = createStore(null)

        // inline arrow
        sample({ source: combine({ y: $x }, ({ y }) => y) })
        sample({ source: combine([$x, $x], (value) => value) })

        // inline function
        sample({
          source: combine({ y: $x }, function ({ y }) {
            return y
          }),
        })

        // separate
        const fn = (arg: unknown) => arg
        sample({ source: combine({ y: $x }, fn) })
        sample({ source: combine($x, $x, fn) })
      `,
    },
  ],
  invalid: [
    {
      name: "combine in guard.source",
      code: ts`
        import { combine, createStore, guard } from "effector"

        const $x = createStore(null)
        const $y = createStore(null)

        guard({ source: combine($x, $y), filter: Boolean })
      `,
      errors: [
        {
          messageId: "unnecessary",
          line: 6,
          column: 17,
          data: { method: "combine", property: "source", operator: "guard" },
        },
      ],
    },
    {
      name: "combine in sample.source",
      code: ts`
        import { combine, createStore, sample } from "effector"

        const $x = createStore(null)
        const $y = createStore(null)

        sample({ source: combine({ a: $x, b: $y }), fn: (v) => v })
      `,
      errors: [
        {
          messageId: "unnecessary",
          line: 6,
          column: 18,
          data: { method: "combine", property: "source", operator: "sample" },
        },
      ],
    },
    {
      name: "merge in guard.clock",
      code: ts`
        import { merge, createEvent, guard } from "effector"

        const a = createEvent()
        const b = createEvent()

        guard({ clock: merge([a, b]), filter: Boolean })
      `,
      errors: [
        {
          messageId: "unnecessary",
          line: 6,
          column: 16,
          data: { method: "merge", property: "clock", operator: "guard" },
        },
      ],
    },
    {
      name: "merge in sample.clock",
      code: ts`
        import { merge, createEvent, sample } from "effector"

        const a = createEvent()
        const b = createEvent()

        sample({ clock: merge([a, b]), filter: Boolean })
      `,
      errors: [
        {
          messageId: "unnecessary",
          line: 6,
          column: 17,
          data: { method: "merge", property: "clock", operator: "sample" },
        },
      ],
    },

    {
      name: "merge in guard.source",
      code: ts`
        import { merge, createEvent, guard } from "effector"

        const a = createEvent()
        const b = createEvent()

        guard({ clock: a, source: merge([a, b]), filter: Boolean })
      `,
      errors: [
        {
          messageId: "unnecessary",
          line: 6,
          column: 27,
          data: { method: "merge", property: "source", operator: "guard" },
        },
      ],
    },
    {
      name: "merge in sample.source",
      code: ts`
        import { merge, createEvent, sample } from "effector"

        const a = createEvent()
        const b = createEvent()

        sample({ clock: a, source: merge([a, b]), fn: (v) => v })
      `,
      errors: [
        {
          messageId: "unnecessary",
          line: 6,
          column: 28,
          data: { method: "merge", property: "source", operator: "sample" },
        },
      ],
    },
  ],
})
