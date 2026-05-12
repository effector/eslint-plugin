import path from "path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./enforce-effect-naming-convention"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("enforce-effect-naming-convention", rule, {
  valid: [
    {
      name: "classic",
      code: ts`
        import { createEffect } from "effector"

        const baseFx = createEffect()
      `,
    },
    {
      name: "attach",
      code: ts`
        import { createEffect, attach } from "effector"

        const baseFx = createEffect()
        const attachedFx = attach({ effect: baseFx })
      `,
    },
    {
      name: "from factory",
      code: ts`
        import { createEffect } from "effector"

        const createLogEffect = () => createEffect(console.log)

        const customFx = createLogEffect()
      `,
    },
    {
      name: "from import",
      code: ts`
        import { attachedFx } from "${fixture("effect")}"

        const renamedFx = attachedFx
      `,
    },
    {
      name: "effect as destructured argument",
      code: ts`
        import { type Effect, createEffect } from "effector"

        type QueryParams = { runFx: Effect<void, void> }

        const alpha = ({ runFx = createEffect() }: QueryParams) => undefined
        const beta = ({ runFx }: QueryParams) => undefined
        const gamma = (runFx = createEffect()) => undefined
      `,
    },
    {
      name: "shape destructuring -> ident",
      code: ts`
        import { createEffect } from "effector"

        const { fooFx } = { fooFx: createEffect() }
        const { foo: fooFx } = { foo: createEffect() }
      `,
    },
    {
      name: "shape destructuring -> assignment",
      code: ts`
        import { createEffect } from "effector"

        const { foo: fooFx = createEffect() } = { foo: null }
        const { bar: barFx = createEffect() } = { bar: createEffect() }
      `,
    },
    {
      name: "array destructuring -> ident",
      code: ts`
        import { createEffect, attach } from "effector"

        const baseFx = createEffect()
        const [firstFx] = [createEffect()]
        const [secondFx, thirdFx] = [attach({ effect: baseFx }), createEffect()]
      `,
    },
    {
      name: "array destructuring -> assignment",
      code: ts`
        import { createEffect } from "effector"

        const [firstFx = createEffect()] = [null]
        const [secondFx = createEffect()] = [createEffect()]
      `,
    },
    {
      name: "mixed nested destructuring -> assignment",
      code: ts`
        import { createEffect } from "effector"

        const {
          first: [secondFx = createEffect()],
        } = { first: [null] }
      `,
    },
    {
      name: "property in argument context",
      code: ts`
        import { createEffect, attach } from "effector"

        const sourceFx = createEffect()

        const attachedFx = attach({ effect: sourceFx })
        const grouped = { alpha: createEffect(), beta: attach({ effect: sourceFx }) }
      `,
    },
  ],
  invalid: [
    {
      name: "classic",
      code: ts`
        import { createEffect } from "effector"

        const plain = createEffect()
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "plain", fixed: "plainFx" },
              output: ts`
                import { createEffect } from "effector"

                const plainFx = createEffect()
              `,
            },
          ],
        },
      ],
    },
    {
      name: "attach",
      code: ts`
        import { createEffect, attach } from "effector"

        const baseFx = createEffect()
        const attached = attach({ effect: baseFx })
      `,
      errors: [
        {
          messageId: "invalid",
          line: 4,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "attached", fixed: "attachedFx" },
              output: ts`
                import { createEffect, attach } from "effector"

                const baseFx = createEffect()
                const attachedFx = attach({ effect: baseFx })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from factory",
      code: ts`
        import { createEffect } from "effector"

        const createLogEffect = () => createEffect(console.log)

        const customEffect = createLogEffect()
      `,
      errors: [
        {
          messageId: "invalid",
          line: 5,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "customEffect", fixed: "customEffectFx" },
              output: ts`
                import { createEffect } from "effector"

                const createLogEffect = () => createEffect(console.log)

                const customEffectFx = createLogEffect()
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from import",
      code: ts`
        import { attachedFx } from "${fixture("effect")}"

        const renamed = attachedFx
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "renamed", fixed: "renamedFx" },
              output: ts`
                import { attachedFx } from "${fixture("effect")}"

                const renamedFx = attachedFx
              `,
            },
          ],
        },
      ],
    },
    {
      name: "variable with type annotation",
      code: ts`
        import { createEffect, type Effect } from "effector"

        const fetch: Effect<void, void> = createEffect()
      `,
      errors: [{ messageId: "invalid", line: 3, data: { current: "fetch", fixed: "fetchFx" } }],
    },
    {
      name: "shape destructuring",
      code: ts`
        import { createEffect } from "effector"

        const { first } = { first: createEffect() }
        const { fooFx: first } = { fooFx: createEffect() }
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "firstFx" },
              output: ts`
                import { createEffect } from "effector"

                const { first: firstFx } = { first: createEffect() }
                const { fooFx: first } = { fooFx: createEffect() }
              `,
            },
          ],
        },
        {
          messageId: "invalid",
          line: 4,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "firstFx" },
              output: ts`
                import { createEffect } from "effector"

                const { first } = { first: createEffect() }
                const { fooFx: firstFx } = { fooFx: createEffect() }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "shape destructuring with assignment",
      code: ts`
        import { createEffect, attach } from "effector"

        const sourceFx = createEffect()

        const { first = createEffect() } = { first: sourceFx }
        const { second: beta = attach({ effect: sourceFx }) } = { second: sourceFx }
      `,
      errors: [
        {
          messageId: "invalid",
          line: 5,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "firstFx" },
              output: ts`
                import { createEffect, attach } from "effector"

                const sourceFx = createEffect()

                const { first: firstFx = createEffect() } = { first: sourceFx }
                const { second: beta = attach({ effect: sourceFx }) } = { second: sourceFx }
              `,
            },
          ],
        },
        {
          messageId: "invalid",
          line: 6,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "beta", fixed: "betaFx" },
              output: ts`
                import { createEffect, attach } from "effector"

                const sourceFx = createEffect()

                const { first = createEffect() } = { first: sourceFx }
                const { second: betaFx = attach({ effect: sourceFx }) } = { second: sourceFx }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "array destructuring",
      code: ts`
        import { createEffect } from "effector"

        const [first, second = createEffect()] = [createEffect()]
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "firstFx" },
              output: ts`
                import { createEffect } from "effector"

                const [firstFx, second = createEffect()] = [createEffect()]
              `,
            },
          ],
        },
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "second", fixed: "secondFx" },
              output: ts`
                import { createEffect } from "effector"

                const [first, secondFx = createEffect()] = [createEffect()]
              `,
            },
          ],
        },
      ],
    },
    {
      name: "function parameter nested inferred destructuring",
      code: ts`
        import { type Effect } from "effector"

        type Config = { effect: Effect<void, void> }
        function test({ config: { effect } }: { config: Config }) {}
      `,
      errors: [
        {
          messageId: "invalid",
          line: 4,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "effect", fixed: "effectFx" },
              output: ts`
                import { type Effect } from "effector"

                type Config = { effect: Effect<void, void> }
                function test({ config: { effect: effectFx } }: { config: Config }) {}
              `,
            },
          ],
        },
      ],
    },
    {
      name: "function parameter inferred",
      code: ts`
        import { type Effect } from "effector"

        function alpha(effect: Effect<void, void>) {}
        const beta = (effect: Effect<void, void>) => {}
      `,
      errors: [
        { messageId: "invalid", line: 3, data: { current: "effect", fixed: "effectFx" } },
        { messageId: "invalid", line: 4, data: { current: "effect", fixed: "effectFx" } },
      ],
    },
  ],
})
