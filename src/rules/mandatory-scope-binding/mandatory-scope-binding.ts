import { getContextualType, typeMatchesSpecifier } from "@typescript-eslint/type-utils"
import { ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"
import { isExpression } from "typescript"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"
import { nameOf } from "@/shared/name"

export default createRule({
  name: "mandatory-scope-binding",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid `Event` and `Effect` usage without `useUnit` in React components.",
    },
    messages: {
      useUnitNeeded:
        '"{{ name }}" must be wrapped with `useUnit` from `effector-react` before usage inside React components.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    const stack = { render: [] as boolean[], hook: [] as boolean[] }

    type ComponentFunction = Node.FunctionDeclaration | Node.FunctionExpression | Node.ArrowFunctionExpression

    return {
      // detect react render contexts
      [`FunctionDeclaration, FunctionExpression, ArrowFunctionExpression`]: (node: ComponentFunction) => {
        // propagate when already in render context (callbacks and general purpose hooks)
        const current = stack.render.at(-1) ?? false
        if (current) return void stack.render.push(true)

        /* === detect a react hook === */
        const name = nameOf.function(node)
        if (name && UseRegex.test(name.name)) return void stack.render.push(true)

        const tsnode = services.esTreeNodeToTSNodeMap.get(node)

        /* === detect a react component by (inferred) return type === */
        const signature = checker.getSignatureFromDeclaration(tsnode)
        const returnType = signature ? checker.getReturnTypeOfSignature(signature) : checker.getVoidType()

        const isJSX = returnType.isUnion()
          ? returnType.types.some((type) => isType.jsx(type, services.program))
          : isType.jsx(returnType, services.program)

        if (isJSX) return void stack.render.push(true)

        /* === detect a react component by inferred contextual type === */
        const inferred = (isExpression(tsnode) && getContextualType(checker, tsnode)) || checker.getUnknownType()

        const isComponent = inferred.isUnion()
          ? inferred.types.some((type) => isType.component(type, services.program))
          : isType.component(inferred, services.program)

        if (isComponent) return void stack.render.push(true)

        return void stack.render.push(false)
      },

      [`:matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression):exit`]: () =>
        void stack.render.pop(),

      // bail from tracking classes
      "ClassDeclaration": () => void stack.render.push(false),
      "ClassDeclaration:exit": () => void stack.render.pop(),

      "CallExpression": (node: Node.CallExpression) => {
        const type = services.getTypeAtLocation(node.callee)

        const hook = ["useStore", "useStoreMap", "useList", "useEvent", "useUnit"] // useGate excluded
        const specifier = { from: "package" as const, package: "effector-react", name: hook }

        const isHook = typeMatchesSpecifier(type, specifier, services.program)
        return void stack.hook.push(isHook)
      },

      "Identifier": (node: Node.Identifier) => {
        const isWithinRender = stack.render.at(-1) ?? false
        if (!isWithinRender) return

        const isWithinHook = stack.hook.at(-1) ?? false
        if (isWithinHook) return

        const type = services.getTypeAtLocation(node)
        if (!isType.event(type, services.program) && !isType.effect(type, services.program)) return

        context.report({ node, messageId: "useUnitNeeded", data: { name: node.name } })
      },
    }
  },
})

const UseRegex = /^use[A-Z0-9].*$/
