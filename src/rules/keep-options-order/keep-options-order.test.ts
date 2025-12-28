import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./keep-options-order"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("keep-options-order", rule, {
  valid: [
    {
      name: "correct guard",
      code: ts`
        import { createEvent, createStore, guard } from "effector"

        const clock = createEvent()
        const source = createEvent()
        const filter = createStore()
        const target = createEvent()

        guard({ clock, source, filter, target })

        guard({ clock, source, filter })
        guard({ clock, source, filter, target })
        guard({ clock, source, target })
        guard({ clock, filter, target })
        guard({ source, filter, target })

        guard({ clock, source })

        guard({ clock, filter })
        guard({ clock, filter, target })

        guard({ filter, target })
        guard({ filter })
      `,
    },
    {
      name: "correct sample",
      code: ts`
        import { createEvent, createStore, sample } from "effector"

        const clock = createEvent()
        const source = createEvent()
        const filter = createStore()
        const fn = () => null
        const target = createEvent()

        sample({ clock, source, filter, fn, target })

        sample({ clock, source, filter, fn })
        sample({ clock, source, filter, target })
        sample({ clock, source, fn, target })
        sample({ clock, filter, fn, target })
        sample({ source, filter, fn, target })

        sample({ clock, source, filter })
        sample({ clock, source, fn })
        sample({ clock, source, target })

        sample({ clock, filter, fn })
        sample({ clock, filter, target })

        sample({ source, filter, fn })
        sample({ source, filter, target })

        sample({ filter, fn, target })
        sample({ filter, fn })

        sample({ filter, fn, greedy })
        sample({ filter, fn, batch })

        sample({ filter, fn, batch, name })
      `,
    },
  ],
  invalid: [
    {
      name: "wrong guard order",
      code: ts`
        import { createEvent, createStore, guard } from "effector"

        const clock = createEvent()
        const source = createEvent()
        const filter = createStore()
        const target = createEvent()

        guard({ filter, clock, source, target })
      `,
      errors: [
        {
          messageId: "invalidOrder",
          line: 8,
          data: {
            correctOrder: "clock -> source -> filter -> target",
            currentOrder: "filter -> clock -> source -> target",
          },
          suggestions: [
            {
              messageId: "changeOrder",
              output: ts`
                import { createEvent, createStore, guard } from "effector"

                const clock = createEvent()
                const source = createEvent()
                const filter = createStore()
                const target = createEvent()

                guard({ clock, source, filter, target })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "wrong sample order",
      code: ts`
        import { createEvent, createStore, sample } from "effector"

        const clock = createEvent()
        const source = createEvent()
        const filter = createStore()
        const fn = () => null
        const target = createEvent()

        sample({ source, clock, filter, fn, batch: true, target })
      `,
      errors: [
        {
          messageId: "invalidOrder",
          line: 9,
          data: {
            correctOrder: "clock -> source -> filter -> fn -> target -> batch",
            currentOrder: "source -> clock -> filter -> fn -> batch -> target",
          },
          suggestions: [
            {
              messageId: "changeOrder",
              output: ts`
                import { createEvent, createStore, sample } from "effector"

                const clock = createEvent()
                const source = createEvent()
                const filter = createStore()
                const fn = () => null
                const target = createEvent()

                sample({ clock, source, filter, fn, target, batch: true })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "classic sample",
      code: ts`
        import { sample } from "effector"
        sample({ source, clock, fn, target })
      `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: ts`
                import { sample } from "effector"
                sample({ clock, source, fn, target })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "sample function expression",
      code: ts`
        import { sample } from "effector"
        // prettier-ignore
        sample({
          fn() {
            return null
          },
          clock,
          target,
        })
      `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: ts`
                import { sample } from "effector"
                // prettier-ignore
                sample({ clock, fn() {
                    return null
                  }, target })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "sample with clock.map",
      code: ts`
        import { sample } from "effector"
        sample({ fn, clock: event.map(() => null), target })
      `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: ts`
                import { sample } from "effector"
                sample({ clock: event.map(() => null), fn, target })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "sample with source combine",
      code: ts`
        import { sample } from "effector"
        sample({ source: combine({ a: $a }), clock, target })
      `,
      errors: [
        {
          messageId: "invalidOrder",
          suggestions: [
            {
              messageId: "changeOrder",
              output: ts`
                import { sample } from "effector"
                sample({ clock, source: combine({ a: $a }), target })
              `,
            },
          ],
        },
      ],
    },
  ],
})
