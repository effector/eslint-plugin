import { AST_NODE_TYPES, type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

type FunctionNode = Node.FunctionDeclaration | Node.FunctionExpression | Node.ArrowFunctionExpression
type ValueNode = Node.Expression | Node.DestructuringPattern | null

function functionToName(node: FunctionNode): Node.Identifier | null {
  if (node.id) return node.id

  if (node.parent.type === NodeType.VariableDeclarator && node.parent.id.type === NodeType.Identifier)
    return node.parent.id

  if (node.parent.type === NodeType.AssignmentExpression && node.parent.left.type === NodeType.Identifier)
    return node.parent.left

  if (node.parent.type === NodeType.Property && node.parent.key.type === NodeType.Identifier) return node.parent.key

  if (node.parent.type === NodeType.AssignmentPattern && node.parent.left.type === NodeType.Identifier)
    return node.parent.left

  return null
}

export function getMemberExpressionName(node: Node.MemberExpression): string | null {
  if (node.computed) return null

  const prop = node.property
  if (prop.type !== AST_NODE_TYPES.Identifier) return null

  if (node.object.type === AST_NODE_TYPES.Identifier) {
    return `${node.object.name}.${prop.name}`
  }

  if (node.object.type === AST_NODE_TYPES.MemberExpression) {
    const objectName = getMemberExpressionName(node.object)
    return objectName !== null ? `${objectName}.${prop.name}` : null
  }

  return null
}

export function toName(key: string | number, node: ValueNode): string {
  if (!node) return `<blank at ${key}>`
  if (node.type === AST_NODE_TYPES.Identifier) return node.name
  if (node.type === AST_NODE_TYPES.Literal) return String(node.value)
  if (node.type === AST_NODE_TYPES.MemberExpression && node.property.type === AST_NODE_TYPES.Identifier) {
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

export const nameOf = { function: functionToName }
