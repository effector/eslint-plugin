const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");
const { createLinkToRule } = require("../../utils/create-link-to-rule");
const { variableHasEffectorType } = require("../../utils/has-effector-type");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce Fx as a suffix for any effect created by Effector methods",
      category: "Naming",
      recommended: true,
      url: createLinkToRule("enforce-effect-naming-convention"),
    },
    messages: {
      invalidName:
        'Effect "{{ effectName }}" should be named with suffix, rename it to "{{ effectName }}Fx"',
      renameEffect: 'Rename "{{ effectName }}" to "{{ effectName }}Fx"',
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
          const isEffectorEffect = variableHasEffectorType({
            node,
            context,
            possibleTypes: ["Effect"],
          });

          if (!isEffectorEffect) {
            return;
          }

          const effectName = node.id.name;

          if (effectName?.endsWith("Fx")) {
            return;
          }

          reportEffectNameConventionViolation({ context, node, effectName });
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
        // Effect creation with method
        const EFFECT_CREATION_METHODS = ["createEffect", "attach"];
        for (const method of EFFECT_CREATION_METHODS) {
          const localMethod = importedFromEffector.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorEffectCreation = node.callee.name === localMethod;
          if (!isEffectorEffectCreation) {
            continue;
          }

          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            continue;
          }

          const effectName = node.parent.id.name;
          if (effectName.endsWith("Fx")) {
            continue;
          }

          reportEffectNameConventionViolation({
            context,
            node: node.parent,
            effectName,
          });
          return;
        }

        // Effect creation in domain
        const STORE_IN_DOMAIN_CREATION_METHODS = ["createEffect", "effect"];
        if (
          STORE_IN_DOMAIN_CREATION_METHODS.includes(node.callee?.property?.name)
        ) {
          const resultSavedInVariable =
            node.parent.type === "VariableDeclarator";
          if (!resultSavedInVariable) {
            return;
          }

          const effectName = node.parent.id.name;
          if (effectName.endsWith("Fx")) {
            return;
          }

          reportEffectNameConventionViolation({
            context,
            node: node.parent,
            effectName,
          });
          return;
        }
      },
    };
  },
};

function reportEffectNameConventionViolation({ context, node, effectName }) {
  context.report({
    node,
    messageId: "invalidName",
    data: {
      effectName,
    },
    suggest: [
      {
        messageId: "renameEffect",
        data: { effectName },
        fix(fixer) {
          return fixer.insertTextAfterRange(node.id.range, "Fx");
        },
      },
    ],
  });
}
