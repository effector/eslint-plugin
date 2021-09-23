const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbids unnecessary combinations in `clock`, `source` and `forward`",
      category: "Quality",
      recommended: true,
    },
    messages: {
      unnecessaryCombination:
        "Method {{ methodName }} is used under the hood, you can omit it.",
    },
    schema: [],
  },
  create(context) {
    const importedFromEffector = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFromEffector(importedFromEffector, node);
      },
      CallExpression(node) {},
    };
  },
};
