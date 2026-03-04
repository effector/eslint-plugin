import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"

type MessageIds = "unusedKey" | "missingKey" | "implicitSubscription"
type Options = []

export default createRule<Options, MessageIds>({
  name: "use-unit-destructuring",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure destructured properties match the passed unit object/array",
    },
    messages: {
      unusedKey: 'Property "{{key}}" is passed but not destructured',
      missingKey: 'Property "{{key}}" is destructured but not passed in the unit object',
      implicitSubscription:
        "Element at index {{index}} ({{name}}) is passed but not destructured, causing implicit subscription",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function handleObjectPattern(
      objectArgument: TSESTree.ObjectExpression,
      objectPattern: TSESTree.ObjectPattern,
    ): void {
      // Collect all keys from argument object
      const argumentKeys = new Set(
        objectArgument.properties
          .filter(
            (prop): prop is TSESTree.Property =>
              prop.type === AST_NODE_TYPES.Property && prop.key.type === AST_NODE_TYPES.Identifier,
          )
          .map((prop) => (prop.key as TSESTree.Identifier).name),
      )

      // Collect destructured keys
      const destructuredKeys = new Set(
        objectPattern.properties
          .filter(
            (prop): prop is TSESTree.Property =>
              prop.type === AST_NODE_TYPES.Property && prop.key.type === AST_NODE_TYPES.Identifier,
          )
          .map((prop) => (prop.key as TSESTree.Identifier).name),
      )

      // Check unused keys
      for (const key of argumentKeys) {
        if (!destructuredKeys.has(key)) {
          context.report({
            node: objectArgument,
            messageId: "unusedKey",
            data: { key },
          })
        }
      }

      // Check missing keys
      for (const key of destructuredKeys) {
        if (!argumentKeys.has(key)) {
          context.report({
            node: objectPattern,
            messageId: "missingKey",
            data: { key },
          })
        }
      }
    }

    function handleArrayPattern(arrayArgument: TSESTree.ArrayExpression, arrayPattern: TSESTree.ArrayPattern): void {
      const argumentElements = arrayArgument.elements
      const destructuredElements = arrayPattern.elements

      const destructuredCount = destructuredElements.filter((el) => el !== null).length
      const argumentCount = argumentElements.filter((el) => el !== null).length

      if (destructuredCount >= argumentCount) return

      // If undestructured elements exists
      for (let i = destructuredCount; i < argumentCount; i++) {
        const element = argumentElements[i]
        if (!element || element.type === AST_NODE_TYPES.SpreadElement) continue

        let name = "unknown"

        if (element.type === AST_NODE_TYPES.Identifier) {
          name = element.name
        } else if (element.type === AST_NODE_TYPES.MemberExpression) {
          name = context.sourceCode.getText(element)
        }

        context.report({
          node: element,
          messageId: "implicitSubscription",
          data: {
            index: i,
            name,
          },
        })
      }
    }

    return {
      CallExpression(node): void {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== "useUnit" ||
          node.arguments.length === 0
        ) {
          return
        }

        const argument = node.arguments[0]
        const parent = node.parent

        if (
          !parent ||
          parent.type !== AST_NODE_TYPES.VariableDeclarator ||
          argument?.type === AST_NODE_TYPES.SpreadElement
        ) {
          return
        }

        // Shape is Object-like
        if (argument?.type === AST_NODE_TYPES.ObjectExpression && parent.id.type === AST_NODE_TYPES.ObjectPattern) {
          handleObjectPattern(argument, parent.id)
        }

        // Shape is Array-like
        if (argument?.type === AST_NODE_TYPES.ArrayExpression && parent.id.type === AST_NODE_TYPES.ArrayPattern) {
          handleArrayPattern(argument, parent.id)
        }
      },
    }
  },
})
