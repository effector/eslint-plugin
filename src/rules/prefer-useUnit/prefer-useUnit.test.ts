import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { tsx } from "@/shared/tag"

import rule from "./prefer-useUnit"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.tsx"], defaultProject: "tsconfig.fixture.json" },
      ecmaFeatures: { jsx: true },
    },
  },
})

ruleTester.run("prefer-useUnit", rule, {
  valid: [
    {
      name: "several useUnit",
      code: tsx`
        import React from "react"
        import { createEffect, createEvent, createStore } from "effector"
        import { useUnit } from "effector-react"

        const $store = createStore(null)
        const event = createEvent()
        const effectFx = createEffect()

        function Component() {
          const value = useUnit($store)
          const eventFn = useUnit(event)
          const effectFn = useUnit(effectFx)

          return (
            <button onClick={() => eventFn()} onFocus={effectFn}>
              {value}
            </button>
          )
        }
      `,
    },
    {
      name: "useUnit tuple",
      code: tsx`
        import React from "react"
        import { createEvent, createStore } from "effector"
        import { useUnit } from "effector-react"

        const $store = createStore(null)
        const event = createEvent()

        function Component() {
          const [value, eventFn] = useUnit([$store, event])

          return <button onClick={eventFn}>{value}</button>
        }
      `,
    },
    {
      name: "legacy hooks from other packages",
      code: tsx`
        import React, { useEvent } from "react"
        import { createStore } from "effector"
        import { useStore } from "some-other-package"

        const $store = createStore(null)

        function Component() {
          const value = useStore($store)
          const eventFn = useEvent(console.log)

          return <button onClick={eventFn}>{value}</button>
        }
      `,
    },
    {
      name: "unrelated functions",
      code: tsx`
        import React from "react"

        const useStore = (value: any) => value
        const useEvent = (fn: any) => fn

        function Component() {
          const value = useStore("test")
          const handler = useEvent(console.log)

          return <button onClick={handler}>{value}</button>
        }
      `,
    },
  ],
  invalid: [
    {
      name: "useStore",
      code: tsx`
        import React from "react"
        import { createStore } from "effector"
        import { useStore } from "effector-react"

        const $store = createStore(null)

        function Component() {
          const value = useStore($store)

          return <button>{value}</button>
        }
      `,
      errors: [{ messageId: "useUseUnit", line: 8, column: 17 }],
    },
    {
      name: "useEvent with event",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"
        import { useEvent } from "effector-react"

        const event = createEvent()

        function Component() {
          const eventFn = useEvent(event)

          return <button onClick={() => eventFn()}>click</button>
        }
      `,
      errors: [{ messageId: "useUseUnit", line: 8, column: 19 }],
    },
    {
      name: "useEvent with effect",
      code: tsx`
        import React from "react"
        import { createEffect } from "effector"
        import { useEvent } from "effector-react"

        const effectFx = createEffect()

        function Component() {
          const effectFn = useEvent(effectFx)

          return <button onClick={() => effectFn()}>click</button>
        }
      `,
      errors: [{ messageId: "useUseUnit", line: 8, column: 20 }],
    },
    {
      name: "renamed imports",
      code: tsx`
        import React from "react"
        import { createStore, createEvent } from "effector"
        import { useStore as useStoreHook, useEvent as useEventHook } from "effector-react"

        const $store = createStore(0)
        const event = createEvent()

        function Component() {
          const value = useStoreHook($store)
          const handler = useEventHook(event)

          return <button onClick={handler}>{value}</button>
        }
      `,
      errors: [
        { messageId: "useUseUnit", line: 9, column: 17 },
        { messageId: "useUseUnit", line: 10, column: 19 },
      ],
    },
  ],
})
