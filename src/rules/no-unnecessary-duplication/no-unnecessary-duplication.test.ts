import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-unnecessary-duplication"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-unnecessary-duplication", rule, {
  valid: [
    {
      name: "sample source: event",
      code: ts`
        import { sample } from "effector"
        sample({ source: event })
      `,
    },
    {
      name: "sample clock: event",
      code: ts`
        import { sample } from "effector"
        sample({ clock: event })
      `,
    },
    {
      name: "sample clock + source: different identifier",
      code: ts`
        import { sample } from "effector"
        sample({ clock: event, source: other })
      `,
    },
    {
      name: "sample clock + source: call expression",
      code: ts`
        import { sample, combine } from "effector"

        sample({ clock: sample({ clock: event }), source: sample({ clock: event }) })
        sample({ clock: combine({ a: $a }), source: combine({ a: $a }) })
      `,
    },
    {
      name: "sample clock + source: array [single different]",
      code: ts`
        import { sample } from "effector"
        sample({ clock: [event], source: [other] })
      `,
    },
    {
      name: "sample clock + source: array [multiple same]",
      code: ts`
        import { sample } from "effector"
        sample({ clock: [event, other], source: [event, other] })
      `,
    },
    {
      name: "sample clock + source: array [spread]",
      code: ts`
        import { sample, createEvent } from "effector"

        const events = [createEvent()]
        sample({ clock: [...events], source: [...events] })
      `,
    },
    {
      name: "sample clock + source: id + array ",
      code: ts`
        import { sample, createEvent } from "effector"

        const event = createEvent()
        sample({ clock: event, source: [event, event] })
      `,
    },
    {
      name: "sample clock + source: object (runtime error)",
      code: ts`
        import { sample, createEvent } from "effector"

        const a = createEvent()
        sample({ clock: { a }, source: { a } })
      `,
    },
    {
      name: "sample clock + source: different member key",
      code: ts`
        import { sample, createEvent } from "effector"

        const obj = { $a: createStore(0), $b: createStore(0) }
        sample({ clock: obj.$a, source: obj.$b })
      `,
    },
    {
      name: "sample clock + source: different member object",
      code: ts`
        import { sample, createEvent } from "effector"

        const first = { $a: createStore(0) }
        const second = { $a: createStore(0) }
        sample({ clock: first.$a, source: second.$a })
      `,
    },
    {
      name: "(false negative) sample clock + source: deep same member",
      code: ts`
        import { sample, createEvent } from "effector"

        sample({ clock: a.b.c.d.e.f, source: a.b.c.d.e.f })
      `,
    },
    {
      name: "sample clock + target",
      code: ts`
        import { sample } from "effector"
        sample({ clock: event, target: other })
      `,
    },
    {
      name: "sample source + target",
      code: ts`
        import { sample } from "effector"
        sample({ source: event, target: other })
      `,
    },
    {
      name: "sample clock array + two sources",
      code: ts`
        import { sample } from "effector"
        sample({ clock: [event], source: [event, other] })
      `,
    },
    {
      name: "guard source + store filter",
      code: ts`
        import { guard } from "effector"
        guard({ source: event, filter: $store })
      `,
    },
    {
      name: "guard source + function filter",
      code: ts`
        import { guard } from "effector"
        guard({ source: event, filter: (v) => v > 0 })
      `,
    },
    {
      name: "sample different node type",
      code: ts`
        import { sample, createStore } from "effector"

        sample({ clock: obj.$store, source: $store })
      `,
    },
    {
      name: "(false negative) member expression computed",
      code: ts`
        import { sample, createStore } from "effector"

        sample({ clock: obj.$store, source: obj["$store"] })
        sample({ clock: obj["$store"], source: obj.$store })
        sample({ clock: obj["$store"], source: obj["$store"] })
      `,
    },
  ],
  invalid: [
    {
      name: "sample clock + source: array [single same w/ formatting]",
      code: ts`
        import { sample } from "effector"

        // prettier-ignore
        sample({ source: [$store], clock: [
          $store
        ] })
      `,
      errors: [
        {
          messageId: "duplicate",
          line: 4,
          column: 8,
          suggestions: [
            {
              messageId: "removeClock",
              output: ts`
                import { sample } from "effector"

                // prettier-ignore
                sample({ source: [$store],  })
              `,
            },
            {
              messageId: "removeSource",
              output: ts`
                import { sample } from "effector"

                // prettier-ignore
                sample({  clock: [
                  $store
                ] })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "sample clock + source: same identifier",
      code: ts`
        import { sample } from "effector"
        sample({ source: $store, clock: $store })
      `,
      errors: [
        {
          messageId: "duplicate",
          line: 2,
          column: 8,
          suggestions: [
            {
              messageId: "removeClock",
              output: ts.noformat`
                import { sample } from "effector"
                sample({ source: $store,  })
              `,
            },
            {
              messageId: "removeSource",
              output: ts.noformat`
                import { sample } from "effector"
                sample({  clock: $store })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "sample clock + source: same identifier with array in source",
      code: ts`
        import { sample } from "effector"
        sample({ source: $store, clock: [$store] })
      `,
      errors: [
        {
          messageId: "duplicate",
          line: 2,
          column: 8,
          suggestions: [
            {
              messageId: "removeClock",
              output: ts.noformat`
                import { sample } from "effector"
                sample({ source: $store,  })
              `,
            },
            {
              messageId: "removeSource",
              output: ts.noformat`
                import { sample } from "effector"
                sample({  clock: [$store] })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "guard clock + source: same identifier",
      code: ts`
        import { guard } from "effector"
        guard({ clock: $store, source: $store, target: event })
      `,
      errors: [
        {
          messageId: "duplicate",
          line: 2,
          column: 7,
          suggestions: [
            {
              messageId: "removeClock",
              output: ts.noformat`
                import { guard } from "effector"
                guard({  source: $store, target: event })
              `,
            },
            {
              messageId: "removeSource",
              output: ts.noformat`
                import { guard } from "effector"
                guard({ clock: $store,  target: event })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "sample clock + source: same member expression",
      code: ts`
        import { sample, createStore } from "effector"

        sample({ clock: obj.$store, source: obj.$store })
        sample({ source: obj.some.nested.$store, clock: obj.some.nested.$store })
      `,
      errors: [
        {
          messageId: "duplicate",
          line: 3,
          column: 8,
          suggestions: [
            {
              messageId: "removeClock",
              output: ts.noformat`
                import { sample, createStore } from "effector"

                sample({  source: obj.$store })
                sample({ source: obj.some.nested.$store, clock: obj.some.nested.$store })
              `,
            },
            {
              messageId: "removeSource",
              output: ts.noformat`
                import { sample, createStore } from "effector"

                sample({ clock: obj.$store,  })
                sample({ source: obj.some.nested.$store, clock: obj.some.nested.$store })
              `,
            },
          ],
        },
        {
          messageId: "duplicate",
          line: 4,
          column: 8,
          suggestions: [
            {
              messageId: "removeClock",
              output: ts.noformat`
                import { sample, createStore } from "effector"

                sample({ clock: obj.$store, source: obj.$store })
                sample({ source: obj.some.nested.$store,  })
              `,
            },
            {
              messageId: "removeSource",
              output: ts.noformat`
                import { sample, createStore } from "effector"

                sample({ clock: obj.$store, source: obj.$store })
                sample({  clock: obj.some.nested.$store })
              `,
            },
          ],
        },
      ],
    },
  ],
})
