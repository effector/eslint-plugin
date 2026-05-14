import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

type FunctionNode = Node.FunctionDeclaration | Node.FunctionExpression | Node.ArrowFunctionExpression

// infer function name from its declaration or assignment
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

// extract callee (function) name as invoked
function calleeToName(callee: Node.Expression): Node.Identifier | null {
  if (callee.type === NodeType.Identifier) return callee
  else if (callee.type === NodeType.MemberExpression && callee.property.type === NodeType.Identifier)
    return callee.property
  else return null
}

function simpleExpressionToName(node: Node.Expression): string | null {
  if (node.type === NodeType.Identifier) return node.name
  if (node.type === NodeType.MemberExpression && !node.computed) return node.property.name
  return null
}

export const nameOf = { function: functionToName, callee: calleeToName, expression: { simple: simpleExpressionToName } }
