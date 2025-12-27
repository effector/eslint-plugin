const code = (strings: TemplateStringsArray, ...insert: string[]) => {
  const code = String.raw({ raw: strings.raw }, ...insert).replaceAll(/(^\n*|\n*$)/g, "")

  const lines = code.split("\n")
  const indent = code.search(/\S|$/)

  return lines.map((line) => line.slice(indent)).join("\n")
}

export { code as ts, code as tsx }
