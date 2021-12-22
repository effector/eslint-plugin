const { createLinkToRule } = require("../../utils/create-link-to-rule");

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
        'Gate "{{ gateName }}" should be named with first capital letter, rename it to "{{ correctedEffectName }}"',
      renameEffect: 'Rename "{{ effectName }}" to "{{ correctedEffectName }}"',
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const parserServices = context.parserServices;
    // TypeScript-way
    if (parserServices.hasFullTypeInformation) {
      return {};
    }

    // JavaScript-way
    return {};
  },
};

function reportGateNameConventionViolation({ context, node, gateName }) {
  const [firstChar, ...restChars] = gateName.split();
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
        messageId: "renameEffect",
        data: { gateName, correctedGateName },
        fix(fixer) {
          return fixer.replaceTextRange(node.id.range, correctedGateName);
        },
      },
    ],
  });
}
