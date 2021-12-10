const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");
const { isStoreNameValid } = require("../../utils/naming");
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
const { variableHasEffectorType } = require("../../utils/has-effector-type");

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
          const isEffectorStore = variableHasEffectorType({
            node,
            context,
            possibleTypes: ["Store"],
          });

          if (!isEffectorStore) {
            return;
          }

          const storeName = node.id.name;

          if (isStoreNameValid({ name: storeName, context })) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node,
            storeName,
          });
        },
      };
    }

    // JavaScript-way
    const importedFromEffector = new Map();
    return {
      ImportDeclaration(node) {
        extractImportedFromEffector(importedFromEffector, node);
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

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            continue;
          }

          const storeName = node.parent.id.name;

          if (isStoreNameValid({ name: storeName, context })) {
            continue;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
          });
          return;
        }

        // Store creation with .map
        if (node.callee?.property?.name === "map") {
          const storeNameCreatedFromMap = node.callee?.object?.name;

          if (!isStoreNameValid({ name: storeNameCreatedFromMap, context })) {
            return;
          }

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            return;
          }

          const storeName = node.parent.id.name;

          if (isStoreNameValid({ name: storeName, context })) {
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
          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            return;
          }

          const storeName = node.parent.id.name;

          if (isStoreNameValid({ name: storeName, context })) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
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
