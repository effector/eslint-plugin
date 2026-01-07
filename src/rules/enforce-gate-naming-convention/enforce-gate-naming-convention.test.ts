import path from "path"

import { RuleTester } from "@typescript-eslint/rule-tester"
import { parser } from "typescript-eslint"

import { ts } from "@/shared/tag"

import rule from "./enforce-gate-naming-convention"

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.fixture.json" },
    },
  },
})

const fixture = (file: string) => path.resolve(__dirname, "fixtures", file)

ruleTester.run("enforce-gate-naming-convention", rule, {
  valid: [
    {
      name: "classic",
      code: ts`
        import { createGate } from "effector-react"

        const SomeGate = createGate()
      `,
    },
    {
      name: "from factory",
      code: ts`
        import { createGate } from "effector-react"

        const createCustomGate = () => createGate()

        const CustomGate = createCustomGate()
      `,
    },
    {
      name: "from import",
      code: ts`
        import { MyGate } from "${fixture("gate")}"

        const RenamedGate = MyGate
      `,
    },
    {
      name: "unrelated type",
      code: ts`
        class Gate {}

        const value = 42
        const gate = value > 10 ? new Gate() : null
      `,
    },
  ],
  invalid: [
    {
      name: "classic",
      code: ts`
        import { createGate } from "effector-react"

        const someGate = createGate()
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "someGate", fixed: "SomeGate" },
              output: ts`
                import { createGate } from "effector-react"

                const SomeGate = createGate()
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from factory",
      code: ts`
        import { createGate } from "effector-react"

        const createCustomGate = () => createGate()

        const customGate = createCustomGate()
      `,
      errors: [
        {
          messageId: "invalid",
          line: 5,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "customGate", fixed: "CustomGate" },
              output: ts`
                import { createGate } from "effector-react"

                const createCustomGate = () => createGate()

                const CustomGate = createCustomGate()
              `,
            },
          ],
        },
      ],
    },
    {
      name: "from import",
      code: ts`
        import { MyGate } from "${fixture("gate")}"

        const renamedGate = MyGate
      `,
      errors: [
        {
          messageId: "invalid",
          line: 3,
          suggestions: [
            {
              messageId: "rename",
              data: { current: "renamedGate", fixed: "RenamedGate" },
              output: ts`
                import { MyGate } from "${fixture("gate")}"

                const RenamedGate = MyGate
              `,
            },
          ],
        },
      ],
    },
  ],
})
