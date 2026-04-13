import { type TSESTree as Node } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { PACKAGE_NAME } from "@/shared/package"

import { type MessageIds, check, listToKeyMap, shapeToKeyMap } from "./lib"

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
  name: "enforce-exhaustive-useUnit-destructuring",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure all units passed to useUnit are properly destructured.",
    },
    messages: {
      unusedKey: 'Property "{{name}}" is passed but not destructured.',
      missingKey: 'Property "{{name}}" is destructured but not passed in the unit object.',
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    const importedAs = new Set<string>()

    return {
      [selector.import]: (node: Node.ImportSpecifier) => void importedAs.add(node.local.name),

      [`${selector.variable.shape}:has(> ${selector.call}:has(${selector.arg.shape}))`](node: ShapeCall): void {
        if (!importedAs.has(node.init.callee.name)) return

        const objectArgument = node.init.arguments[0]
        const objectPattern = node.id

        const provided = shapeToKeyMap(objectArgument)
        const consumed = shapeToKeyMap(objectPattern)

        if (provided === null || consumed === null) return

        for (const { type, name } of check(provided, consumed)) {
          if (type === "unused") context.report({ node: objectArgument, messageId: "unusedKey", data: { name } })
          else context.report({ node: objectPattern, messageId: "missingKey", data: { name } })
        }
      },

      [`${selector.variable.list}:has(> ${selector.call}:has(${selector.arg.list}))`](node: ListCall): void {
        if (!importedAs.has(node.init.callee.name)) return

        const arrayArgument = node.init.arguments[0]
        const arrayPattern = node.id

        const provided = listToKeyMap(arrayArgument)
        const consumed = listToKeyMap(arrayPattern)

        if (provided === null || consumed === null) return

        for (const { type, name } of check(provided, consumed)) {
          if (type === "unused") context.report({ node: arrayArgument, messageId: "unusedKey", data: { name } })
          else context.report({ node: arrayPattern, messageId: "missingKey", data: { name } })
        }
      },
    }
  },
})
