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
      name: "prefix: mapping",
      code: ts`
        import { createStore, combine } from "effector"

        const $a = createStore(null)
        const $b = createStore(null)

        const $combined = combine($a, $b)
        const $mapped = $a.map((value) => value === null)
      `,
      options: [prefix],
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
    {
      name: "prefix: store as destructured argument",
      code: ts`
        import { type Store, createStore } from "effector"

        type QueryParams = { $body: Store<unknown> }

        const alpha = ({ $body = createStore({}) }: QueryParams) => undefined
        const beta = ({ $body }: QueryParams) => undefined
        const gamma = ($body = createStore(null)) => undefined
      `,
    },
    {
      name: "prefix: shape destructuring -> ident",
      code: ts`
        import { createStore } from "effector"

        const { $first } = { $first: createStore(0) }
        const { second: $second } = { second: createStore(0) }
      `,
    },
    {
      name: "prefix: shape destructuring -> assignment",
      code: ts`
        import { createStore } from "effector"

        const { first: $first = createStore(0) } = { first: null }
        const { second: $second = createStore(0) } = { second: createStore(1) }
      `,
    },
    {
      name: "postfix: array destructuring -> ident",
      code: ts`
        import { createStore } from "effector"

        const [first$] = [createStore(0)]
        const [second$, third$] = [combine($first, (x) => x), restore($first.updates, null)]
      `,
      options: [postfix],
    },
    {
      name: "postfix: array destructuring -> assignment",
      code: ts`
        import { createStore } from "effector"

        const [first$ = createStore(0)] = [null]
        const [second$ = createStore(0)] = [createStore(1)]
      `,
      options: [postfix],
    },
    {
      name: "postfix: mixed nested destructuring -> assignment",
      code: ts`
        import { createStore } from "effector"

        const {
          first: [second$ = createStore(0)],
        } = { first: [null] }
      `,
      options: [postfix],
    },
    {
      name: "property in argument context",
      code: ts`
        import { createStore, combine } from "effector"

        const $source = createStore(0)

        const $combined = combine({ alpha: $source, beta: [$source], gamma: { delta: $source } })
        const grouped = { alpha: createStore(0), beta: combine($source, (x) => x) }
      `,
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
      name: "variable with type annotation",
      code: ts`
        import { createStore, type Store } from "effector"

        const store: Store<unknown> = createStore(null)
      `,
      errors: [{ messageId: "invalid", line: 3, data: { current: "store", convention: "prefix", fixed: "$store" } }],
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
          data: { current: "$just", convention: "postfix", fixed: "just$" },
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
    {
      name: "shape destructuring",
      code: ts`
        import { createStore } from "effector"

        const { first } = { first: createStore(0) }
        const { $first: first } = { $first: createStore(0) }
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "$first" },
              output: ts`
                import { createStore } from "effector"

                const { first: $first } = { first: createStore(0) }
                const { $first: first } = { $first: createStore(0) }
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
              data: { current: "first", fixed: "$first" },
              output: ts`
                import { createStore } from "effector"

                const { first } = { first: createStore(0) }
                const { $first: $first } = { $first: createStore(0) }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "shape destructuring with assignment",
      code: ts`
        import { createStore, combine } from "effector"

        const $source = createStore(0)

        const { first = createStore(0) } = { first: $source }
        const { second: beta = combine($source, (x) => x) } = { second: $source }
      `,
      errors: [
        {
          messageId: "invalid",
          line: 5,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "$first" },
              output: ts`
                import { createStore, combine } from "effector"

                const $source = createStore(0)

                const { first: $first = createStore(0) } = { first: $source }
                const { second: beta = combine($source, (x) => x) } = { second: $source }
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
              data: { current: "beta", fixed: "$beta" },
              output: ts`
                import { createStore, combine } from "effector"

                const $source = createStore(0)

                const { first = createStore(0) } = { first: $source }
                const { second: $beta = combine($source, (x) => x) } = { second: $source }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "array destructuring",
      code: ts`
        import { createStore } from "effector"

        const [first, second = createStore(0)] = [createStore(0)]
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "first", fixed: "$first" },
              output: ts`
                import { createStore } from "effector"

                const [$first, second = createStore(0)] = [createStore(0)]
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
              data: { current: "second", fixed: "$second" },
              output: ts`
                import { createStore } from "effector"

                const [first, $second = createStore(0)] = [createStore(0)]
              `,
            },
          ],
        },
      ],
    },
    {
      name: "function parameter nested inferred destructuring",
      code: ts`
        import { type Store } from "effector"

        type Config = { store: Store<unknown> }
        function test({ config: { store } }: { config: Config }) {}
      `,
      errors: [
        {
          messageId: "invalid",
          line: 4,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "store", fixed: "$store" },
              output: ts`
                import { type Store } from "effector"

                type Config = { store: Store<unknown> }
                function test({ config: { store: $store } }: { config: Config }) {}
              `,
            },
          ],
        },
      ],
    },
    {
      name: "function parameter inferred",
      code: ts`
        import { type Store, type StoreWritable } from "effector"

        function alpha(store: Store<unknown>) {}
        const beta = (store: StoreWritable<unknown>) => {}
      `,
      errors: [
        { messageId: "invalid", line: 3, data: { current: "store", convention: "prefix", fixed: "$store" } },
        { messageId: "invalid", line: 4, data: { current: "store", convention: "prefix", fixed: "$store" } },
      ],
    },
  ],
})
