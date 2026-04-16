import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { tsx } from "@/shared/tag"

import rule from "./prefer-single-binding"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.tsx"], defaultProject: "tsconfig.fixture.json" },
      ecmaFeatures: { jsx: true },
    },
  },
})

ruleTester.run("prefer-single-binding", rule, {
  valid: [
    {
      name: "nocheck: @@unitShape call is ignored",
      code: tsx`
        import { useUnit } from "effector-react"
        declare const CartModel: {
          "@@unitShape": () => { products: string[] }
        }
        const Component = () => {
          const { products } = useUnit(CartModel)
          return null
        }
      `,
    },
    {
      name: "nocheck: @@unitShape call alongside destructuring call is ignored",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $store: Store<string>
        declare const CartModel: {
          "@@unitShape": () => { products: string[] }
        }
        const Component = () => {
          const { products } = useUnit(CartModel)
          const [value] = useUnit([$store])
          return null
        }
      `,
    },
    {
      name: "alias: single useUnit call with alias",
      code: tsx`
        import { useUnit as useUnitEffector } from "effector-react"
        const Component = () => {
          const [store, event] = useUnitEffector([$store, event])
          return null
        }
      `,
    },
    {
      name: "nocheck: single plain call without other useUnit calls is ignored",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          return null
        }
      `,
    },
    {
      name: "nocheck: plain calls with separation allow are ignored",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const onProductRemoveFromCart = useUnit(AddToCartModel.cartProductTotalRemoved)
          return null
        }
      `,
      options: [{ separation: "allow" }],
    },
    {
      name: "nocheck: plain calls with separation enforce are ignored",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const onProductRemoveFromCart = useUnit(AddToCartModel.cartProductTotalRemoved)
          return null
        }
      `,
      options: [{ separation: "enforce" }],
    },
    {
      name: "array: single useUnit call",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const [store, event] = useUnit([$store, event])
          return null
        }
      `,
    },
    {
      name: "object: single useUnit call",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const { store, event } = useUnit({ store: $store, event: event })
          return null
        }
      `,
    },
    {
      name: "nocheck: useUnit outside of component",
      code: tsx`
        import { useUnit } from "effector-react"
        const store = useUnit([$store])
        const event = useUnit([event])
      `,
    },
    {
      name: "separation enforce: already separated stores and events",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<boolean>
        declare const event: EventCallable<void>
        const Component = () => {
          const [store] = useUnit([$store])
          const [ev] = useUnit([event])
          return null
        }
      `,
      options: [{ separation: "enforce" }],
    },
    {
      name: "separation allow: stores and events in separate calls",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const HelpFormModel: {
          $isFormSent: Store<boolean>
          sentFormChanged: EventCallable<void>
          submitHelpForm: EventCallable<void>
        }
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent])
          const [sent, submit] = useUnit([HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm])
          return null
        }
      `,
      options: [{ separation: "allow" }],
    },
    {
      name: "separation allow: effects in separate call",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type Effect } from "effector"
        declare const $store: Store<boolean>
        declare const fx: Effect<void, void>
        const Component = () => {
          const [store] = useUnit([$store])
          const [run] = useUnit([fx])
          return null
        }
      `,
      options: [{ separation: "allow" }],
    },
  ],
  invalid: [
    {
      name: "mixed array and object forms are reported without suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $store1: Store<boolean>
        declare const $store2: Store<boolean>
        const Component = () => {
          const [a] = useUnit([$store1])
          const { b } = useUnit({ b: $store2 })
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "mixed array and object forms are reported without suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<string>
        declare const event: EventCallable<void>
        const Component = () => {
          const [value] = useUnit([$store])
          const { handler } = useUnit({ handler: event })
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "alias: multiple useUnit calls with alias",
      code: tsx`
        import { useUnit as useUnitEffector } from "effector-react"
        const Component = () => {
          const [store] = useUnitEffector([$store])
          const [event] = useUnitEffector([event])
          return null
        }
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit as useUnitEffector } from "effector-react"
                const Component = () => {
                  const [store, event] = useUnitEffector([$store, event])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "plain calls alongside destructured calls are reported",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const onProductRemoveFromCart = useUnit(AddToCartModel.cartProductTotalRemoved)
          const [something] = useUnit([$something])
          return null
        }
      `,
      errors: [{ messageId: "singleUnitWithoutDestructuring" }, { messageId: "singleUnitWithoutDestructuring" }],
    },
    {
      name: "single plain call alongside destructured call is reported",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const [something] = useUnit([$something])
          return null
        }
      `,
      errors: [{ messageId: "singleUnitWithoutDestructuring" }],
    },
    {
      name: "multiple plain calls without destructured calls are reported",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const onProductRemoveFromCart = useUnit(AddToCartModel.cartProductTotalRemoved)
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit" }, { messageId: "multipleUseUnit" }],
    },
    {
      name: "plain array call alongside plain scalar call are both reported",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
        const Component = () => {
          const products = useUnit([CartModel.$cartProducts])
          const onProductRemoveFromCart = useUnit(AddToCartModel.cartProductTotalRemoved)
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit" }, { messageId: "multipleUseUnit" }],
    },
    {
      name: "array: two useUnit calls",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const [store] = useUnit([$store])
          const [event] = useUnit([event])
          return null
        }
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const [store, event] = useUnit([$store, event])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "array: three useUnit calls",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const [store] = useUnit([$store])
          const [event] = useUnit([event])
          const [another] = useUnit([$another])
          return null
        }
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const [store, event, another] = useUnit([$store, event, $another])
                  return null
                }
              `,
            },
          ],
        },
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const [store, event, another] = useUnit([$store, event, $another])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "object: two useUnit calls",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const { store } = useUnit({ store: $store })
          const { event } = useUnit({ event: event })
          return null
        }
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const { store, event } = useUnit({ store: $store, event: event })
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "array: multiple useUnit calls with multiple elements each",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const [store1, store2] = useUnit([$store1, $store2])
          const [event1, event2] = useUnit([event1, event2])
          return null
        }
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const [store1, store2, event1, event2] = useUnit([$store1, $store2, event1, event2])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "array: all calls merged regardless of type",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent])
          const [sent] = useUnit([HelpFormModel.sentFormChanged])
          const [submit] = useUnit([HelpFormModel.submitHelpForm])
          return null
        }
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              /* INFO: fixer produces a single-line output intentionally; prettier will reformat it in real projects */
              // prettier-ignore
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const [isFormSent, sent, submit] = useUnit([HelpFormModel.$isFormSent, HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm])
                  return null
                }
              `,
            },
          ],
        },
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              /* INFO: fixer produces a single-line output intentionally; prettier will reformat it in real projects */
              // prettier-ignore
              output: tsx`
                import { useUnit } from "effector-react"
                const Component = () => {
                  const [isFormSent, sent, submit] = useUnit([HelpFormModel.$isFormSent, HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation allow: multiple calls of same type are merged",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const HelpFormModel: {
          $isFormSent: Store<boolean>
          sentFormChanged: EventCallable<void>
          submitHelpForm: EventCallable<void>
        }
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent])
          const [sent] = useUnit([HelpFormModel.sentFormChanged])
          const [submit] = useUnit([HelpFormModel.submitHelpForm])
          return null
        }
      `,
      options: [{ separation: "allow" }],
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const HelpFormModel: {
                  $isFormSent: Store<boolean>
                  sentFormChanged: EventCallable<void>
                  submitHelpForm: EventCallable<void>
                }
                const Component = () => {
                  const [isFormSent] = useUnit([HelpFormModel.$isFormSent])
                  const [sent, submit] = useUnit([HelpFormModel.sentFormChanged, HelpFormModel.submitHelpForm])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation allow: multiple store calls and multiple event calls are each merged",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const HelpFormModel: {
          $isFormSent: Store<boolean>
          $isLoading: Store<boolean>
          submitHelpForm: EventCallable<void>
        }
        const Component = () => {
          const [isFormSent] = useUnit([HelpFormModel.$isFormSent])
          const [isLoading] = useUnit([HelpFormModel.$isLoading])
          const [submit] = useUnit([HelpFormModel.submitHelpForm])
          return null
        }
      `,
      options: [{ separation: "allow" }],
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const HelpFormModel: {
                  $isFormSent: Store<boolean>
                  $isLoading: Store<boolean>
                  submitHelpForm: EventCallable<void>
                }
                const Component = () => {
                  const [isFormSent, isLoading] = useUnit([HelpFormModel.$isFormSent, HelpFormModel.$isLoading])
                  const [submit] = useUnit([HelpFormModel.submitHelpForm])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation allow: mixed naming patterns grouped correctly",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const Model: {
          $isVisible: Store<boolean>
          $hasError: Store<boolean>
          onClick: EventCallable<void>
          handleSubmit: EventCallable<void>
        }
        const Component = () => {
          const [isVisible] = useUnit([Model.$isVisible])
          const [hasError] = useUnit([Model.$hasError])
          const [onClick] = useUnit([Model.onClick])
          const [handleSubmit] = useUnit([Model.handleSubmit])
          return null
        }
      `,
      options: [{ separation: "allow" }],
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const Model: {
                  $isVisible: Store<boolean>
                  $hasError: Store<boolean>
                  onClick: EventCallable<void>
                  handleSubmit: EventCallable<void>
                }
                const Component = () => {
                  const [isVisible, hasError] = useUnit([Model.$isVisible, Model.$hasError])
                  const [onClick] = useUnit([Model.onClick])
                  const [handleSubmit] = useUnit([Model.handleSubmit])
                  return null
                }
              `,
            },
          ],
        },
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const Model: {
                  $isVisible: Store<boolean>
                  $hasError: Store<boolean>
                  onClick: EventCallable<void>
                  handleSubmit: EventCallable<void>
                }
                const Component = () => {
                  const [isVisible] = useUnit([Model.$isVisible])
                  const [hasError] = useUnit([Model.$hasError])
                  const [onClick, handleSubmit] = useUnit([Model.onClick, Model.handleSubmit])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation enforce: array: mixed stores and events",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<string>
        declare const event: EventCallable<void>
        const Component = () => {
          const [value, setValue] = useUnit([$store, event])
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [
        {
          messageId: "mixedStoresAndEvents",
          suggestions: [
            {
              messageId: "mixedStoresAndEvents",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const $store: Store<string>
                declare const event: EventCallable<void>
                const Component = () => {
                  const [value] = useUnit([$store])
                  const [setValue] = useUnit([event])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation enforce: array: mixed stores and effects",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type Effect } from "effector"
        declare const $store: Store<string>
        declare const fx: Effect<void, void>
        const Component = () => {
          const [value, run] = useUnit([$store, fx])
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [
        {
          messageId: "mixedStoresAndEvents",
          suggestions: [
            {
              messageId: "mixedStoresAndEvents",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type Effect } from "effector"
                declare const $store: Store<string>
                declare const fx: Effect<void, void>
                const Component = () => {
                  const [value] = useUnit([$store])
                  const [run] = useUnit([fx])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation enforce: array: mixed stores and events with multiple items",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store1: Store<string>
        declare const $store2: Store<string>
        declare const event1: EventCallable<void>
        declare const event2: EventCallable<void>
        const Component = () => {
          const [value1, value2, handler1, handler2] = useUnit([$store1, $store2, event1, event2])
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [
        {
          messageId: "mixedStoresAndEvents",
          suggestions: [
            {
              messageId: "mixedStoresAndEvents",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const $store1: Store<string>
                declare const $store2: Store<string>
                declare const event1: EventCallable<void>
                declare const event2: EventCallable<void>
                const Component = () => {
                  const [value1, value2] = useUnit([$store1, $store2])
                  const [handler1, handler2] = useUnit([event1, event2])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation enforce: object: mixed stores and events",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<string>
        declare const event: EventCallable<void>
        const Component = () => {
          const { value, setValue } = useUnit({ value: $store, setValue: event })
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [
        {
          messageId: "mixedStoresAndEvents",
          suggestions: [
            {
              messageId: "mixedStoresAndEvents",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const $store: Store<string>
                declare const event: EventCallable<void>
                const Component = () => {
                  const { value } = useUnit({ value: $store })
                  const { setValue } = useUnit({ setValue: event })
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "separation enforce: array: real model example",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const FormModel: {
          $isFormSent: Store<boolean>
          submitForm: EventCallable<void>
          resetForm: EventCallable<void>
        }
        const Component = () => {
          const [isFormSent, submit, reset] = useUnit([
            FormModel.$isFormSent,
            FormModel.submitForm,
            FormModel.resetForm,
          ])
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [
        {
          messageId: "mixedStoresAndEvents",
          suggestions: [
            {
              messageId: "mixedStoresAndEvents",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store, type EventCallable } from "effector"
                declare const FormModel: {
                  $isFormSent: Store<boolean>
                  submitForm: EventCallable<void>
                  resetForm: EventCallable<void>
                }
                const Component = () => {
                  const [isFormSent] = useUnit([FormModel.$isFormSent])
                  const [submit, reset] = useUnit([FormModel.submitForm, FormModel.resetForm])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
  ],
})
