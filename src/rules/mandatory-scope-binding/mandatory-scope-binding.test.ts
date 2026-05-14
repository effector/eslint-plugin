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

        import { fetchFx, clicked, mounted } from "${fixture("model")}"

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
      name: "hook argument declaration",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import { useUnit } from "effector-react"

        function useMounted(event: EventCallable<void>) {
          const fn = useUnit(event)

          React.useEffect(() => void fn(), [])
        }
      `,
    },
    {
      name: "static metadata access on a unit",
      code: tsx`
        import React from "react"

        import { clicked, fetchFx } from "${fixture("model")}"

        const Button = () => (
          <div data-sid={clicked.sid} data-name={fetchFx.shortName}>
            {clicked.shortName}
          </div>
        )
      `,
    },
    {
      name: "event via custom effector hook",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import { mounted } from "${fixture("model")}"

        declare function useMounted(event: EventCallable<void>): void

        function Component() {
          useMounted(mounted)

          return <button>click</button>
        }
      `,
    },
    {
      name: "event via custom effector hook (generic)",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import { mounted } from "${fixture("model")}"

        declare function useThing<T extends EventCallable<any>>(unit: T): void

        function Component() {
          useThing(mounted)

          return <button>click</button>
        }
      `,
    },
    {
      name: "event in custom effector component",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import { mounted } from "${fixture("model")}"

        type Props = { onPress: EventCallable<void> }
        const MyButton = (props: Props) => null

        function Component() {
          return <MyButton onPress={mounted} />
        }
      `,
    },
    {
      name: "effect (member) via useUnit",
      code: tsx`
        import React from "react"
        import { useUnit } from "effector-react"
        import * as model from "${fixture("model")}"

        function Component() {
          const onClick = useUnit(model.fetchFx)
          return <button onClick={onClick}>click</button>
        }
      `,
    },
    {
      name: "event via custom effector hook (object shape)",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import { mounted } from "${fixture("model")}"

        type Config = { onEnter: EventCallable<void> }
        declare function useLifecycle(cfg: Config): void

        function Component() {
          useLifecycle({ onEnter: mounted })

          return <button>click</button>
        }
      `,
    },
    {
      name: "event via custom effector hook (object shape shorthand)",
      code: tsx`
        import React from "react"
        import { type EventCallable, createEvent } from "effector"

        const onEnter = createEvent<void>()

        type Config = { onEnter: EventCallable<void> }
        declare function useLifecycle(cfg: Config): void

        function Component() {
          useLifecycle({ onEnter })

          return <button>click</button>
        }
      `,
    },
    {
      name: "event (member) via custom hook (object shape)",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import * as model from "${fixture("model")}"

        type Config = { onEnter: EventCallable<void> }
        declare function useLifecycle(cfg: Config): void

        function Component() {
          useLifecycle({ onEnter: model.mounted })

          return <button>click</button>
        }
      `,
    },
    {
      name: "event (member) in custom effector component",
      code: tsx`
        import React from "react"
        import { type EventCallable } from "effector"
        import * as model from "${fixture("model")}"

        type Props = { onPress: EventCallable<void> }
        const MyButton = (props: Props) => null

        function Component() {
          return <MyButton onPress={model.mounted} />
        }
      `,
    },
  ],
  invalid: [
    {
      name: "event via plain component (react annotated)",
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
      name: "event via plain component (inferred via forwardRef)",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        import { clicked } from "${fixture("model")}"

        const Button = React.forwardRef((props, ref) => <button ref={ref} onClick={clicked} />)
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 76, data: { name: "clicked" } }],
    },
    {
      name: "event via plain component (arrow inferred via jsx)",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const clicked = createEvent<unknown>()

        const Button = () => <button onClick={clicked}>click</button>
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 39, data: { name: "clicked" } }],
    },
    {
      name: "effect via plain component (inferred via memo)",
      code: tsx`
        import { memo } from "react"
        import { createEvent } from "effector"

        import { fetchFx } from "${fixture("model")}"

        const Button = memo((props) => <button onClick={fetchFx} />)
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 49, data: { name: "fetchFx" } }],
    },
    {
      name: "effect call in useEffect",
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
      name: "event call in callback",
      code: tsx`
        import React from "react"

        import { clicked } from "${fixture("model")}"

        const Button = () => <button onClick={() => clicked(null)}>click</button>
      `,
      errors: [{ messageId: "useUnitNeeded", line: 5, column: 45, data: { name: "clicked" } }],
    },
    {
      name: "event call inside hook",
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
      name: "event call inside weird hook (name inference)",
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
    {
      name: "react component with union return type",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const clicked = createEvent<unknown>()

        function Button() {
          if (Math.random() > 0.5) return null
          else return <button onClick={clicked}>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 8, column: 32, data: { name: "clicked" } }],
    },
    {
      name: "react component with union inferred contextual type",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const clicked = createEvent<unknown>()

        const Button: React.FC | null = () => (clicked(), null)

        const insert = (component?: React.ComponentType) => undefined
        insert(() => (clicked(), null))
      `,
      errors: [
        { messageId: "useUnitNeeded", line: 6, column: 40, data: { name: "clicked" } },
        { messageId: "useUnitNeeded", line: 9, column: 15, data: { name: "clicked" } },
      ],
    },
    {
      name: "event (member) direct call",
      code: tsx`
        import React from "react"
        import * as model from "${fixture("model")}"

        function Button() {
          React.useEffect(() => void model.clicked(), [])

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 5, column: 30, data: { name: "clicked" } }],
    },
    {
      name: "event (member) in jsx plain component",
      code: tsx`
        import React from "react"
        import * as model from "${fixture("model")}"

        const Button = () => <button onClick={model.clicked}>click</button>
      `,
      errors: [{ messageId: "useUnitNeeded", line: 4, column: 39, data: { name: "clicked" } }],
    },
    {
      name: "event in useState (lazy initializer)",
      code: tsx`
        import React from "react"
        import { useState } from "react"
        import { clicked } from "${fixture("model")}"

        function Component() {
          const [s, setS] = useState(clicked)
          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 6, column: 30, data: { name: "clicked" } }],
    },
    {
      name: "event in custom non-unit hook",
      code: tsx`
        import React from "react"
        import { mounted } from "${fixture("model")}"

        declare function useLeave(fn: () => void): void

        function Component() {
          useLeave(mounted)

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 7, column: 12, data: { name: "mounted" } }],
    },
    {
      name: "event in plain custom non-unit component",
      code: tsx`
        import React from "react"
        import { mounted } from "${fixture("model")}"

        type Props = { onClick: () => void }
        const MyButton = (props: Props) => null

        function Component() {
          return <MyButton onClick={mounted} />
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 8, column: 29, data: { name: "mounted" } }],
    },
    {
      name: "event in custom plain hook (object shape)",
      code: tsx`
        import React from "react"
        import { mounted } from "${fixture("model")}"

        type Config = { onLeave: () => void }
        declare function useLifecycle(cfg: Config): void

        function Component() {
          useLifecycle({ onLeave: mounted })

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 8, column: 27, data: { name: "mounted" } }],
    },
    {
      name: "event in custom plain hook (object shape shorthand)",
      code: tsx`
        import React from "react"
        import { createEvent } from "effector"

        const onLeave = createEvent<void>()

        type Config = { onLeave: () => void }
        declare function useLifecycle(cfg: Config): void

        function Component() {
          useLifecycle({ onLeave })
          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 10, column: 18, data: { name: "onLeave" } }],
    },
    {
      name: "effect (member) direct call",
      code: tsx`
        import React from "react"
        import * as model from "${fixture("model")}"

        function Component() {
          React.useEffect(() => void model.fetchFx(), [])

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 5, column: 30, data: { name: "fetchFx" } }],
    },
    {
      name: "event (member) in custom plain hook",
      code: tsx`
        import React from "react"
        import * as model from "${fixture("model")}"

        declare function useLeave(fn: () => void): void

        function Component() {
          useLeave(model.mounted)

          return <button>click</button>
        }
      `,
      errors: [{ messageId: "useUnitNeeded", line: 7, column: 12, data: { name: "mounted" } }],
    },
  ],
})
