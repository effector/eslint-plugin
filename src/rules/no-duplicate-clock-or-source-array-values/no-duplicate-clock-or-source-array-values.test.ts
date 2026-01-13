import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-duplicate-clock-or-source-array-values"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-duplicate-clock-or-source-array-values", rule, {
  valid: [
    {
      name: "different units",
      code: ts`
        import { sample, createEvent } from "effector"

        const clock = createEvent()
        const source = createEvent()

        sample({ clock: [clock], source: [source] })
      `,
    },
    {
      name: "same unit in clock & source",
      code: ts`
        import { sample, createEvent } from "effector"

        const event = createEvent()

        sample({ clock: [event], source: [event] })
      `,
    },
    {
      name: "non-member expression value",
      code: ts`
        import { sample, createEvent } from "effector"

        const x = createEvent()

        sample({
          clock: [sample({ clock: x }), sample({ clock: x }), sample({ clock: x })],
          source: [sample({ source: x, filter: Boolean }), sample({ source: x, filter: Boolean })],
        })
      `,
    },
  ],
  invalid: [
    {
      name: "sample duplicate units (identifier)",
      code: ts`
        import { sample, createEvent } from "effector"

        const event = createEvent()
        const other = createEvent()

        sample({ clock: [event, event, other] })
        sample({ source: [event, event] })
      `,
      errors: [
        {
          messageId: "duplicate",
          data: { field: "clock", unit: "event" },
          line: 6,
          column: 25,
          suggestions: [
            {
              messageId: "remove",
              data: { unit: "event" },
              output: ts`
                import { sample, createEvent } from "effector"

                const event = createEvent()
                const other = createEvent()

                sample({ clock: [event${/* after-fix spacing */ " "}, other] })
                sample({ source: [event, event] })
              `,
            },
          ],
        },
        {
          messageId: "duplicate",
          data: { field: "source", unit: "event" },
          line: 7,
          column: 26,
          suggestions: [
            {
              messageId: "remove",
              data: { unit: "event" },
              output: ts`
                import { sample, createEvent } from "effector"

                const event = createEvent()
                const other = createEvent()

                sample({ clock: [event, event, other] })
                sample({ source: [event${/* after-fix spacing */ " "}] })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "guard duplicate units (member)",
      code: ts`
        import { guard, createStore } from "effector"

        const $store = createStore(null)
        const a = { b: { c: { $store } } }

        guard({ clock: [a.b.c.$store, a.b.c.$store], filter: Boolean })
        guard({ source: [a.b.c.$store, a.b.c.$store] })
      `,
      errors: [
        {
          messageId: "duplicate",
          data: { field: "clock", unit: "a.b.c.$store" },
          line: 6,
          column: 31,
          suggestions: [
            {
              messageId: "remove",
              data: { unit: "a.b.c.$store" },
              output: ts`
                import { guard, createStore } from "effector"

                const $store = createStore(null)
                const a = { b: { c: { $store } } }

                guard({ clock: [a.b.c.$store${/* after-fix spacing */ " "}], filter: Boolean })
                guard({ source: [a.b.c.$store, a.b.c.$store] })
              `,
            },
          ],
        },
        {
          messageId: "duplicate",
          data: { field: "source", unit: "a.b.c.$store" },
          line: 7,
          column: 32,
          suggestions: [
            {
              messageId: "remove",
              data: { unit: "a.b.c.$store" },
              output: ts`
                import { guard, createStore } from "effector"

                const $store = createStore(null)
                const a = { b: { c: { $store } } }

                guard({ clock: [a.b.c.$store, a.b.c.$store], filter: Boolean })
                guard({ source: [a.b.c.$store${/* after-fix spacing */ " "}] })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "multiline fix",
      code: ts`
        import { sample, createEvent } from "effector"

        const event = createEvent()

        sample({
          /* prettier-ignore */
          clock: [
            event,
            event,
          ],
        })
      `,
      errors: [
        {
          messageId: "duplicate",
          data: { field: "clock", unit: "event" },
          line: 9,
          column: 5,
          suggestions: [
            {
              messageId: "remove",
              data: { unit: "event" },
              output: ts`
                import { sample, createEvent } from "effector"

                const event = createEvent()

                sample({
                  /* prettier-ignore */
                  clock: [
                    event
                    ,
                  ],
                })
              `,
            },
          ],
        },
      ],
    },
  ],
})
