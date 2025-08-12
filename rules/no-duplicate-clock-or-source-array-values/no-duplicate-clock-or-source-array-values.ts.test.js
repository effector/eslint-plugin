const { RuleTester } = require("@typescript-eslint/rule-tester");
const { join } = require("path");

const { readExample } = require("../../utils/read-example");
const rule = require("./no-duplicate-clock-or-source-array-values");

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
});

const readExampleForTheRule = (name) => ({
  code: readExample(__dirname, name),
  filename: join(__dirname, "examples", name),
});

ruleTester.run(
  "no-duplicate-clock-or-source-array-values.ts.test",
  rule,
  {
    valid: ["correct-sample.ts"].map(readExampleForTheRule),

    invalid: [
      ...["incorrect-sample.ts"].map(readExampleForTheRule).map((result) => ({
        ...result,
        errors: [
          {
            messageId: "duplicatesInSource",
            type: "Identifier",
            suggestions: [
              {
                messageId: "removeDuplicate",
                output: result.code.replace("$store, $store", "$store, "), // ESLint removes node but leaves trailing comma
              },
            ],
          },
          {
            messageId: "duplicatesInClock",
            type: "MemberExpression",
            suggestions: [
              {
                messageId: "removeDuplicate",
                output: result.code.replace("setUnloadDeliveryDateFx.doneData,\n  ],", ",\n  ],"), // Remove duplicate but leave comma
              },
            ],
          },
        ],
      })),
      ...["incorrect-guard.ts"].map(readExampleForTheRule).map((result) => ({
        ...result,
        errors: [
          {
            messageId: "duplicatesInClock", 
            type: "MemberExpression",
            suggestions: [
              {
                messageId: "removeDuplicate",
                output: result.code.replace("    clickOnBtn,\n    setUnloadDeliveryDateFx.doneData,", "    clickOnBtn,\n    ,"), // Remove duplicate, leave comma
              },
            ],
          },
        ],
      })),
    ],
  }
);
