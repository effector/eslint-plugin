const { RuleTester } = require("eslint");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./prefer-scope-imports");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("effector/prefer-scope-imports.test", rule, {
  valid: [
    ...["correct.js"].map(readExampleForTheRule),
    ...["import { useUnit, useList } from 'effector-solid/scope';"].map(
      (code) => ({ code })
    ),
    {
      code: "import { useUnit, useList } from '@farfetched/core';",
    },
    {
      code: "import { useUnit, useList } from 'effector-react/core';",
    },
  ],

  invalid: [
    ...["incorrect.js"].map(readExampleForTheRule).map((result) => ({
      ...result,
      errors: [
        {
          messageId: "preferScope",
          type: "ImportDeclaration",
          suggestions: [
            {
              messageId: "preferScope",
              output:
                "import { useUnit, useList } from 'effector-react/scope';",
            },
          ],
        },
      ],
    })),
    {
      code: "import { useUnit, useList } from '@farfetched/core';",
      options: [{ packages: ["@farfetched/core"] }],
      errors: [
        {
          messageId: "preferScope",
          type: "ImportDeclaration",
          suggestions: [
            {
              messageId: "preferScope",
              output:
                "import { useUnit, useList } from '@farfetched/core/scope';",
            },
          ],
        },
      ],
    },
    {
      code: "import { useUnit, useList } from 'effector-solid';",
      errors: [
        {
          messageId: "preferScope",
          type: "ImportDeclaration",
          suggestions: [
            {
              messageId: "preferScope",
              output:
                "import { useUnit, useList } from 'effector-solid/scope';",
            },
          ],
        },
      ],
    },
  ],
});
