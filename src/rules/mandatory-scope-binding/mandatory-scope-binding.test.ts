import path from "path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { tsx } from "@/shared/tag"

import rule from "./mandatory-scope-binding"

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

ruleTester.run("mandatory-scope-binding", rule, {
  valid: [
    {
      name: "event via useEvent",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"
        import { useEvent } from "effector-react"

        const clicked = createEvent<unknown>()

        const Button: React.FC = () => {
          const fn = useEvent(clicked)

          return <button onClick={fn}>click</button>
        }
      `,
    },
    {
      name: "store via useStore",
      code: tsx`
        import React from "react"
        import { useStore } from "effector-react"

        import { fetchFx } from "${fixture("model")}"

        const Button: React.FC = () => {
          const loading = useStore(fetchFx.pending)

          if (loading) return null

          return <button>click</button>
        }
      `,
    },
    {
      name: "effect via useUnit",
      code: tsx`
        import React from "react"
        import { useUnit } from "effector-react"

        import { fetchFx } from "${fixture("model")}"

        const Button: React.FC = () => {
          const onClick = useUnit(fetchFx)

          return <button onClick={onClick}>click</button>
        }
      `,
    },
    {
      name: "nested event: inferred jsx",
      code: tsx`
        import React from "react"
        import { useEvent } from "effector-react"

        import * as model from "${fixture("model")}"

        const Button = () => {
          const fn = useEvent(model.clicked)
          const mounted = useEvent(model.$$.context.outputs.mounted)

          React.useEffect(mounted, [])

          return <button onClick={fn}>click</button>
        }
      `,
    },
    {
      name: "array shape",
      code: tsx`
        import React from "react"
        import { useEvent } from "effector-react"
        import { createEvent, createEffect } from "effector"

        const clicked = createEvent()
        const hooks = { mounted: createEvent(), unmounted: createEvent() }
        const fetchFx = createEffect(() => undefined)

        const Button: React.FC = () => {
          const [onClick, mount, unmount, fetch] = useEvent([clicked, hooks.mounted, hooks.unmounted, fetchFx])

          React.useEffect(() => {
            ;(mount(), fetch())

            return () => unmount()
          }, [])

          return <button onClick={onClick}>click</button>
        }
      `,
    },
    {
      name: "object shape",
      code: tsx`
        import React from "react"
        import { useUnit } from "effector-react"

        import { fetchFx, clicked } from "${fixture("model")}"

        const Button = () => {
          const { fn, mount, loading } = useUnit({ fn: clicked, mount: mounted, loading: fetchFx.pending })

          React.useEffect(() => mount(), [mount])

          return <button onClick={() => fn(true)}>{loading}</button>
        }
      `,
    },
    {
      name: "no component",
      code: tsx`
        import { allSettled, createEffect, fork } from "effector"

        const somethingHasppenedFx = createEffect()

        export function CreateController() {
          class SomeController {
            private async handleHttp() {
              const scope = fork({ handlers: [[somethingHasppenedFx, () => null]] })

              await allSettled(somethingHasppenedFx, { scope, params: {} })
            }
          }

          return SomeController
        }
      `,
    },
    {
      name: "generics",
      code: tsx`
        import { Effect, fork } from "effector"

        export function Component() {
          const scope = fork({ handlers: new Map<Effect<any, any, any>, any>([]) })

          type Something<T> = unknown

          const t: Something<Array<Effect<any, any, any>>> = [] as any

          return null
        }
      `,
    },
    {
      name: "scope package import",
      code: tsx`
        import React from "react"
        import { useStore } from "effector-react/scope"

        import { fetchFx } from "${fixture("model")}"

        export const Render = () => <>{useStore(fetchFx.pending)}</>
      `,
    },
    {
      name: "aliased import",
      code: tsx`
        import React from "react"
        import { useUnit as use } from "effector-react/scope"

        import { fetchFx } from "${fixture("model")}"

        export const Render = () => <>{use(fetchFx.pending)}</>
      `,
    },
    {
      name: "star import",
      code: tsx`
        import React from "react"
        import * as eff from "effector-react"

        import { fetchFx } from "${fixture("model")}"

        export const Render = () => <>{eff.useUnit(fetchFx.pending)}</>
      `,
    },
  ],
  invalid: [
    {
      name: "event: annotated",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const clicked = createEvent<unknown>()

        const Button: React.FC = () => {
          return <button onClick={clicked}>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 7, column: 27, data: { name: "clicked" } }],
    },
    {
      name: "event: inferred forwardRef",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        import { clicked } from "${fixture("model")}"

        const Button = React.forwardRef((props, ref) => <button ref={ref} onClick={clicked} />)
        const Button = React.forwardRef((props, ref) => clicked.shortName)
      `,
      errors: [
        { messageId: "useUnitNeeded", line: 6, column: 76, data: { name: "clicked" } },
        { messageId: "useUnitNeeded", line: 7, column: 49, data: { name: "clicked" } },
      ],
    },
    {
      name: "event: inferred jsx arrow function",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const clicked = createEvent<unknown>()

        const Button = () => <button onClick={clicked}>click</button>
        const Link = () => {
          return <a onClick={clicked}>click</a>
        }
      `,
      errors: [
        { messageId: "useUnitNeeded", line: 6, column: 39, data: { name: "clicked" } },
        { messageId: "useUnitNeeded", line: 8, column: 22, data: { name: "clicked" } },
      ],
    },
    {
      name: "event: function expression inferred jsx",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        import { clicked } from "${fixture("model")}"

        const Button = function ButtonView() {
          return <button onClick={clicked}>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 7, column: 27, data: { name: "clicked" } }],
    },
    {
      name: "event: function declaration inferred jsx",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        import { clicked } from "${fixture("model")}"

        function Button() {
          return <button onClick={clicked}>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 7, column: 27, data: { name: "clicked" } }],
    },
    {
      name: "effect: annotated",
      code: tsx`
        import React from "react"
        import { useUnit } from "effector-react"

        import { fetchFx } from "${fixture("model")}"

        const Button: React.FC = () => {
          return <button onClick={fetchFx}>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 7, column: 27, data: { name: "fetchFx" } }],
    },
    {
      name: "effect: inferred memo",
      code: tsx`
        import { memo } from "react"
        import { createEvent } from "effector"

        import { fetchFx } from "${fixture("model")}"

        const Button = memo((props) => <button onClick={fetchFx} />)
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 49, data: { name: "fetchFx" } }],
    },
    {
      name: "effect in useEffect",
      code: tsx`
        import React from "react"

        import { fetchFx } from "${fixture("model")}"

        const Button: React.FC = () => {
          React.useEffect(() => void fetchFx(), [])

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 30, data: { name: "fetchFx" } }],
    },
    {
      name: "event in useEffect cleanup",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const unmounted = createEvent<unknown>()

        function Button() {
          React.useEffect(() => {
            return () => unmounted()
          }, [])

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 8, column: 18, data: { name: "unmounted" } }],
    },
    {
      name: "event in callback",
      code: tsx`
        import React from "react"

        import { clicked } from "${fixture("model")}"

        const Button = () => <button onClick={() => clicked(null)}>click</button>
      `,
      errors: [{ messageId: "useUnitNeeded", line: 5, column: 45, data: { name: "clicked" } }],
    },
    {
      name: "effect in callback",
      code: tsx`
        import { useEvent } from "react"

        import { clicked } from "${fixture("model")}"

        function Button() {
          const fn = useEvent(clicked)

          return <button onClick={fn}>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 23, data: { name: "clicked" } }],
    },
    {
      name: "event inside hook",
      code: tsx`
        import { useEffect } from "react"

        import { clicked } from "${fixture("model")}"

        function useClicked() {
          return () => clicked()
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 16, data: { name: "clicked" } }],
    },
    {
      name: "event inside weird hook (name inference)",
      code: tsx`
        import { useEffect } from "react"

        import { clicked } from "${fixture("model")}"

        let useOne
        useOne = () => () => clicked()

        const two = { useTwo: () => () => clicked() }

        const [useThree = () => () => clicked()] = [undefined]
      `,
      errors: [
        { messageId: "useUnitNeeded", line: 6, column: 22, data: { name: "clicked" } },
        { messageId: "useUnitNeeded", line: 8, column: 35, data: { name: "clicked" } },
        { messageId: "useUnitNeeded", line: 10, column: 31, data: { name: "clicked" } },
      ],
    },
  ],
})
