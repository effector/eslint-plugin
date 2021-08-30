const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce $ as a prefix for any store created by Effector methods",
      category: "Naming",
      recommended: true,
    },
    messages: {
      invalidName:
        'Store "{{ storeName }}" should be named with prefix, rename it to "${{ storeName }}"',
      renameStore: 'Rename "{{ storeName }}" to "${{ storeName }}"',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.parserServices;
    // TypeScript-way
    if (parserServices.hasFullTypeInformation) {
      return {
        VariableDeclarator(node) {
          const checker = parserServices.program.getTypeChecker();
          const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
          const type = checker.getTypeAtLocation(originalNode.initializer);

          const isEffectorStore =
            type?.symbol?.escapedName === "Store" &&
            type?.symbol?.parent?.escapedName?.includes("effector");

          if (!isEffectorStore) {
            return;
          }

          const storeName = node.id.name;

          if (storeName?.startsWith("$")) {
            return;
          }

          reportStoreNameConventionViolation({ context, node, storeName });
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
          if (storeName.startsWith("$")) {
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
          const objectIsEffectorStore =
            node.callee?.object?.name?.startsWith?.("$");
          if (!objectIsEffectorStore) {
            return;
          }

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            return;
          }

          const storeName = node.parent.id.name;
          if (storeName.startsWith("$")) {
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
          if (storeName.startsWith("$")) {
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
  context.report({
    node,
    messageId: "invalidName",
    data: {
      storeName,
    },
    suggest: [
      {
        messageId: "renameStore",
        data: { storeName },
        fix(fixer) {
          return fixer.insertTextBeforeRange(node.range, "$");
        },
      },
    ],
  });
}
