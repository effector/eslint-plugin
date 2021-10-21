const {
  extractImportedFromEffector,
} = require("../../utils/extract-imported-from-effector");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbids unnecessary combinations in `clock`, `source` and `forward`",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("no-unnecessary-combination"),
    },
    messages: {
      unnecessaryCombination:
        "Method {{ methodName }} is used under the hood, you can omit it.",
    },
    schema: [],
  },
  create(context) {
    const importedFromEffector = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFromEffector(importedFromEffector, node);
      },
      CallExpression(node) {
        const METHODS_WITH_POSSIBLE_UNNECESSARY_COMBINATION = [
          "sample",
          "guard",
          "forward",
        ];

        const CONFIG_ARG_PROPERTIES = ["source", "clock", "from"];

        function toLocalMethod(method) {
          return importedFromEffector.get(method);
        }

        const UNNECESSARY_METHODS = {
          source: ["combine", "merge"].map(toLocalMethod).filter(Boolean),
          clock: ["merge"].map(toLocalMethod).filter(Boolean),
          from: ["merge"].map(toLocalMethod).filter(Boolean),
        };

        for (const method of METHODS_WITH_POSSIBLE_UNNECESSARY_COMBINATION) {
          const localMethod = importedFromEffector.get(method);
          if (!localMethod) {
            continue;
          }

          const isEffectorMethod = node?.callee?.name === localMethod;
          if (!isEffectorMethod) {
            continue;
          }

          const candidates =
            node?.arguments?.[0]?.properties?.filter((n) =>
              CONFIG_ARG_PROPERTIES.includes(n.key.name)
            ) ?? [];

          if (candidates.length === 0) {
            continue;
          }

          for (const candidate of candidates) {
            const candidateName = candidate?.value?.callee?.name;
            const argProp = candidate?.key?.name;
            if (!candidateName || !argProp) {
              continue;
            }

            const localUnnecessaryMethods = UNNECESSARY_METHODS[argProp];

            const UnnecessaryMethodIsEffectorMethod =
              localUnnecessaryMethods.some((m) => m === candidateName);

            if (!UnnecessaryMethodIsEffectorMethod) {
              continue;
            }

            context.report({
              node: candidate?.value,
              messageId: "unnecessaryCombination",
              data: { methodName: candidateName },
            });
          }
        }
      },
    };
  },
};
