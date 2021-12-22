const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { nodeTypeIs } = require("../../utils/node-type-is");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { namingOf } = require("../../utils/naming");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce first capital letter for gate naming",
      category: "Naming",
      recommended: true,
      url: createLinkToRule("enforce-gate-naming-convention"),
    },
    messages: {
      invalidName:
        'Gate "{{ gateName }}" should be named with first capital letter, rename it to "{{ correctedGateName }}"',
      renameGate: 'Rename "{{ gateName }}" to "{{ correctedGateName }}"',
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const parserServices = context.parserServices;
    // TypeScript-way
    if (parserServices.hasFullTypeInformation) {
      return {
        VariableDeclarator(node) {
          const isEffectorGate = nodeTypeIs.gate({
            node,
            context,
          });

          if (!isEffectorGate) {
            return;
          }

          const gateName = node.id.name;

          if (namingOf.gate.isInvalid({ name: gateName })) {
            reportGateNameConventionViolation({ context, node, gateName });
          }
        },
      };
    }

    // JavaScript-way
    const importedFromEffectorReact = new Map();
    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffectorReact,
          node,
          packageName: "effector-react",
        });
      },
      CallExpression(node) {
        // Effect creation with method
        const GATE_CREATION_METHODS = ["createGate"];
        for (const method of GATE_CREATION_METHODS) {
          const localMethod = importedFromEffectorReact.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorGateCreation = node.callee.name === localMethod;
          if (!isEffectorGateCreation) {
            continue;
          }

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            continue;
          }

          const gateName = node.parent.id.name;
          if (namingOf.gate.isValid({ name: gateName })) {
            continue;
          }

          reportGateNameConventionViolation({
            context,
            node: node.parent,
            gateName,
          });
        }
      },
    };
  },
};

function reportGateNameConventionViolation({ context, node, gateName }) {
  const [firstChar, ...restChars] = gateName.split("");
  const correctedGateName = [firstChar.toUpperCase(), ...restChars].join("");

  context.report({
    node,
    messageId: "invalidName",
    data: {
      gateName,
      correctedGateName,
    },
    suggest: [
      {
        messageId: "renameGate",
        data: { gateName, correctedGateName },
        fix(fixer) {
          return fixer.replaceTextRange(node.id.range, correctedGateName);
        },
      },
    ],
  });
}
