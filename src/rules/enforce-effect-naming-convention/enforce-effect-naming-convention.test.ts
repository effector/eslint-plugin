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
  ],
})
