import path from "node:path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-getState"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("no-getState", rule, {
  valid: [
    {
      name: "unrelated store object",
      code: ts`
        const store = { getState: () => {} }

        const value = store.getState()
      `,
    },
    {
      name: "unrelated store class",
      code: ts`
        class Store {
          getState() {}
        }

        const store = new Store()
        const value = store.getState()
      `,
    },
  ],
  invalid: [
    {
      name: "conventional",
      code: ts`
        import { createStore } from "effector"
        const $store = createStore(null)

        const value = $store.getState()
      `,
      errors: [{ line: 4, column: 15, messageId: "named", data: { name: "$store" } }],
    },
    {
      name: "once nested object",
      code: ts`
        import { createStore } from "effector"

        const some = { store: createStore(null) }

        const value = some.store.getState()
      `,
      errors: [{ line: 5, column: 15, messageId: "named", data: { name: "store" } }],
    },
    {
      name: "deep nested object",
      code: ts`
        import { createStore } from "effector"

        const $data = createStore(null)
        const some = { store: { $data } }

        const value = some.store.$data.getState()
      `,
      errors: [{ line: 6, column: 15, messageId: "named", data: { name: "$data" } }],
    },
    {
      name: "anonymous expression",
      code: ts`
        import { createStore } from "effector"

        const value = createStore(null).getState()
      `,
      errors: [{ line: 3, column: 15, messageId: "anonymous" }],
    },
    {
      name: "domain store",
      code: ts`
        import { createDomain } from "effector"

        const domain = createDomain()
        const $store = domain.createStore(null)

        const value = $store.getState()
      `,
      errors: [{ line: 6, column: 15, messageId: "named", data: { name: "$store" } }],
    },
    {
      name: "imported store",
      code: ts`
        import { $store } from "${fixture("store")}"

        const value = $store.getState()
      `,
      errors: [{ line: 3, column: 15, messageId: "named", data: { name: "$store" } }],
    },
  ],
})
