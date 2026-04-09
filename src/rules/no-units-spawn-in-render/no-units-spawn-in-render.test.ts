import path from "path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { tsx } from "@/shared/tag"

import rule from "./no-units-spawn-in-render"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.tsx"], defaultProject: "tsconfig.fixture.json" },
      ecmaFeatures: { jsx: true },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("no-units-spawn-in-render", rule, {
  valid: [
    {
      name: "units created at module level",
      code: tsx`
        import React from "react"
        import { createStore, createEvent, sample } from "effector"

        const $store = createStore(0)
        const clicked = createEvent()

        sample({ clock: clicked, target: $store })

        const Component: React.FC = () => {
          return <button>click</button>
        }
      `,
    },
    {
      name: "units accessed via useContext",
      code: tsx`
        import React, { useContext } from "react"
        import { useUnit } from "effector-react"

        import { ModelContext } from "${fixture("context")}"

        const Component: React.FC = () => {
          const { $store } = useContext(ModelContext)
          const value = useUnit($store)

          return <div>{value}</div>
        }
      `,
    },
    {
      name: "units used via useUnit",
      code: tsx`
        import React from "react"
        import { createStore, createEvent } from "effector"
        import { useUnit } from "effector-react"

        const $store = createStore(0)
        const clicked = createEvent()

        const Component: React.FC = () => {
          const [value, click] = useUnit([$store, clicked])

          return <button onClick={click}>{value}</button>
        }
      `,
    },
    {
      name: "non-React function returning non-JSX",
      code: tsx`
        import { createStore, createEvent } from "effector"

        function createModel() {
          const $store = createStore(0)
          const clicked = createEvent()
          return { $store, clicked }
        }

        const model = createModel()
      `,
    },
    {
      name: "class component does not trigger",
      code: tsx`
        import React from "react"
        import { createStore } from "effector"

        class Component extends React.Component {
          store = createStore(0)

          render() {
            return <div>hello</div>
          }
        }
      `,
    },
    {
      name: "regular function call in component",
      code: tsx`
        import React from "react"

        import { regularFunction } from "${fixture("factory")}"

        const Component: React.FC = () => {
          const data = regularFunction()

          return <div>{data.foo}</div>
        }
      `,
    },
    {
      name: "fork and allSettled in non-render context",
      code: tsx`
        import { createStore, fork, allSettled, createEvent } from "effector"

        const $store = createStore(0)
        const event = createEvent()

        async function runTest() {
          const scope = fork()
          await allSettled(event, { scope })
        }
      `,
    },
  ],
  invalid: [
    {
      name: "createStore directly in component body",
      code: tsx`
        import React from "react"
        import { createStore } from "effector"

        const Component: React.FC = () => {
          const $store = createStore(0)

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "createStore" } }],
    },
    {
      name: "createEvent directly in component body",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        function Component() {
          const clicked = createEvent()

          return <button onClick={clicked}>click</button>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 19, data: { name: "createEvent" } }],
    },
    {
      name: "createEffect directly in component body",
      code: tsx`
        import React from "react"
        import { createEffect } from "effector"

        const Component = () => {
          const fetchFx = createEffect(() => {})

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 19, data: { name: "createEffect" } }],
    },
    {
      name: "sample operator in component body",
      code: tsx`
        import React from "react"
        import { createStore, createEvent, sample } from "effector"

        const $store = createStore(0)
        const clicked = createEvent()

        const Component: React.FC = () => {
          sample({ clock: clicked, target: $store })

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 8, column: 3, data: { name: "sample" } }],
    },
    {
      name: "combine operator in component body",
      code: tsx`
        import React from "react"
        import { createStore, combine } from "effector"

        const $a = createStore(1)
        const $b = createStore(2)

        const Component: React.FC = () => {
          const $sum = combine($a, $b, (a, b) => a + b)

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 8, column: 16, data: { name: "combine" } }],
    },
    {
      name: "createStore inside useMemo",
      code: tsx`
        import React, { useMemo } from "react"
        import { createStore } from "effector"

        const Component: React.FC = () => {
          const $store = useMemo(() => createStore(0), [])

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 32, data: { name: "createStore" } }],
    },
    {
      name: "sample inside useEffect",
      code: tsx`
        import React, { useEffect } from "react"
        import { createStore, createEvent, sample } from "effector"

        const $store = createStore(0)
        const clicked = createEvent()

        const Component: React.FC = () => {
          useEffect(() => {
            sample({ clock: clicked, target: $store })
          }, [])

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 9, column: 5, data: { name: "sample" } }],
    },
    {
      name: "createStore inside useCallback",
      code: tsx`
        import React, { useCallback } from "react"
        import { createStore } from "effector"

        const Component: React.FC = () => {
          const init = useCallback(() => {
            const $store = createStore(0)
            return $store
          }, [])

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 6, column: 20, data: { name: "createStore" } }],
    },
    {
      name: "custom factory in component body",
      code: tsx`
        import React from "react"

        import { createModel } from "${fixture("factory")}"

        const Component: React.FC = () => {
          const model = createModel()

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noCustomFactoryInRender", line: 6, column: 17, data: { name: "createModel" } }],
    },
    {
      name: "custom factory inside useMemo",
      code: tsx`
        import React, { useMemo } from "react"

        import { createCounter } from "${fixture("factory")}"

        const Component: React.FC = () => {
          const counter = useMemo(() => createCounter(0), [])

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noCustomFactoryInRender", line: 6, column: 33, data: { name: "createCounter" } }],
    },
    {
      name: "effector factory in custom hook",
      code: tsx`
        import { createStore } from "effector"

        function useMyStore() {
          const $store = createStore(0)
          return $store
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 4, column: 18, data: { name: "createStore" } }],
    },
    {
      name: "effector factory in custom hook with useMemo",
      code: tsx`
        import { useMemo } from "react"
        import { createStore } from "effector"

        function useMyStore() {
          return useMemo(() => createStore(0), [])
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 24, data: { name: "createStore" } }],
    },
    {
      name: "custom factory in custom hook",
      code: tsx`
        import { useMemo } from "react"

        import { createModel } from "${fixture("factory")}"

        function useModel() {
          return useMemo(() => createModel(), [])
        }
      `,
      errors: [{ messageId: "noCustomFactoryInRender", line: 6, column: 24, data: { name: "createModel" } }],
    },
    {
      name: "multiple violations in component",
      code: tsx`
        import React from "react"
        import { createStore, createEvent, sample } from "effector"

        const Component: React.FC = () => {
          const $store = createStore(0)
          const clicked = createEvent()
          sample({ clock: clicked, target: $store })

          return <button onClick={clicked}>click</button>
        }
      `,
      errors: [
        { messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "createStore" } },
        { messageId: "noFactoryInRender", line: 6, column: 19, data: { name: "createEvent" } },
        { messageId: "noOperatorInRender", line: 7, column: 3, data: { name: "sample" } },
      ],
    },
    {
      name: "attach operator in component",
      code: tsx`
        import React from "react"
        import { createEffect, attach } from "effector"

        const baseFx = createEffect(() => {})

        const Component: React.FC = () => {
          const boundFx = attach({ effect: baseFx, mapParams: () => undefined })

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 7, column: 19, data: { name: "attach" } }],
    },
    {
      name: "merge operator in component",
      code: tsx`
        import React from "react"
        import { createEvent, merge } from "effector"

        const a = createEvent()
        const b = createEvent()

        const Component: React.FC = () => {
          const merged = merge([a, b])

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 8, column: 18, data: { name: "merge" } }],
    },
    {
      name: "split operator in component",
      code: tsx`
        import React from "react"
        import { createEvent, split } from "effector"

        const event = createEvent<number>()

        const Component: React.FC = () => {
          const { positive, negative } = split(event, {
            positive: (n) => n > 0,
            negative: (n) => n < 0,
          })

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 7, column: 34, data: { name: "split" } }],
    },
    {
      name: "restore in component",
      code: tsx`
        import React from "react"
        import { createEvent, restore } from "effector"

        const setValue = createEvent<number>()

        const Component: React.FC = () => {
          const $value = restore(setValue, 0)

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 7, column: 18, data: { name: "restore" } }],
    },
    {
      name: "createDomain in component",
      code: tsx`
        import React from "react"
        import { createDomain } from "effector"

        const Component: React.FC = () => {
          const domain = createDomain()

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "createDomain" } }],
    },
    {
      name: "createApi in component",
      code: tsx`
        import React from "react"
        import { createStore, createApi } from "effector"

        const $store = createStore(0)

        const Component: React.FC = () => {
          const api = createApi($store, {
            increment: (n) => n + 1,
          })

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 7, column: 15, data: { name: "createApi" } }],
    },
    {
      name: "inferred component (arrow function returning JSX)",
      code: tsx`
        import React from "react"
        import { createStore } from "effector"

        const Component = () => {
          const $store = createStore(0)

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "createStore" } }],
    },
    {
      name: "inferred component via forwardRef",
      code: tsx`
        import React from "react"
        import { createStore } from "effector"

        const Component = React.forwardRef((props, ref) => {
          const $store = createStore(0)

          return <div ref={ref}>hello</div>
        })
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "createStore" } }],
    },
    {
      name: "inferred component via memo",
      code: tsx`
        import { memo } from "react"
        import { createStore } from "effector"

        const Component = memo(() => {
          const $store = createStore(0)

          return <div>hello</div>
        })
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "createStore" } }],
    },
    {
      name: "renamed import in component",
      code: tsx`
        import React from "react"
        import { createStore as cs } from "effector"

        const Component: React.FC = () => {
          const $store = cs(0)

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noFactoryInRender", line: 5, column: 18, data: { name: "cs" } }],
    },
    {
      name: "deep nested factory (unit 3 levels deep)",
      code: tsx`
        import React from "react"

        import { createDeepModel } from "${fixture("factory")}"

        const Component: React.FC = () => {
          const model = createDeepModel()

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noCustomFactoryInRender", line: 6, column: 17, data: { name: "createDeepModel" } }],
    },
    {
      name: "forward (deprecated) operator in component",
      code: tsx`
        import React from "react"
        import { createStore, createEvent, forward } from "effector"

        const $store = createStore(0)
        const clicked = createEvent()

        const Component: React.FC = () => {
          forward({ from: clicked, to: $store })

          return <div>hello</div>
        }
      `,
      errors: [{ messageId: "noOperatorInRender", line: 8, column: 3, data: { name: "forward" } }],
    },
  ],
})
