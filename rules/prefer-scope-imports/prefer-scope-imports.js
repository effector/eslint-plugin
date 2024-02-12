const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prefer scoped namespace imports",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("prefer-scope-imports"),
    },
    messages: {
      preferScope: "Use the `/scope` namespace.",
    },
    schema: [
      {
        type: "object",
        properties: {
          packages: {
            type: "array",
            minItems: 0,
            items: [
              {
                type: "string",
              },
            ],
          },
        },
      },
    ],
    hasSuggestions: true,
    fixable: "code",
  },
  create(context) {
    const options = context.options[0];
    const userPackages = options?.packages ?? [];

    const packages = ["effector-react", "effector-solid", ...userPackages];

    return {
      ImportDeclaration(node) {
        if (!packages.includes(node.source.value)) return;

        context.report({
          node,
          messageId: "preferScope",
          suggest: [
            {
              messageId: "preferScope",
              fix(fixer) {
                const literal = node.source;
                return fixer.replaceText(literal, `'${literal.value}/scope'`);
              },
            },
          ],
        });
      },
    };
  },
};
