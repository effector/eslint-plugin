import path from "path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./enforce-store-naming-convention"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

const prefix = { mode: "prefix" } as const
const postfix = { mode: "postfix" } as const

ruleTester.run("enforce-store-naming-convention", rule, {
  valid: [
    {
      name: "prefix: plain store creation",
      code: ts`
        import { createStore } from "effector"

        const $just = createStore(null)
      `,
      options: [prefix],
    },
    {
      name: "prefix: restore",
      code: ts`
        import { restore, createEvent } from "effector"

        const source = createEvent()
        const $restored = restore(source, null)
      `,
      options: [prefix],
    },
    {
      name: "postfix: restore",
      code: ts`
        import { restore, createEvent } from "effector"

        const source = createEvent()
        const restored$ = restore(source, null)
      `,
      options: [postfix],
    },
    {
      name: "prefix: combine",
      code: ts`
        import { createStore, combine } from "effector"

        const $a = createStore(null)
        const $b = createStore(null)

        const $combined = combine($a, $b)
      `,
      options: [prefix],
    },
    {
      name: "prefix: map",
      code: ts`
        import { createStore } from "effector"

        const $store = createStore([])
        const $mapped = $store.map((values) => values.length)
      `,
    },
    {
      name: "prefix: renamed",
      code: ts`
        import { $store } from "${fixture("store")}"

        const $renamed = $store
      `,
    },
    {
      name: "postfix: renamed",
      code: ts`
        import { $store } from "${fixture("store")}"

        const renamed$ = $store
      `,
      options: [postfix],
    },
    {
      name: "prefix: single symbol",
      code: ts`
        import { createStore } from "effector"

        const $ = createStore(0)
      `,
    },
    {
      name: "postfix: single symbol",
      code: ts`
        import { createStore } from "effector"

        const $ = createStore(0)
      `,
      options: [postfix],
    },
  ],
  invalid: [
    {
      name: "from factory",
      code: ts`
        import { createStore } from "effector"

        const createCustomStore = () => createStore(null)

        const just = createCustomStore()
      `,
      errors: [
        {
          messageId: "invalid",
          line: 5,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "just", fixed: "$just" },
              output: ts`
                import { createStore } from "effector"

                const createCustomStore = () => createStore(null)

                const $just = createCustomStore()
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from other file",
      code: ts`
        import { $store } from "${fixture("store")}"

        const renamed = $store
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "renamed", fixed: "$renamed" },
              output: ts`
                import { $store } from "${fixture("store")}"

                const $renamed = $store
              `,
            },
          ],
        },
      ],
    },
    {
      name: "prefix when configured for postfix",
      code: ts`
        import { createStore } from "effector"
        const $just = createStore(null)
      `,
      options: [postfix],
      errors: [
        {
          messageId: "invalid",
          line: 2,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "$just", fixed: "just$" },
              output: ts`
                import { createStore } from "effector"
                const just$ = createStore(null)
              `,
            },
          ],
        },
      ],
    },
    {
      name: "postfix suggestion",
      code: ts`
        import { createEvent, createStore } from "effector"

        const add = createEvent()
        const sum = createStore(0).on(add, (s) => s + 1)
      `,
      options: [postfix],
      errors: [
        {
          messageId: "invalid",
          line: 4,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "sum", fixed: "sum$" },
              output: ts`
                import { createEvent, createStore } from "effector"

                const add = createEvent()
                const sum$ = createStore(0).on(add, (s) => s + 1)
              `,
            },
          ],
        },
      ],
    },
  ],
})
