const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      category: "Quality",
      url: createLinkToRule("require-pickup-in-persist"),
    },
    messages: {
      pickupMissing:
        "This `persist` call does not specify a `pickup` event that is required for scoped usage of `effector-storage`.",
    },
    schema: [],
  },
  create(context) {
    const pickupImports = new Set();

    /**
     * Finds `effector-storage` packages, scoped and unscoped, including
     * contents of these packages. See examples for a full list.
     */
    const PACKAGE_NAME = /^@?effector-storage(\u002F[\w-]+)*$/;

    const declarationSelector = `ImportDeclaration[source.value=${PACKAGE_NAME}]`;
    const persistImportSelector = `ImportSpecifier[imported.name="persist"]`;

    const configSelector = `[arguments.length=1][arguments.0.type="ObjectExpression"]`;
    const callSelector = `[callee.type="Identifier"]`;

    return {
      [`${declarationSelector} > ${persistImportSelector}`](node) {
        pickupImports.add(node.local.name);
      },
      [`CallExpression${configSelector}${callSelector}`](node) {
        if (!pickupImports.has(node.callee.name)) return;

        const config = node.arguments[0];

        if (config.properties.some((prop) => prop.key?.name === "pickup"))
          return;

        context.report({ node, messageId: "pickupMissing" });
      },
    };
  },
};
