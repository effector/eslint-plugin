import { AST_NODE_TYPES, ESLintUtils, type TSESTree as Node } from "@typescript-eslint/utils"

export const createRule = ESLintUtils.RuleCreator((name) => `https://eslint.effector.dev/rules/${name}`)

type ShapeProperty = Node.Property | Node.RestElement | Node.SpreadElement
type ValueNode = Exclude<Node.DestructuringPattern, Node.RestElement> | null

export function toKey(prop: ShapeProperty): string | number | null {
  if (prop.type !== AST_NODE_TYPES.Property || prop.computed) return null
  if (prop.key.type === AST_NODE_TYPES.Identifier) return prop.key.name
  if (prop.key.type === AST_NODE_TYPES.Literal) return prop.key.value
  return null
}

export function shapeToKeyMap(
  shape: Node.ObjectPattern | Node.ObjectExpression,
): Map<string | number, ValueNode> | null {
  const map = new Map<string | number, ValueNode>()

  for (const prop of shape.properties) {
    if (prop.type === AST_NODE_TYPES.RestElement || prop.type === AST_NODE_TYPES.SpreadElement) return null
    const key = toKey(prop)
    if (key === null) return null
    map.set(key, prop.key as ValueNode)
  }

  return map
}

export function listToKeyMap(list: Node.ArrayPattern | Node.ArrayExpression): Map<string | number, ValueNode> | null {
  const map = new Map<string | number, ValueNode>()

  for (const [index, element] of list.elements.entries()) {
    if (element?.type === AST_NODE_TYPES.RestElement || element?.type === AST_NODE_TYPES.SpreadElement) return null
    if (element === null) continue
    map.set(index, element as ValueNode)
  }

  return map
}
