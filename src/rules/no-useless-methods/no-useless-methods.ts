import { TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"
import esquery from "esquery"
import type { Node as ESNode } from "estree"

import { createRule } from "@/shared/create"

export default createRule({
  name: "no-useless-methods",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid useless calls of `sample` and `guard`.",
    },
    messages: {
      uselessMethod:
        "Method `{{ method }}` does nothing in this case. You should assign the result to variable or pass `target` to it.",
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

    const query = {
      target: esquery.parse("!Property.properties > Identifier.key[name=target]"),
      // https://github.com/estools/esquery/pull/146
      watch: esquery.parse(
        "CallExpression:has(> MemberExpression.callee[property.name=watch]:has(> CallExpression.object))",
      ),
    }

    const usageStack: boolean[] = []

    type MethodCall = Node.CallExpression & { callee: Node.Identifier }

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
        if (isUsed) return

        if (node.parent.type === NodeType.CallExpression /* used as argument */) return

        const [config] = node.arguments

        if (config?.type === NodeType.ObjectExpression) {
          const [target] = esquery
            .match(config as ESNode, query.target, { visitorKeys })
            .map((node) => node as Node.Property)
            .filter((prop) => prop.parent === config)

          if (target) return
        }

        const grandparent = node.parent.parent
        if (grandparent) {
          const ancestry = source.getAncestors(grandparent) as ESNode[]
          const isWatched = esquery.matches(grandparent as ESNode, query.watch, ancestry, { visitorKeys })

          if (isWatched) return
        }

        const method = node.callee.name
        context.report({ node, messageId: "uselessMethod", data: { method } })
      },
    }
  },
})
