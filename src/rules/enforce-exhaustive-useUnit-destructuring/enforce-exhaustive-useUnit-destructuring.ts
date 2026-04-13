import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { PACKAGE_NAME } from "@/shared/package"

type Options = []

type MessageIds = "unusedKey" | "missingKey"
type ValueNode = Node.Expression | Node.DestructuringPattern | null

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

function toName(key: string | number, node: ValueNode): string {
  if (!node) return `<blank at ${key}>`
  if (node.type === NodeType.Identifier) return node.name
  if (node.type === NodeType.Literal) return String(node.value)
  if (node.type === NodeType.MemberExpression && node.property.type === NodeType.Identifier) {
    return `${toName(key, node.object)}.${node.property.name}`
  }
  return `<unknown at ${key}>`
}

export function* check(
  provided: Map<string | number, ValueNode>,
  consumed: Map<string | number, ValueNode>,
): Generator<{ type: "unused" | "missing"; name: string }> {
  for (const [key, node] of provided) {
    if (!consumed.has(key)) yield { type: "unused", name: toName(key, node) }
  }
  for (const [key, node] of consumed) {
    if (!provided.has(key)) yield { type: "missing", name: toName(key, node) }
  }
}

function toKey(prop: Node.Property): string | number | null {
  if (prop.computed) return null
  if (prop.key.type === NodeType.Identifier) return prop.key.name
  if (prop.key.type === NodeType.Literal) return prop.key.value
  return null
}

export function shapeToKeyMap(
  shape: Node.ObjectPattern | Node.ObjectExpression,
): Map<string | number, ValueNode> | null {
  const map = new Map<string | number, ValueNode>()

  for (const prop of shape.properties) {
    if (prop.type !== NodeType.Property) return null

    const key = toKey(prop)

    if (key === null) return null

    map.set(key, prop.key)
  }

  return map
}

export function listToKeyMap(list: Node.ArrayPattern | Node.ArrayExpression): Map<string | number, ValueNode> | null {
  const map = new Map<string | number, ValueNode>()

  for (const [index, element] of list.elements.entries()) {
    if (element === null) continue
    if (element.type === NodeType.RestElement || element.type === NodeType.SpreadElement) return null

    map.set(index, element as ValueNode)
  }

  return map
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

        const provided = shapeToKeyMap(node.init.arguments[0])
        const consumed = shapeToKeyMap(node.id)

        if (provided === null || consumed === null) return

        for (const { type, name } of check(provided, consumed)) {
          if (type === "unused")
            context.report({ node: node.init.arguments[0], messageId: "unusedKey", data: { name } })
          else context.report({ node: node.id, messageId: "missingKey", data: { name } })
        }
      },

      [`${selector.variable.list}:has(> ${selector.call}:has(${selector.arg.list}))`](node: ListCall): void {
        if (!importedAs.has(node.init.callee.name)) return

        const provided = listToKeyMap(node.init.arguments[0])
        const consumed = listToKeyMap(node.id)

        if (provided === null || consumed === null) return

        for (const { type, name } of check(provided, consumed)) {
          if (type === "unused")
            context.report({ node: node.init.arguments[0], messageId: "unusedKey", data: { name } })
          else context.report({ node: node.id, messageId: "missingKey", data: { name } })
        }
      },
    }
  },
})
