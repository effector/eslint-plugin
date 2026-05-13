import { getContextualType } from "@typescript-eslint/type-utils"
import { ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"
import ts, { isExpression } from "typescript"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"
import { nameOf } from "@/shared/name"

export default createRule({
  name: "mandatory-scope-binding",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid `Event` and `Effect` usage without `useUnit` in React.",
    },
    messages: {
      useUnitNeeded: '"{{ name }}" must be wrapped with `useUnit` from `effector-react` before usage inside React.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    const inRender: boolean[] = []
    const inHook: boolean[] = []

    /** check if the expression is used in a context specifically expecting a unit */
    const isExpectingUnit = (slot: UsageNode): boolean => {
      const tsnode = services.esTreeNodeToTSNodeMap.get(slot) as ts.Expression
      const type = checker.getContextualType(tsnode)

      if (type) return isType.event(type, services.program) || isType.effect(type, services.program)
      else return false
    }

    const check = (mode: "call" | "arg" | "prop" | "jsx", node: UsageNode) => {
      const rendering = inRender.at(-1) ?? false
      if (!rendering) return

      const type = services.getTypeAtLocation(node)
      if (!isType.event(type, services.program) && !isType.effect(type, services.program)) return

      if (mode === "call") return report(node) // direct call => always dangerous

      const delegated = isExpectingUnit(node),
        // jsx receivers and `use*` callees are contractually *assumed* to bind, so we can
        // delegate scope binding to them; any other call carries no such guarantee
        eligible = mode === "jsx" || (inHook.at(-1) ?? false)

      if (eligible && delegated) return
      else return report(node)
    }

    const report = (node: UsageNode) => {
      const name = nameOf.expression.simple(node) ?? "<expression>"
      context.report({ node, messageId: "useUnitNeeded", data: { name } })
    }

    return {
      // detect react render contexts
      [`FunctionDeclaration, FunctionExpression, ArrowFunctionExpression`]: (node: ComponentNode) => {
        // propagate when already in render context (callbacks and general purpose hooks)
        const current = inRender.at(-1) ?? false
        if (current) return void inRender.push(true)

        /* === detect a react hook === */
        const name = nameOf.function(node)
        if (name && UseRegex.test(name.name)) return void inRender.push(true)

        const tsnode = services.esTreeNodeToTSNodeMap.get(node)

        /* === detect a react component by (inferred) return type === */
        const signature = checker.getSignatureFromDeclaration(tsnode)
        const returnType = signature ? checker.getReturnTypeOfSignature(signature) : checker.getVoidType()

        const isJSX = returnType.isUnion()
          ? returnType.types.some((type) => isType.jsx(type, services.program))
          : isType.jsx(returnType, services.program)

        if (isJSX) return void inRender.push(true)

        /* === detect a react component by inferred contextual type === */
        const inferred = (isExpression(tsnode) && getContextualType(checker, tsnode)) || checker.getUnknownType()

        const isComponent = inferred.isUnion()
          ? inferred.types.some((type) => isType.component(type, services.program))
          : isType.component(inferred, services.program)

        if (isComponent) return void inRender.push(true)

        return void inRender.push(false)
      },

      [`:matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression):exit`]: () => void inRender.pop(),

      // bail from tracking classes
      "ClassDeclaration": () => void inRender.push(false),
      "ClassDeclaration:exit": () => void inRender.pop(),

      // detect contexts where we may delegate `useUnit` binding to the callee
      "CallExpression": (node: Node.CallExpression) => {
        const id = nameOf.callee(node.callee),
          isEnteringHook = id !== null && UseRegex.test(id.name)

        inHook.push(isEnteringHook)
      },
      "CallExpression:exit": () => void inHook.pop(),

      // direct invocation site `event()` & `model.event()`
      // - receiver is being invoked directly, always dangerous
      [`${selector.callee.direct}, ${selector.callee.member}`]: (node: UsageNode) => check("call", node),

      // argument position `fn(event)` & `fn(model.event)`
      // - dangerous unless scope binding delegated (arg expects unit)
      [`${selector.arg.direct}, ${selector.arg.member}`]: (node: UsageNode) => check("arg", node),

      // one-level-deep object-property position `fn({ key: event })` & `fn({ key: model.event })`
      // - dangerous unless scope binding delegated (key expects unit)
      [`${selector.prop.direct}, ${selector.prop.member}`]: (node: UsageNode) => check("prop", node),

      // jsx expression slot `<C prop={event}>`, `<C prop={model.event}>`
      // - dangerous unless scope binding delegated (prop expects unit)
      [`${selector.jsx.direct}, ${selector.jsx.member}`]: (node: UsageNode) => check("jsx", node),
    }
  },
})

type ComponentNode = Node.FunctionDeclaration | Node.FunctionExpression | Node.ArrowFunctionExpression
type UsageNode = Node.Identifier | Node.MemberExpression

const UseRegex = /^use[A-Z0-9].*$/

const selector = {
  callee: {
    direct: `CallExpression > Identifier.callee`,
    member: `CallExpression > MemberExpression[computed=false].callee`,
  },
  arg: {
    direct: `CallExpression > Identifier:not(.callee)`,
    member: `CallExpression > MemberExpression[computed=false]:not(.callee)`,
  },
  prop: {
    direct: `CallExpression > ObjectExpression > Property > Identifier.value`,
    member: `CallExpression > ObjectExpression > Property > MemberExpression[computed=false].value`,
  },
  jsx: {
    direct: `JSXExpressionContainer > Identifier`,
    member: `JSXExpressionContainer > MemberExpression[computed=false]`,
  },
}
