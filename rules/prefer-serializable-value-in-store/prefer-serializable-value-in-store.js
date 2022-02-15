const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { is } = require("../../utils/is");
const { extractType } = require("../../utils/extract-type");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Avoid unserializable values in serializable stores",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("prefer-serializable-value-in-store"),
    },
    messages: {
      dangerousType: "Type {{typeName}} cannot be serialized.",
    },
    schema: [],
  },
  create(context) {
    // TypeScript-way
    const importedFromEffector = new Map();
    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffector,
          node,
          packageName: "effector",
        });
      },
      VariableDeclarator(node) {
        if (is.not.store({ node, context })) {
          return;
        }

        const storeType = extractType({ node, context });
        const valueType = storeType?.resolvedTypeArguments?.[0];

        // TODO: analyze valueType
      },
    };
  },
};
