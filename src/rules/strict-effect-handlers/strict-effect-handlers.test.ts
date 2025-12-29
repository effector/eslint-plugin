import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./strict-effect-handlers"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("strict-effect-handlers", rule, {
  valid: [
    {
      name: "fx with fx",
      code: ts`
        import { createEffect } from "effector"

        const oneFx = createEffect()
        const twoFx = createEffect()

        const onlyEffectsFx = createEffect(async () => {
          await oneFx(1)
          await twoFx(1)
        })
      `,
    },
    {
      name: "fx with async fn",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        async function f2() {}

        const onlyFunctionsFx = createEffect(async () => (await f1(), await f2()))
      `,
    },
    {
      name: "async fn with fx",
      code: ts`
        import { createEffect } from "effector"

        const oneFx = createEffect()
        const twoFx = createEffect()

        async function functionWithEffects() {
          return { one: await oneFx(1), two: await twoFx(1) }
        }
      `,
    },
    {
      name: "async fn with async fn",
      code: ts`
        async function f1() {}
        async function f2() {}

        const functionWithFunctions = async () => [await f1(), await f2()]
      `,
    },
    {
      name: "no await",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        const oneFx = createEffect()

        const simple = async () => [f1(), oneFx(1)]
      `,
    },
    {
      name: "nested mix",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        const oneFx = createEffect()

        const simple = async () => {
          await f1(() => await oneFx())
        }
      `,
    },
  ],
  invalid: [
    {
      name: "fx with mixed statements",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        const oneFx = createEffect()

        const someFx = createEffect(async function handler() {
          await f1()
          await oneFx(1)
        })
      `,
      errors: [{ messageId: "mixed", line: 6, column: 29 }],
    },
    {
      name: "fx with mixed expressions",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        const oneFx = createEffect()

        const finalFx = createEffect(async function () {
          return { one: await f1(), two: await oneFx(1) }
        })
      `,
      errors: [{ messageId: "mixed", line: 6, column: 30 }],
    },
    {
      name: "fx with statements",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        const oneFx = createEffect()

        const finalFx = createEffect(async () => {
          await f1({ some: "arg", with: await oneFx() })
        })

        export { finalFx }
      `,
      errors: [{ messageId: "mixed", line: 6, column: 30 }],
    },
    {
      name: "async fn with expressions",
      code: ts`
        import { createEffect } from "effector"

        async function f1() {}
        const oneFx = createEffect()

        const simple = async () => [await f1(), await oneFx(1)]
      `,
      errors: [{ messageId: "mixed", line: 6, column: 16 }],
    },
    {
      name: "new promise",
      code: ts`
        import { createEffect } from "effector"

        const authUserFx = createEffect<void, void>()
        const sendMessageFx = createEffect<void, void>()

        const sendWithAuthFx = createEffect(async () => {
          await authUserFx()

          await new Promise((rs) => setTimeout(rs, 80))

          await sendMessageFx()
        })
      `,
      errors: [{ messageId: "mixed", line: 6, column: 37 }],
    },
  ],
})
