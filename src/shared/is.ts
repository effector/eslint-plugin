import { typeMatchesSpecifier } from "@typescript-eslint/type-utils"
import { type Program, type Symbol, type Type } from "typescript"

const check = (symbol: Symbol, types: string[], from: string) => {
  const name = symbol.getName()
  const declarations = symbol.declarations ?? []

  return (
    types.includes(name) &&
    declarations
      .map((decl) => decl.getSourceFile().fileName)
      .some((fname) => fname.includes("node_modules") && fname.includes(from))
  )
}

export const isType = {
  store: (type: Type, program: Program) =>
    typeMatchesSpecifier(type, { from: "package", package: "effector", name: ["Store", "StoreWritable"] }, program),

  event: (type: Type, program: Program) =>
    typeMatchesSpecifier(type, { from: "package", package: "effector", name: ["Event", "EventCallable"] }, program),

  effect: (type: Type, program: Program) =>
    typeMatchesSpecifier(type, { from: "package", package: "effector", name: "Effect" }, program),

  unit: (type: Type, program: Program) => {
    const name = ["Store", "StoreWritable", "Event", "EventCallable", "Effect"]
    return typeMatchesSpecifier(type, { from: "package", package: "effector", name }, program)
  },

  domain: (type: Type, program: Program) =>
    typeMatchesSpecifier(type, { from: "package", package: "effector", name: "Domain" }, program),

  // gate is itself an alias to react component, so `typeMatchesSpecifier` doesn't work here
  gate: (type: Type) => {
    const symbol = type.getSymbol() ?? type.aliasSymbol
    return symbol ? check(symbol, ["Gate"], "effector") : false
  },

  jsx: (type: Type, program: Program) => {
    const name = ["Element", "ReactNode", "ReactElement"]
    return typeMatchesSpecifier(type, { from: "package", package: "react", name }, program)
  },

  component: (type: Type, program: Program) => {
    const name = ["FC", "FunctionComponent", "ComponentType", "ComponentClass", "ForwardRefRenderFunction"]
    return typeMatchesSpecifier(type, { from: "package", package: "react", name }, program)
  },
}
