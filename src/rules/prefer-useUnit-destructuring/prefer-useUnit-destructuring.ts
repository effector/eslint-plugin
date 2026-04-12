import { type TSESTree as Node } from "@typescript-eslint/utils"

import { createRule, listToKeyMap, shapeToKeyMap } from "@/shared/create"
import { check } from "@/shared/name"
import { PACKAGE_NAME } from "@/shared/package"

type MessageIds = "unusedKey" | "missingKey"
type Options = []

type ShapeCall = Node.VariableDeclarator & {
  init: Node.CallExpression & {
    callee: Node.Identifier
    arguments: [Node.ObjectExpression]
  }
  id: Node.ObjectPattern
}

type ListCall = Node.VariableDeclarator & {
  init: Node.CallExpression & {
    callee: Node.Identifier
    arguments: [Node.ArrayExpression]
  }
  id: Node.ArrayPattern
}

const selector = {
  import: `ImportDeclaration[source.value=${PACKAGE_NAME.react}] > ImportSpecifier[imported.name=useUnit]`,
  variable: {
    shape: "VariableDeclarator[id.type=ObjectPattern]",
    list: "VariableDeclarator[id.type=ArrayPattern]",
  },
  call: "CallExpression.init[arguments.length=1][callee.type=Identifier]",
  arg: {
    shape: "ObjectExpression.arguments",
    list: "ArrayExpression.arguments",
  },
} as const

export default createRule<Options, MessageIds>({
  name: "prefer-useUnit-destructuring",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure destructured properties match the passed unit object/array",
    },
    messages: {
      unusedKey: 'Property "{{key}}" is passed but not destructured.',
      missingKey: 'Property "{{key}}" is destructured but not passed in the unit object.',
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    const importedAs = new Set<string>()

    function handleObjectPattern(objectArgument: Node.ObjectExpression, objectPattern: Node.ObjectPattern): void {
      const provided = shapeToKeyMap(objectArgument)
      const consumed = shapeToKeyMap(objectPattern)

      if (provided === null || consumed === null) return

      for (const { type, name } of check(provided, consumed)) {
        if (type === "unused") context.report({ node: objectArgument, messageId: "unusedKey", data: { key: name } })
        else context.report({ node: objectPattern, messageId: "missingKey", data: { key: name } })
      }
    }

    function handleArrayPattern(arrayArgument: Node.ArrayExpression, arrayPattern: Node.ArrayPattern): void {
      const provided = listToKeyMap(arrayArgument)
      const consumed = listToKeyMap(arrayPattern)

      if (provided === null || consumed === null) return

      for (const { type, name } of check(provided, consumed)) {
        if (type === "unused") context.report({ node: arrayArgument, messageId: "unusedKey", data: { key: name } })
        else context.report({ node: arrayPattern, messageId: "missingKey", data: { key: name } })
      }
    }

    return {
      [selector.import]: (node: Node.ImportSpecifier) => void importedAs.add(node.local.name),

      [`${selector.variable.shape}:has(> ${selector.call}:has(${selector.arg.shape}))`](node: ShapeCall): void {
        if (!importedAs.has(node.init.callee.name)) return
        handleObjectPattern(node.init.arguments[0], node.id)
      },

      [`${selector.variable.list}:has(> ${selector.call}:has(${selector.arg.list}))`](node: ListCall): void {
        if (!importedAs.has(node.init.callee.name)) return
        handleArrayPattern(node.init.arguments[0], node.id)
      },
    }
  },
})
