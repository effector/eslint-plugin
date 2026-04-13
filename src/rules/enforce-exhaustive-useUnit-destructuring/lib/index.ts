import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

export type MessageIds = "unusedKey" | "missingKey"
type ValueNode = Node.Expression | Node.DestructuringPattern | null

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
