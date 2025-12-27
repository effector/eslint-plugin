import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./require-pickup-in-persist"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("require-pickup-in-persist", rule, {
  valid: [
    {
      name: "core package with pickup",
      code: ts`
        import { createStore, createEvent } from "effector"
        import { persist } from "effector-storage"
        import { local as localAdapter } from "effector-storage/local"

        const $store = createStore("example")
        const pickup = createEvent()

        persist({ store: $store, pickup, adapter: localAdapter })
      `,
    },
    {
      name: "local storage with pickup",
      code: ts`
        import { createStore, createEvent } from "effector"
        import { persist } from "effector-storage/local"

        const $store = createStore("example")
        const updated = createEvent()

        const appStarted = createEvent()

        persist({ source: $store.updates, target: updated, pickup: appStarted, key: "store", keyPrefix: "local" })
      `,
    },
    {
      name: "query package with pickup",
      code: ts`
        import { createStore, createEvent } from "effector"
        import { persist as persistQuery } from "effector-storage/query"

        const $store = createStore("example")
        const pickup = createEvent()

        persistQuery({ store: $store, pickup })
      `,
    },
    {
      name: "scoped package with pickup",
      code: ts`
        import { createStore, createEvent } from "effector"
        import { persist as persistAsync } from "@effector-storage/react-native-async-storage"

        const $store = createStore("example")
        const pickup = createEvent()

        persistAsync({ store: $store, pickup })
      `,
    },
    {
      name: "other packages",
      code: ts`
        import { createStore } from "effector"
        import { persist } from "other-persist"
        import { persist as persistNested } from "other-persist/nested"

        const $store = createStore("example")

        persist({ store: $store })
        persistNested({ store: $store })
      `,
    },
    {
      name: "skips misconfigured calls",
      code: ts`
        import { createStore } from "effector"

        import { persist } from "effector-storage"

        const randomCall = () => ({ store: createStore() })

        persist()
        persist("invalid")
        persist(randomCall())
      `,
    },
  ],
  invalid: [
    {
      name: "core package without pickup",
      code: ts`
        import { createStore } from "effector"
        import { persist } from "effector-storage"

        const $store = createStore("example")

        persist({ store: $store, adapter: localAdapter })
      `,
      errors: [{ line: 6, column: 1, messageId: "missing" }],
    },
    {
      name: "scoped package without pickup",
      code: ts`
        import { createStore } from "effector"
        import { persist as persistAsync } from "@effector-storage/react-native-async-storage"

        const $store = createStore("example")

        persistAsync({ store: $store })
      `,
      errors: [{ line: 6, column: 1, messageId: "missing" }],
    },
    {
      name: "local storage without pickup",
      code: ts`
        import { createStore, createEvent } from "effector"
        import { persist } from "effector-storage/local"

        const $store = createStore("example")
        const updated = createEvent()

        persist({ source: $store, target: updated, key: "store", keyPrefix: "local" })
      `,
      errors: [{ line: 7, column: 1, messageId: "missing" }],
    },
    {
      name: "unrelated pickup",
      code: ts`
        import { combine } from "effector"
        import { persist } from "effector-storage/local"

        persist({
          store: combine({ pickup: true }),
          param: { pickup: "yes" },
        })
      `,
      errors: [{ line: 4, column: 1, messageId: "missing" }],
    },
  ],
})
