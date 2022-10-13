const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { namingOf } = require("../../utils/naming");
const {
  validateStoreNameConvention,
} = require("../../utils/validate-store-name-convention");
const {
  getStoreNameConvention,
} = require("../../utils/get-store-name-convention");
const {
  getCorrectedStoreName,
} = require("../../utils/get-corrected-store-name");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { nodeTypeIs } = require("../../utils/node-type-is");
const { traverseParentByType } = require("../../utils/traverse-parent-by-type");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce $ as a prefix or postfix for any store created by Effector methods",
      category: "Naming",
      recommended: true,
      url: createLinkToRule("enforce-store-naming-convention"),
    },
    messages: {
      invalidName:
        'Store "{{ storeName }}" should be named with {{ storeNameConvention }}, rename it to "{{ correctedStoreName }}"',
      renameStore: 'Rename "{{ storeName }}" to "{{ correctedStoreName }}"',
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const { parserServices } = context;

    validateStoreNameConvention(context);

    // TypeScript-way
    if (parserServices.hasFullTypeInformation) {
      return {
        VariableDeclarator(node) {
          const isEffectorStore = nodeTypeIs.store({
            node,
            context,
          });

          if (!isEffectorStore) {
            return;
          }

          const storeName = node.id.name;

          if (namingOf.store.isInvalid({ name: storeName, context })) {
            reportStoreNameConventionViolation({
              context,
              node,
              storeName,
            });
          }
        },
      };
    }

    // JavaScript-way
    const importedFromEffector = new Map();
    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffector,
          node,
          packageName: "effector",
        });
      },
      CallExpression(node) {
        // Store creation with method
        const STORE_CREATION_METHODS = ["createStore", "restore", "combine"];
        for (const method of STORE_CREATION_METHODS) {
          const localMethod = importedFromEffector.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorStoreCreation = node.callee.name === localMethod;
          if (!isEffectorStoreCreation) {
            continue;
          }

          const parentNode = traverseParentByType(node, "VariableDeclarator", [
            "Program",
          ]);

          const resultSavedInVariable =
            parentNode?.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            continue;
          }

          const storeName = parentNode.id.name;
          if (namingOf.store.isValid({ name: storeName, context })) {
            continue;
          }

          reportStoreNameConventionViolation({
            context,
            node: parentNode,
            storeName,
          });
          return;
        }

        // Store creation with .map
        if (node.callee?.property?.name === "map") {
          const storeNameCreatedFromMap = node.callee?.object?.name;

          if (
            namingOf.store.isInvalid({ name: storeNameCreatedFromMap, context })
          ) {
            return;
          }

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";

          if (!resultSavedInVariable) {
            return;
          }

          const storeName = node.parent.id.name;

          if (namingOf.store.isValid({ name: storeName, context })) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
          });
          return;
        }

        // Store creation in domain
        const STORE_IN_DOMAIN_CREATION_METHODS = ["createStore", "store"];
        if (
          STORE_IN_DOMAIN_CREATION_METHODS.includes(node.callee?.property?.name)
        ) {
          const parentNode = traverseParentByType(node, "VariableDeclarator", [
            "Program",
          ]);

          const resultSavedInVariable =
            parentNode?.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            return;
          }

          const storeName = parentNode.id.name;

          if (namingOf.store.isValid({ name: storeName, context })) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node: parentNode,
            storeName,
          });
          return;
        }
      },
    };
  },
};

function reportStoreNameConventionViolation({ context, node, storeName }) {
  const storeNameConvention = getStoreNameConvention(context);
  const correctedStoreName = getCorrectedStoreName(storeName, context);

  context.report({
    node,
    messageId: "invalidName",
    data: {
      storeName,
      correctedStoreName,
      storeNameConvention,
    },
    suggest: [
      {
        messageId: "renameStore",
        data: { storeName, correctedStoreName },
        fix(fixer) {
          return fixer.replaceTextRange(node.id.range, correctedStoreName);
        },
      },
    ],
  });
}
