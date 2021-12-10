const {
  expressionHasEffectorType,
  variableHasEffectorType,
} = require("./has-effector-type");
const { isStoreNameValid } = require("./naming");

const is = {
  variable: {
    store({ context, node }) {
      // TypeScript-way
      if (context.parserServices.hasFullTypeInformation) {
        return variableHasEffectorType({
          node,
          possibleTypes: ["Store"],
          context,
        });
      }

      // JavaScript-way
      return isStoreNameValid({ name: node?.name, context });
    },
  },
  expression: {
    store({ context, node }) {
      // TypeScript-way
      if (context.parserServices.hasFullTypeInformation) {
        return expressionHasEffectorType({
          node,
          possibleTypes: ["Store"],
          context,
        });
      }

      // JavaScript-way
      return isStoreNameValid({ name: node?.name, context });
    },
  },
};

module.exports = { is };
