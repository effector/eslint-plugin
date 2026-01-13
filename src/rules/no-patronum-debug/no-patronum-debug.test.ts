import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./no-patronum-debug"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

ruleTester.run("no-patronum-debug", rule, {
  valid: [
    {
      name: "unrelated function",
      code: ts`
        import { createStore } from "effector"

        const debug = (...args) => ({ ...args })
        const $store = createStore({})

        debug({ test: "debug" })
        debug({ store: $store })
      `,
    },
    {
      // https://github.com/effector/eslint-plugin/issues/127
      name: "unrelated styled component",
      code: ts`const Anchor = styled("a")({})`,
    },
    {
      name: "debug from other package",
      code: ts`
        import { createStore } from "effector"
        import { debug } from "some-other-package"

        const $store = createStore({})
        debug({ store: $store })
      `,
    },
  ],
  invalid: [
    {
      name: "simple debug call",
      code: ts`
        import { createStore } from "effector"
        import { debug } from "patronum"

        const $store = createStore({ fullname: "John Due" })
        debug($store)
      `,
      errors: [
        {
          messageId: "unexpected",
          line: 5,
          suggestions: [
            {
              messageId: "remove",
              output:
                ts`
                  import { createStore } from "effector"
                  import { debug } from "patronum"

                  const $store = createStore({ fullname: "John Due" })
                ` + /* formatting */ "\n",
            },
          ],
        },
      ],
    },
    {
      name: "nested debug call",
      code: ts`
        import { createStore } from "effector"
        import { debug } from "patronum"

        const $store = createStore({ fullname: "John Due" })

        function logStore() {
          return debug($store)
        }
      `,
      errors: [
        {
          messageId: "unexpected",
          line: 7,
          suggestions: [
            {
              messageId: "remove",
              output: ts`
                import { createStore } from "effector"
                import { debug } from "patronum"

                const $store = createStore({ fullname: "John Due" })

                function logStore() {
                  return undefined
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "debug as argument",
      code: ts`
        import { createStore } from "effector"
        import { debug } from "patronum"

        const $store = createStore({ fullname: "John Due" })

        console.log({ value: debug($store) })
      `,
      errors: [
        {
          messageId: "unexpected",
          line: 6,
          suggestions: [
            {
              messageId: "remove",
              output: ts`
                import { createStore } from "effector"
                import { debug } from "patronum"

                const $store = createStore({ fullname: "John Due" })

                console.log({ value: undefined })
              `,
            },
          ],
        },
      ],
    },
    {
      name: "debug.registerScope",
      code: ts`
        import { fork, createStore } from "effector"
        import { debug } from "patronum"

        const $count = createStore(0)
        const scope = fork({ values: [[$count, 42]] })

        debug.registerScope(scope, { name: "scope_42" })
      `,
      errors: [
        {
          messageId: "unexpected",
          line: 7,
          suggestions: [
            {
              messageId: "remove",
              output:
                ts`
                  import { fork, createStore } from "effector"
                  import { debug } from "patronum"

                  const $count = createStore(0)
                  const scope = fork({ values: [[$count, 42]] })
                ` + /* formatting */ "\n\n",
            },
          ],
        },
      ],
    },
    {
      name: "renamed debug import",
      code: ts`
        import { createEvent } from "effector"
        import { debug as magic } from "patronum"

        const event = createEvent()
        magic(event)
      `,
      errors: [
        {
          messageId: "unexpected",
          line: 5,
          suggestions: [
            {
              messageId: "remove",
              output:
                ts`
                  import { createEvent } from "effector"
                  import { debug as magic } from "patronum"

                  const event = createEvent()
                ` + /* formatting */ "\n",
            },
          ],
        },
      ],
    },
    {
      name: "debug from subpackage",
      code: ts`
        import { createStore } from "effector"
        import { debug } from "patronum/debug"

        const $store = createStore({ value: 42 })
        debug($store)
      `,
      errors: [
        {
          messageId: "unexpected",
          line: 5,
          suggestions: [
            {
              messageId: "remove",
              output:
                ts`
                  import { createStore } from "effector"
                  import { debug } from "patronum/debug"

                  const $store = createStore({ value: 42 })
                ` + /* formatting */ "\n",
            },
          ],
        },
      ],
    },
  ],
})
