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
      name: "nocheck: non-destructuring call with a collection argument is ignored",
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
    },
    {
      name: "nocheck: a unit acquired between calls is not merged (temporal dead zone)",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const useScopedStore: () => Store<boolean>
        const Component = () => {
          const a = useUnit($a)
          const $b = useScopedStore()
          const b = useUnit($b)
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
    {
      name: "object: computed key is ignored (cannot be normalized)",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const key: string
        const Component = () => {
          const { [key]: a } = useUnit({ [key]: $a })
          return null
        }
      `,
    },
    {
      name: "allow: a call with an undetectable unit type is left alone",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const whatever: unknown
        const Component = () => {
          const [a] = useUnit([$a])
          const [b] = useUnit([whatever as never])
          return null
        }
      `,
      options: [{ separation: "allow" }],
    },
  ],
  invalid: [
    {
      name: "mixed forms: array first merges into array form",
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
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store } from "effector"
                declare const $store1: Store<boolean>
                declare const $store2: Store<boolean>
                const Component = () => {
                  const [a, b] = useUnit([$store1, $store2])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "mixed forms: object first merges into object form",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $store1: Store<boolean>
        declare const $store2: Store<boolean>
        const Component = () => {
          const { b } = useUnit({ b: $store2 })
          const [a] = useUnit([$store1])
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
                import { type Store } from "effector"
                declare const $store1: Store<boolean>
                declare const $store2: Store<boolean>
                const Component = () => {
                  const { b, a } = useUnit({ b: $store2, a: $store1 })
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "mixed forms: array first, object with renamed key",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<string>
        declare const event: EventCallable<void>
        const Component = () => {
          const [value] = useUnit([$store])
          const { handler: onClick } = useUnit({ handler: event })
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
                import { type Store, type EventCallable } from "effector"
                declare const $store: Store<string>
                declare const event: EventCallable<void>
                const Component = () => {
                  const [value, onClick] = useUnit([$store, event])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "mixed forms: rest element in destructuring is reported without suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $store1: Store<boolean>
        declare const $store2: Store<boolean>
        const Component = () => {
          const [a, ...others] = useUnit([$store1])
          const { b } = useUnit({ b: $store2 })
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "object: renamed keys are normalized to the local variable name",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<string>
        declare const submitted: EventCallable<void>
        const Component = () => {
          const { a: store } = useUnit({ a: $store })
          const { b: onSubmit } = useUnit({ b: submitted })
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
                import { type Store, type EventCallable } from "effector"
                declare const $store: Store<string>
                declare const submitted: EventCallable<void>
                const Component = () => {
                  const { store, onSubmit } = useUnit({ store: $store, onSubmit: submitted })
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "duplicate local names across block scopes are reported without suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        declare const cond: boolean
        const Component = () => {
          const [value] = useUnit([$a])
          if (cond) {
            const [value] = useUnit([$b])
          }
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
          const [event] = useUnitEffector([eventUnit])
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
                  const [store, event] = useUnitEffector([$store, eventUnit])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "plain calls alongside destructured calls are merged",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
        declare const $something: Store<boolean>
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const onProductRemoveFromCart = useUnit(AddToCartModel.cartProductTotalRemoved)
          const [something] = useUnit([$something])
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
                import { type Store, type EventCallable } from "effector"
                declare const CartModel: { $cartProducts: Store<string[]> }
                declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
                declare const $something: Store<boolean>
                const Component = () => {
                  const [products, onProductRemoveFromCart, something] = useUnit([CartModel.$cartProducts, AddToCartModel.cartProductTotalRemoved, $something])
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
                import { type Store, type EventCallable } from "effector"
                declare const CartModel: { $cartProducts: Store<string[]> }
                declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
                declare const $something: Store<boolean>
                const Component = () => {
                  const [products, onProductRemoveFromCart, something] = useUnit([CartModel.$cartProducts, AddToCartModel.cartProductTotalRemoved, $something])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "single plain call alongside destructured call is merged",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const CartModel: { $cartProducts: Store<string[]> }
        declare const $something: Store<boolean>
        const Component = () => {
          const products = useUnit(CartModel.$cartProducts)
          const [something] = useUnit([$something])
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
                import { type Store } from "effector"
                declare const CartModel: { $cartProducts: Store<string[]> }
                declare const $something: Store<boolean>
                const Component = () => {
                  const [products, something] = useUnit([CartModel.$cartProducts, $something])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "multiple plain calls merge into object form",
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
                import { type Store, type EventCallable } from "effector"
                declare const CartModel: { $cartProducts: Store<string[]> }
                declare const AddToCartModel: { cartProductTotalRemoved: EventCallable<void> }
                const Component = () => {
                  const { products, onProductRemoveFromCart } = useUnit({ products: CartModel.$cartProducts, onProductRemoveFromCart: AddToCartModel.cartProductTotalRemoved })
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "array: two useUnit calls",
      code: tsx`
        import { useUnit } from "effector-react"
        const Component = () => {
          const [store] = useUnit([$store])
          const [event] = useUnit([eventUnit])
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
                  const [store, event] = useUnit([$store, eventUnit])
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
          const [event] = useUnit([eventUnit])
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
                  const [store, event, another] = useUnit([$store, eventUnit, $another])
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
                  const [store, event, another] = useUnit([$store, eventUnit, $another])
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
          const { event } = useUnit({ event: eventUnit })
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
                  const { store, event } = useUnit({ store: $store, event: eventUnit })
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
          const [event1, event2] = useUnit([eventUnit1, eventUnit2])
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
                  const [store1, store2, event1, event2] = useUnit([$store1, $store2, eventUnit1, eventUnit2])
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
      name: "separation allow: same-type calls in mixed forms are merged into the first form",
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
      options: [{ separation: "allow" }],
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store } from "effector"
                declare const $store1: Store<boolean>
                declare const $store2: Store<boolean>
                const Component = () => {
                  const [a, b] = useUnit([$store1, $store2])
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
    {
      name: "module units declared below the component are still mergeable",
      code: tsx`
        import { useUnit } from "effector-react"
        import { createStore } from "effector"
        const Component = () => {
          const a = useUnit($a)
          const b = useUnit($b)
          return null
        }
        const $a = createStore(0)
        const $b = createStore(1)
      `,
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { createStore } from "effector"
                const Component = () => {
                  const { a, b } = useUnit({ a: $a, b: $b })
                  return null
                }
                const $a = createStore(0)
                const $b = createStore(1)
              `,
            },
          ],
        },
      ],
    },
    {
      name: "a unit acquired mid-body blocks the anchor but calls below it still merge",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const useScopedStore: () => Store<boolean>
        const Component = () => {
          const a = useUnit($a)
          const $mid = useScopedStore()
          const b = useUnit($mid)
          const c = useUnit($mid)
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
                import { type Store } from "effector"
                declare const $a: Store<boolean>
                declare const useScopedStore: () => Store<boolean>
                const Component = () => {
                  const a = useUnit($a)
                  const $mid = useScopedStore()
                  const { b, c } = useUnit({ b: $mid, c: $mid })
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "multiple declarators in one statement are reported without a suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          const a = useUnit($a),
            b = useUnit($b)
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "let declarations are reported without a suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          let a = useUnit($a)
          let b = useUnit($b)
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "a type-annotated binding is reported without a suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          const a: boolean = useUnit($a)
          const b = useUnit($b)
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "a duplicate destructuring key keeps both bindings (reported without a suggestion)",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          const { value: x, value: y } = useUnit({ value: $a })
          const [z] = useUnit([$b])
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "separation enforce: same-type calls are merged",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          const [a] = useUnit([$a])
          const [b] = useUnit([$b])
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [
        {
          messageId: "multipleUseUnit",
          suggestions: [
            {
              messageId: "multipleUseUnit",
              output: tsx`
                import { useUnit } from "effector-react"
                import { type Store } from "effector"
                declare const $a: Store<boolean>
                declare const $b: Store<boolean>
                const Component = () => {
                  const [a, b] = useUnit([$a, $b])
                  return null
                }
              `,
            },
          ],
        },
      ],
    },
    {
      name: "a default in the destructuring pattern is reported without a suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          const { a = false } = useUnit({ a: $a })
          const [b] = useUnit([$b])
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "an argument key that is not destructured is reported without a suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store } from "effector"
        declare const $a: Store<boolean>
        declare const $b: Store<boolean>
        const Component = () => {
          const { a } = useUnit({ a: $a, b: $b })
          const [c] = useUnit([$b])
          return null
        }
      `,
      errors: [{ messageId: "multipleUseUnit", suggestions: [] }],
    },
    {
      name: "separation enforce: a mixed let call is reported without a suggestion",
      code: tsx`
        import { useUnit } from "effector-react"
        import { type Store, type EventCallable } from "effector"
        declare const $store: Store<boolean>
        declare const event: EventCallable<void>
        const Component = () => {
          let { value, run } = useUnit({ value: $store, run: event })
          return null
        }
      `,
      options: [{ separation: "enforce" }],
      errors: [{ messageId: "mixedStoresAndEvents", suggestions: [] }],
    },
  ],
})
