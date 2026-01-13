import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-guard"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-guard", rule, {
  valid: [
    {
      name: "sample",
      code: ts`
        import { sample } from "effector"
        sample({ clock: eventOne, target: eventTwo })
      `,
    },
    {
      name: "guard from other package",
      code: ts`
        import { guard } from "some-other-package"
        guard({ clock: eventOne, target: eventTwo })
      `,
    },
    {
      name: "malformed call",
      code: ts`
        import { guard } from "effector"
        guard()
        guard(1, 2, 3)
      `,
    },
  ],
  invalid: [
    {
      name: "incomplete call",
      code: ts`
        import { guard } from "effector"
        guard({ clock: eventOne })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard, sample } from "effector"
                sample({ clock: eventOne })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "clock + target",
      code: ts`
        import { guard } from "effector"
        guard({ clock: eventOne, target: eventTwo, filter: Boolean })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard, sample } from "effector"
                sample({ clock: eventOne, filter: Boolean, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "clock + target.prepend",
      code: ts`
        import { guard } from "effector"
        guard({ clock: eventOne, target: eventTwo.prepend((v) => v.length), filter: (v) => v.length > 0 })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard, sample } from "effector"
                sample({ clock: eventOne, filter: (v) => v.length > 0, fn: (v) => v.length, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "clock + target.prepend (deep)",
      code: ts`
        import { guard } from "effector"
        guard({ clock: eventOne, target: serviceOne.featureOne.eventTwo.prepend((v) => v.length), filter: $store })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard, sample } from "effector"
                sample({ clock: eventOne, filter: $store, fn: (v) => v.length, target: serviceOne.featureOne.eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "clock merge + target",
      code: ts`
        import { guard } from "effector"
        guard({ source: $someStore, clock: merge(eventOne, eventOneOne), target: eventTwo, filter: Boolean })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard, sample } from "effector"
                sample({ clock: merge(eventOne, eventOneOne), source: $someStore, filter: Boolean, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "clock -> variable",
      code: ts`
        import { sample, guard } from "effector"
        const target = guard({ clock: fFx.failData, filter: isAborted })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { sample, guard } from "effector"
                const target = sample({ clock: fFx.failData, filter: isAborted })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "clock, config -> variable with default import",
      code: ts`
        import SmthDefault, { guard, forward } from "effector"
        const target = guard(someFx.failData, { filter: isAborted })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import SmthDefault, { guard, sample, forward } from "effector"
                const target = sample({ clock: someFx.failData, filter: isAborted })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "renamed import",
      code: ts`
        import { guard as legacy, sample as link } from "effector"
        legacy({ clock: eventOne, filter: Boolean })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard as legacy, sample as link } from "effector"
                link({ clock: eventOne, filter: Boolean })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "nested call",
      code: ts`
        import { guard, sample } from "effector"

        const fn = (v: string) => v.length
        guard({ clock: event, target: sample({ target: target.prepend(fn), fn: (l) => l * 2 }) })
      `,
      errors: [
        {
          messageId: "noGuard",
          line: 4,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { guard, sample } from "effector"

                const fn = (v: string) => v.length
                sample({ clock: event, target: sample({ target: target.prepend(fn), fn: (l) => l * 2 }) })
              `,
            },
          ],
        },
      ],
    },
  ],
})
