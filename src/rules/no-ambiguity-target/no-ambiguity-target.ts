import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"
import esquery from "esquery"
import type { Node as ESNode } from "estree"

import { createRule } from "@/shared/create"

export default createRule({
  name: "no-ambiguity-target",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid ambiguous target in `sample` and `guard`.",
    },
    messages: {
      ambiguous:
        "Method `{{ method }}` both specifies `target` option and assigns the result to a variable. Consider removing one of them.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const imports = new Set<string>()

    const source = context.sourceCode
    const visitorKeys = source.visitorKeys

    const PACKAGE_NAME = /^effector(?:\u002Fcompat)?$/

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`
    const methodSelector = `ImportSpecifier[imported.name=/(sample|guard)/]`

    const usageStack: boolean[] = []

    const query = {
      target: esquery.parse("!Property.properties > Identifier.key[name=target]"),
    }

    type MethodCall = Node.CallExpression & { callee: Node.Identifier }

    // TODO: Implement rule logic
    return {
      "ReturnStatement": () => usageStack.push(true),
      "ReturnStatement:exit": () => usageStack.pop(),

      "VariableDeclarator": () => usageStack.push(true),
      "VariableDeclarator:exit": () => usageStack.pop(),

      "ObjectExpression": () => usageStack.push(true),
      "ObjectExpression:exit": () => usageStack.pop(),

      "BlockStatement": () => usageStack.push(false),
      "BlockStatement:exit": () => usageStack.pop(),

      [`${importSelector} > ${methodSelector}`]: (node: Node.ImportSpecifier) => imports.add(node.local.name),

      [`CallExpression[callee.type="Identifier"]`]: (node: MethodCall) => {
        const isTracked = imports.has(node.callee.name)
        if (!isTracked) return

        const isUsed = usageStack.at(-1) ?? false
        if (!isUsed) return

        const [config] = node.arguments

        if (config?.type !== NodeType.ObjectExpression) /* can't have a target */ return

        const [target] = esquery
          .match(config as ESNode, query.target, { visitorKeys })
          .map((node) => node as Node.Property)
          .filter((prop) => prop.parent === config)

        if (!target) return

        context.report({ node, messageId: "ambiguous", data: { method: node.callee.name } })
      },
    }
  },
})
