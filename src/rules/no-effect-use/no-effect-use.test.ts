import path from "node:path"

import { ts } from "@/shared/tag"
import { createRuleTester } from "@/testing/rule-tester"

import rule from "./no-effect-use"

const ruleTester = createRuleTester()

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("no-effect-use", rule, {
  valid: [
    {
      name: "unrelated use method",
      code: ts`
        const unit = { use: (handler: () => void) => handler() }

        unit.use(() => undefined)
      `,
    },
  ],
  invalid: [
    {
      name: "handler replacement",
      code: ts`
        import { createEffect } from "effector"

        const fetchFx = createEffect<string, void>()

        fetchFx.use(async () => undefined)
      `,
      errors: [{ messageId: "restricted", line: 5, column: 1 }],
    },
    {
      name: "handler access",
      code: ts`
        import { createEffect } from "effector"

        const fetchFx = createEffect<string, void>()

        const current = fetchFx.use.getCurrent()
        const replace = fetchFx.use
      `,
      errors: [
        { messageId: "restricted", line: 5, column: 17 },
        { messageId: "restricted", line: 6, column: 17 },
      ],
    },
    {
      name: "inline on creation",
      code: ts`
        import { createEffect } from "effector"

        const fetchFx = createEffect<string, void>().use(async () => undefined)
      `,
      errors: [{ messageId: "restricted", line: 3, column: 17 }],
    },
    {
      name: "nested in model",
      code: ts`
        import { createEffect } from "effector"

        const model = { fetchFx: createEffect<string, void>() }

        model.fetchFx.use(async () => undefined)
      `,
      errors: [{ messageId: "restricted", line: 5, column: 1 }],
    },
    {
      name: "onCreateEffect hook",
      code: ts`
        import { createDomain } from "effector"

        const domain = createDomain()

        domain.onCreateEffect((fx) => fx.use(async () => undefined))
      `,
      errors: [{ messageId: "restricted", line: 5, column: 31 }],
    },
    {
      name: "from fixture import",
      code: ts`
        import { fetchFx } from "${fixture("effect")}"

        fetchFx.use(async () => undefined)
      `,
      errors: [{ messageId: "restricted", line: 3, column: 1 }],
    },
  ],
})
