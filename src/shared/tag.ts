const code = (code: TemplateStringsArray, ...insert: string[]) =>
  String.raw({ raw: code.raw }, ...insert).replaceAll(/(^\n*|\n*$)/g, "")

export { code as ts, code as tsx }
