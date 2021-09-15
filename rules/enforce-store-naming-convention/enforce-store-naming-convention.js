const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");

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
        'Store "{{ storeName }}" should be named with {{ mode }}, rename it to "{{ correctedStoreName }}"',
      renameStore: 'Rename "{{ storeName }}" to "{{ correctedStoreName }}"',
    },
    schema: [
      {
        "enum": ["prefix", "postfix"]
      }
    ],
  },
  create(context) {
    const { parserServices, options } = context;
    // prefix mode is a default option
    const [mode = "prefix"] = options;
    validateMode(mode);

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

          if (mode === "prefix" && storeName?.startsWith("$")) {
            return;
          }
          if (mode === "postfix" && storeName?.endsWith("$")) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node,
            storeName,
            mode
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

          if (mode === "prefix" && storeName.startsWith("$")) {
            continue;
          }

          if (mode === "postfix" && storeName.endsWith("$")) {
            continue;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
            mode
          });
          return;
        }

        // Store creation with .map
        if (node.callee?.property?.name === "map") {
          const objectIsEffectorStore = mode === "prefix"
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
          if (mode === "prefix" && storeName.startsWith("$")) {
            return;
          }

          if (mode === "postfix" && storeName.endsWith("$")) {
            return;
          }


          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
            mode
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
          if (mode === "prefix" && storeName.startsWith("$")) {
            return;
          }

          if (mode === "postfix" && storeName.endsWith("$")) {
            return;
          }

          reportStoreNameConventionViolation({
            context,
            node: node.parent,
            storeName,
            mode
          });
          return;
        }
      },
    };
  },
};

function reportStoreNameConventionViolation({ context, node, storeName, mode }) {

  const correctedStoreName = mode === "prefix"
      ? `$${storeName}`
      : `${storeName}$`

  context.report({
    node,
    messageId: "invalidName",
    data: {
      storeName,
      correctedStoreName,
      mode
    },
    suggest: [
      {
        messageId: "renameStore",
        data: { storeName },
        fix(fixer) {
          if (mode === "prefix") {
            return fixer.insertTextBeforeRange(node.range, "$");
          }
          return fixer.insertTextAfterRange(node.range, "$");
        },
      },
    ],
  });
}

function validateMode(mode) {
  if (mode !== "prefix" || mode !== "postfix") {
    throw new Error("Invalid Configuration. The value should be equal to prefix or postfix.");
  }
}