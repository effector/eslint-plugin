import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"

export default createRule({
  name: "require-pickup-in-persist",
  meta: {
    type: "problem",
    docs: {
      description: "Requires every `persist` call of `effector-storage` to use `pickup`.",
    },
    messages: {
      missing:
        "This `persist` call does not specify a `pickup` event that is required for scoped usage of `effector-storage`.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const imports = new Set<string>()

    /**
     * Finds `effector-storage` packages, scoped and unscoped, including
     * contents of these packages. See examples for a full list.
     */
    const PACKAGE_NAME = /^@?effector-storage(\u002F[\w-]+)*$/

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`
    const persistSelector = `ImportSpecifier[imported.name="persist"]`

    const callSelector = `[callee.type="Identifier"]`
    const configSelector = `[arguments.length=1][arguments.0.type="ObjectExpression"]`

    type PersistCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }

    return {
      [`${importSelector} > ${persistSelector}`]: (node: Node.ImportSpecifier) => imports.add(node.local.name),

      [`CallExpression${callSelector}${configSelector}`]: (node: PersistCall) => {
        if (!imports.has(node.callee.name)) return

        const config = node.arguments[0]

        if (
          config.properties
            .filter((prop) => prop.type === NodeType.Property)
            .map((prop) => prop.key)
            .filter((key) => key.type === NodeType.Identifier)
            .some((key) => key.name === "pickup")
        )
          return

        context.report({ node, messageId: "missing" })
      },
    }
  },
})
