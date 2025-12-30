import { type TSESTree as Node, AST_NODE_TYPES as NodeType } from "@typescript-eslint/utils"

type RegularProperty = Node.Property & { key: Node.Identifier }

const property = (key: string, node: Node.ObjectExpression) =>
  node.properties.find(
    (prop): prop is RegularProperty =>
      prop.type == NodeType.Property && prop.key.type === NodeType.Identifier && prop.key.name === key,
  )

export const locate = { property }
