export const ts = (code: TemplateStringsArray, ...insert: string[]) =>
  code.flatMap((part, index) => [part, insert[index] ?? ""]).join("")

export const tsx = (code: TemplateStringsArray) => code.join("")
