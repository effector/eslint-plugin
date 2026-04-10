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
    const importedAs = new Set<string>()

    function getPropertyKey(prop: TSESTree.Property | TSESTree.RestElement | TSESTree.SpreadElement): string | null {
      if (prop.type !== AST_NODE_TYPES.Property) return null

      if (prop.key.type === AST_NODE_TYPES.Identifier && !prop.computed) {
        return prop.key.name
      }

      if (prop.key.type === AST_NODE_TYPES.Literal && typeof prop.key.value === "string" && !prop.computed) {
        return prop.key.value
      }

      return null
    }

    function getObjectKeys(
      objectArgument: TSESTree.ObjectExpression,
      objectPattern: TSESTree.ObjectPattern,
    ): { argumentKeys: string[]; destructuredKeys: string[]; keyToName: Map<string, string> } {
      const argumentKeys = objectArgument.properties.map(getPropertyKey).filter((key): key is string => key !== null)

      const destructuredKeys = objectPattern.properties.map(getPropertyKey).filter((key): key is string => key !== null)

      // For objects key itself is the display name
      const keyToName = new Map(argumentKeys.map((key) => [key, key]))

      return { argumentKeys, destructuredKeys, keyToName }
    }

    function getArrayKeys(
      arrayArgument: TSESTree.ArrayExpression,
      arrayPattern: TSESTree.ArrayPattern,
    ): { argumentKeys: string[]; destructuredKeys: string[]; keyToName: Map<string, string> } {
      const argumentKeys: string[] = []
      const keyToName = new Map<string, string>()

      arrayArgument.elements.forEach((el, i) => {
        if (el === null || el.type === AST_NODE_TYPES.SpreadElement) return

        const key = String(i)
        argumentKeys.push(key)

        if (el.type === AST_NODE_TYPES.Identifier) {
          keyToName.set(key, el.name)
        } else if (el.type === AST_NODE_TYPES.MemberExpression) {
          keyToName.set(key, context.sourceCode.getText(el))
        } else {
          keyToName.set(key, key)
        }
      })

      const destructuredKeys = arrayPattern.elements
        .map((el, i) => (el !== null && el.type !== AST_NODE_TYPES.RestElement ? String(i) : null))
        .filter((key): key is string => key !== null)

      return { argumentKeys, destructuredKeys, keyToName }
    }

    function handlePattern(
      argumentKeys: string[],
      destructuredKeys: string[],
      keyToName: Map<string, string>,
      argumentNode: TSESTree.ArrayExpression | TSESTree.ObjectExpression,
      patternNode: TSESTree.ArrayPattern | TSESTree.ObjectPattern,
    ): void {
      for (const key of argumentKeys) {
        if (!destructuredKeys.includes(key)) {
          context.report({
            node: argumentNode,
            messageId: "unusedKey",
            data: { key: keyToName.get(key) ?? key },
          })
        }
      }

      for (const key of destructuredKeys) {
        if (!argumentKeys.includes(key)) {
          context.report({
            node: patternNode,
            messageId: "missingKey",
            data: { key },
          })
        }
      }
    }

    return {
      ImportDeclaration(node): void {
        if (node.source.value !== "effector-react") return

        for (const specifier of node.specifiers) {
          if (
            specifier.type === AST_NODE_TYPES.ImportSpecifier &&
            specifier.imported.type === AST_NODE_TYPES.Identifier &&
            specifier.imported.name === "useUnit"
          ) {
            importedAs.add(specifier.local.name)
          }
        }
      },

      CallExpression(node): void {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          !importedAs.has(node.callee.name) ||
          node.arguments.length !== 1
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

        if (argument?.type === AST_NODE_TYPES.ObjectExpression && parent.id.type === AST_NODE_TYPES.ObjectPattern) {
          const { argumentKeys, destructuredKeys, keyToName } = getObjectKeys(argument, parent.id)
          handlePattern(argumentKeys, destructuredKeys, keyToName, argument, parent.id)
        }

        if (argument?.type === AST_NODE_TYPES.ArrayExpression && parent.id.type === AST_NODE_TYPES.ArrayPattern) {
          const { argumentKeys, destructuredKeys, keyToName } = getArrayKeys(argument, parent.id)
          handlePattern(argumentKeys, destructuredKeys, keyToName, argument, parent.id)
        }
      },
    }
  },
})
