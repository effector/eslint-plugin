const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { is } = require("../../utils/is");
const { extractType } = require("../../utils/extract-type");
const { walkType } = require("../../utils/walk-type");

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

        const useSerialization = isStoreSerializeble({ node });

        const storeType = extractType({ node, context });
        const valueType = storeType?.resolvedTypeArguments?.[0];

        let dangerousType = null;
        walkType(
          valueType,
          (typeItem) => {
            if (isPrimitive(typeItem)) {
              return;
            }

            if (isDate(typeItem)) {
              dangerousType = typeItem;
              return;
            }
          },
          { context }
        );

        if (dangerousType && useSerialization) {
          context.report({
            node,
            messageId: "dangerousType",
            data: {
              typeName: typeName(dangerousType) ?? "unknown",
            },
          });
        }
      },
    };
  },
};

// TypeCheckers

function typeName(type) {
  return type?.symbol?.escapedName ?? type?.typeName?.escapedText;
}

function isPrimitive(type) {
  return ["boolean", "number", "string"].includes(type?.intrinsicName);
}

function isDate(type) {
  return typeName(type) === "Date" ?? false;
}

// Arg extraction
function isStoreSerializeble({ node }) {
  if (node?.init?.type !== "CallExpression") {
    return true;
  }

  if (node?.init?.callee?.name === "combine") {
    return false;
  }

  if (node?.init?.callee?.property?.name === "map") {
    return false;
  }

  if (node?.init?.callee?.name === "createStore") {
    const serializeProperty = node?.init?.arguments?.[1]?.properties?.find(
      (prop) => prop?.key?.name === "serialize"
    );
    return serializeProperty?.value?.value !== "ignore" ?? true;
  }

  return true;
}
