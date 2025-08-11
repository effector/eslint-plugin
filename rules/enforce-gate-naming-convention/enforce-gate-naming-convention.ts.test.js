const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");

const rule = require("./enforce-gate-naming-convention");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx"],
      },
      tsconfigRootDir: join(__dirname, "../.."),
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run("enforce-gate-naming-convention.ts.test", rule, {
  valid: ["correct-gate-naming.ts"].map(readExampleForTheRule),

  invalid: [
    // Errors
    ...["incorrect-gate-naming.ts"]
      .map(readExampleForTheRule)
      .map((result) => ({
        ...result,
        errors: [
          {
            messageId: "invalidName",
            type: "VariableDeclarator",
            suggestions: [
              {
                messageId: "renameGate",
                output: result.code.replace("justGate", "JustGate"),
              },
            ],
          },
        ],
      })),
  ],
});
