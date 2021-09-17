const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");
const { isStoreNameValid } = require("../../utils/is-store-name-valid");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce $ as a prefix or postfix for any store created by Effector methods",
      category: "Naming",
      recommended: true,
    },
    messages: {
      invalidName:
        'Store "{{ storeName }}" should be named with {{ storeNameConvention }}, rename it to "{{ correctedStoreName }}"',
      renameStore: 'Rename "{{ storeName }}" to "{{ correctedStoreName }}"',
    },
    schema: [],
  },
  create(context) {
    const { parserServices, settings } = context;
    // prefix convention is default
    const storeNameConvention = settings.effector?.storeNameConvention || "prefix";
    validateStoreNameConvention(storeNameConvention);

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

          if (isStoreNameValid(storeName, storeNameConvention)) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node,
            storeName,
            storeNameConvention
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

          if (isStoreNameValid(storeName, storeNameConvention)) {
            continue;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
            storeNameConvention
          });
          return;
        }

        // Store creation with .map
        if (node.callee?.property?.name === "map") {
          const objectIsEffectorStore = storeNameConvention === "prefix"
              ? node.callee?.object?.name?.startsWith?.("$")
              : node.callee?.object?.name?.endsWith?.("$");

          if (!objectIsEffectorStore) {
            return;
          }

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            return;
          }

          const storeName = node.parent.id.name;

          if (isStoreNameValid(storeName, storeNameConvention)) {
            return;
          }


          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
            storeNameConvention
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

          if (isStoreNameValid(storeName, storeNameConvention)) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
            storeNameConvention
          });
          return;
        }
      },
    };
  },
};

function reportStoreNameConventionViolation({ context, node, storeName, storeNameConvention }) {

  const correctedStoreName = storeNameConvention === "prefix"
      ? `$${storeName}`
      : `${storeName}$`

  context.report({
    node,
    messageId: "invalidName",
    data: {
      storeName,
      correctedStoreName,
      storeNameConvention
    },
    suggest: [
      {
        messageId: "renameStore",
        data: { storeName },
        fix(fixer) {
          if (storeNameConvention === "prefix") {
            return fixer.insertTextBeforeRange(node.range, "$");
          }
          return fixer.insertTextAfterRange(node.range, "$");
        },
      },
    ],
  });
}

function validateStoreNameConvention(storeNameConvention) {
  if (storeNameConvention !== "prefix" && storeNameConvention !== "postfix") {
    throw new Error("Invalid Configuration. The value should be equal to prefix or postfix.");
  }
}

