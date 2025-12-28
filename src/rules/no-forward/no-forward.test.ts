import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-forward"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-forward", rule, {
  valid: [
    {
      name: "sample",
      code: ts`
        import { sample } from "effector"
        sample({ clock: eventOne, target: eventTwo })
      `,
    },
    {
      name: "forward from other package",
      code: ts`
        import { forward } from "some-other-package"
        forward({ from: eventOne, to: eventTwo })
      `,
    },
    {
      name: "malformed call",
      code: ts`
        import { forward } from "effector"
        forward()
        forward(1, 2, 3)
      `,
    },
  ],
  invalid: [
    {
      name: "incomplete call",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "classic",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne, to: eventTwo })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from.prepend (preserve)",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne.prepend((v) => v.length), to: eventTwo })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne.prepend((v) => v.length), target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from.map (-> fn)",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne.map((v) => v.length), to: eventTwo })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne, fn: (v) => v.length, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from.map (deep -> fn)",
      code: ts`
        import { forward } from "effector"
        forward({ from: serviceOne.featureOne.eventOne.map((v) => v.length), to: eventTwo })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: serviceOne.featureOne.eventOne, fn: (v) => v.length, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "to.prepend (-> fn)",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne, to: eventTwo.prepend((v) => v.length) })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne, fn: (v) => v.length, target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "to.prepend (deep -> fn)",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne, to: serviceOne.featureOne.eventTwo.prepend((v) => v.length) })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne, fn: (v) => v.length, target: serviceOne.featureOne.eventTwo })
              `,
            },
          ],
        },
      ],
    },

    {
      name: "from merge",
      code: ts`
        import { forward } from "effector"
        forward({ from: merge(eventOne, eventOneOne), to: eventTwo })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: merge(eventOne, eventOneOne), target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "to array",
      code: ts`
        import { sample, forward } from "effector"
        forward({ from: eventOne, to: [eventTwo, eventTwoTwo] })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { sample, forward } from "effector"
                sample({ clock: eventOne, target: [eventTwo, eventTwoTwo] })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from.map + to.prepend (prepend priority)",
      code: ts`
        import { forward } from "effector"
        forward({ from: eventOne.map((v) => v.length), to: eventTwo.prepend((v) => v.toString()) })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"
                sample({ clock: eventOne.map((v) => v.length), fn: (v) => v.toString(), target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "default import",
      code: ts`
        import SmthDefault, { forward } from "effector"
        forward({ from: someFx.failData, to: event })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import SmthDefault, { forward, sample } from "effector"
                sample({ clock: someFx.failData, target: event })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "renamed import",
      code: ts`
        import { forward as legacy, sample as link } from "effector"
        legacy({ from: a, to: b })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 2,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward as legacy, sample as link } from "effector"
                link({ clock: a, target: b })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "nested call",
      code: ts`
        import { forward, sample } from "effector"

        const fn = (v: string) => v.length
        forward({ from: sample({ clock: eventOne.map(fn), fn: (l) => l * 2 }), to: eventTwo })
      `,
      errors: [
        {
          messageId: "noForward",
          line: 4,
          suggestions: [
            {
              messageId: "replaceWithSample",
              output: ts`
                import { forward, sample } from "effector"

                const fn = (v: string) => v.length
                sample({ clock: sample({ clock: eventOne.map(fn), fn: (l) => l * 2 }), target: eventTwo })
              `,
            },
          ],
        },
      ],
    },
  ],
})
