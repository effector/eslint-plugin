import {
  ASTUtils,
  ESLintUtils,
  type TSESTree as Node,
  AST_NODE_TYPES as NodeType,
  TSESLint,
} from "@typescript-eslint/utils"

import { createRule } from "@/shared/create"
import { isType } from "@/shared/is"

type Scope = TSESLint.Scope.Scope

export default createRule({
  name: "no-duplicate-on",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid duplicate `.on` calls on Stores.",
    },
    messages: {
      duplicate: "Method `.on` is called on store `{{ store }}` more than once for `{{ unit }}`.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const services = ESLintUtils.getParserServices(context)

    type StoreOnCall = Node.CallExpression & { callee: Node.MemberExpression & { property: Node.Identifier } }

    const map = new Map<string, Set<string>>()

    return {
      [`CallExpression[callee.property.name="on"]`]: (node: StoreOnCall) => {
        const type = services.getTypeAtLocation(node.callee.object)

        const isStore = isType.store(type, services.program)
        if (!isStore) return

        const arg = node.arguments[0]
        if (!arg || arg.type === NodeType.SpreadElement) return

        const units =
          arg.type === NodeType.ArrayExpression
            ? arg.elements.filter((item) => item !== null && item.type !== NodeType.SpreadElement)
            : [arg]

        const scope = context.sourceCode.getScope(node)

        const store = identify("store", node.callee.object, scope)
        if (!store) return

        const set = map.get(store.id) ?? new Set<string>()

        for (const unit of units) {
          const instance = identify("unit", unit, scope)
          if (!instance) continue

          if (set.has(instance.id)) {
            const data = { store: store.name, unit: instance.name }
            context.report({ messageId: "duplicate", node: unit, data: data })
          } else set.add(instance.id)
        }

        map.set(store.id, set)
      },
    }
  },
})

type NodeReference = { node: Node.Identifier; path: string[] }

// traverse plain member expression
function traverseToRoot(node: Node.Expression, path: string[] = []): NodeReference | null {
  if (node.type === NodeType.Identifier) return { node, path }

  if (node.type === NodeType.MemberExpression && node.property.type === NodeType.Identifier)
    return traverseToRoot(node.object, [node.property.name, ...path])

  return null
}

const STORE_METHODS = ["on", "reset"]

// traverse member expression bypassing store identity methods
function traverseStoreToRoot(node: Node.Expression, path: string[] = []): NodeReference | null {
  if (node.type === NodeType.Identifier) return { node, path }

  if (node.type === NodeType.MemberExpression && node.property.type === NodeType.Identifier)
    return traverseStoreToRoot(node.object, [node.property.name, ...path])

  if (node.type === NodeType.CallExpression && node.callee.type === NodeType.MemberExpression)
    if (node.callee.property.type === NodeType.Identifier && STORE_METHODS.includes(node.callee.property.name))
      return traverseStoreToRoot(node.callee.object, path)

  return null
}

// find parent variable declarator for store
function raiseStoreToVariable(node: Node.Expression): Node.VariableDeclarator | null {
  let current: Node.Node = node

  while (current.parent) {
    if (current.parent.type === NodeType.VariableDeclarator) return current.parent

    // current.method
    if (current.parent.type !== NodeType.MemberExpression || current.parent.object !== current) return null

    // method === "on" | "reset"
    if (current.parent.property.type !== NodeType.Identifier || !STORE_METHODS.includes(current.parent.property.name))
      return null

    // current.method*()*
    const grandparent: Node.Node | undefined = current.parent.parent
    if (grandparent?.type !== NodeType.CallExpression || grandparent.callee !== current.parent) return null

    current = current.parent.parent
  }

  return null
}

function findSuitableRoot(type: "unit" | "store", node: Node.Expression): NodeReference | null {
  if (type === "unit") return traverseToRoot(node)

  const root = traverseStoreToRoot(node)
  if (root) return root

  const declarator = raiseStoreToVariable(node)
  if (declarator && declarator.id.type === NodeType.Identifier) return { node: declarator.id, path: [] }

  return null
}

function identify(type: "unit" | "store", node: Node.Expression, scope: Scope) {
  const root = findSuitableRoot(type, node)
  if (!root) return null

  const variable = ASTUtils.findVariable(scope, root.node)
  if (!variable) return null

  return { id: `${variable.$id}+${root.path.join(".")}`, name: [variable.name, ...root.path].join(".") }
}
