const {
  expressionHasEffectorType,
  variableHasEffectorType,
} = require("./has-effector-type");
const { isStoreNameValid, isEffectNameValid } = require("./naming");

const is = {
  variable: {
    store({ context, node }) {
      if (context.parserServices.hasFullTypeInformation) {
        return variableHasEffectorType({
          node,
          possibleTypes: ["Store"],
          context,
        });
      }

      return isStoreNameValid({ name: node?.name, context });
    },
    effect({ context, node }) {
      if (context.parserServices.hasFullTypeInformation) {
        return variableHasEffectorType({
          node,
          possibleTypes: ["Effect"],
          context,
        });
      }

      return isEffectNameValid({ name: node?.name, context });
    },
  },
  expression: {
    store({ context, node }) {
      if (context.parserServices.hasFullTypeInformation) {
        return expressionHasEffectorType({
          node,
          possibleTypes: ["Store"],
          context,
        });
      }

      return isStoreNameValid({ name: node?.name, context });
    },
    effect({ context, node }) {
      if (context.parserServices.hasFullTypeInformation) {
        return expressionHasEffectorType({
          node,
          possibleTypes: ["Effect"],
          context,
        });
      }

      return isEffectNameValid({ name: node?.name, context });
    },
  },
};

module.exports = { is };
