const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer `sample` over `forward` with `.map`/`.prepend`",
      category: "Quality",
      recommended: true,
    },
    messages: {
      overMap: "Instead of `forward` with `{{ eventName }}.map` you can use `sample`",
      overPrepend: "Instead of `forward` with `{{ eventName }}.prepend` you can use `sample`",
    },
    schema: [],
  },
  create(context) {
    const importedFromEffector = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFromEffector(importedFromEffector, node);
      },
      CallExpression(node) {
        const localMethod = importedFromEffector.get("forward");
        if (!localMethod) {
          return;
        }

        const isEffectorMethod = node?.callee?.name === localMethod;
        if (!isEffectorMethod) {
          return;
        }
      },
    };
  },
};
