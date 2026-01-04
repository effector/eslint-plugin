import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"

export default createRule({
  name: "require-pickup-in-persist",
  meta: {
    type: "problem",
    docs: {
      description: "Require every `persist` call of `effector-storage` to use `pickup`.",
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

    const importSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`

    type PersistCall = Node.CallExpression & { callee: Node.Identifier; arguments: [Node.ObjectExpression] }

    return {
      [`${importSelector} > ${selector.persist}`]: (node: Node.ImportSpecifier) => imports.add(node.local.name),

      [`CallExpression${selector.call}${selector.config}`]: (node: PersistCall) => {
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

/**
 * Finds `effector-storage` packages, scoped and unscoped, including
 * contents of these packages. See examples for a full list.
 */
const PACKAGE_NAME = /^@?effector-storage(\u002F[\w-]+)*$/

const selector = {
  persist: `ImportSpecifier[imported.name="persist"]`,
  call: `[callee.type="Identifier"]`,
  config: `[arguments.length=1][arguments.0.type="ObjectExpression"]`,
}
