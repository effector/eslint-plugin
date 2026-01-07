import path from "node:path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-domain-unit-creators"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("no-domain-unit-creators", rule, {
  valid: [
    {
      name: "classic unit creators with option",
      code: ts`
        import { createDomain, createEvent, createStore, createEffect } from "effector"

        const domain = createDomain()

        const event = createEvent({ domain })
        const $store = createStore(0, { domain })
        const effectFx = createEffect({ domain })
      `,
    },
    {
      name: "unrelated call",
      code: ts`
        const obj = { createEvent: () => {} }
        obj.createEvent()
      `,
    },
  ],
  invalid: [
    {
      name: "event",
      code: ts`
        import { createDomain } from "effector"

        const domain = createDomain()

        const a = domain.createEvent()
        const b = domain.event()
      `,
      errors: [
        { messageId: "avoid", line: 5, column: 11, data: { method: "createEvent", factory: "createEvent" } },
        { messageId: "avoid", line: 6, column: 11, data: { method: "event", factory: "createEvent" } },
      ],
    },
    {
      name: "store",
      code: ts`
        import { createDomain } from "effector"

        const domain = createDomain()

        const $a = domain.createStore("alpha")
        const $b = domain.store(0, { name: "b" })
      `,
      errors: [
        { messageId: "avoid", line: 5, column: 12, data: { method: "createStore", factory: "createStore" } },
        { messageId: "avoid", line: 6, column: 12, data: { method: "store", factory: "createStore" } },
      ],
    },
    {
      name: "effect",
      code: ts`
        import { createDomain } from "effector"

        const domain = createDomain()

        const runFx = domain.createEffect()
        const someFx = domain.effect(() => console.log("run"))
      `,
      errors: [
        { messageId: "avoid", line: 5, column: 15, data: { method: "createEffect", factory: "createEffect" } },
        { messageId: "avoid", line: 6, column: 16, data: { method: "effect", factory: "createEffect" } },
      ],
    },
    {
      name: "domain",
      code: ts`
        import { createDomain } from "effector"

        const parent = createDomain()

        const first = parent.createDomain()
        const second = first.domain()
      `,
      errors: [
        { messageId: "avoid", line: 5, column: 15, data: { method: "createDomain", factory: "createDomain" } },
        { messageId: "avoid", line: 6, column: 16, data: { method: "domain", factory: "createDomain" } },
      ],
    },
    {
      name: "nested",
      code: ts`
        import { createDomain } from "effector"

        const model = { my: { domain: createDomain() } }

        const event = model.my.domain.event()
      `,
      errors: [{ messageId: "avoid", line: 5, column: 15, data: { method: "event", factory: "createEvent" } }],
    },
    {
      name: "from fixture import",
      code: ts`
        import { domain } from "${fixture("domain")}"

        const once = domain.event({ name: "once" })
      `,
      errors: [{ messageId: "avoid", line: 3, column: 14, data: { method: "event", factory: "createEvent" } }],
    },
  ],
})
