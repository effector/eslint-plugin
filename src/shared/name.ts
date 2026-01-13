import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

type FunctionNode = Node.FunctionDeclaration | Node.FunctionExpression | Node.ArrowFunctionExpression

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

export const nameOf = { function: functionToName }
