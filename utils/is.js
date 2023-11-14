const { ESLintUtils } = require("@typescript-eslint/utils");

const { nodeTypeIs } = require("./node-type-is");
const { namingOf } = require("./naming");

function isSomething({ isValidNaming, isTypeCorrect }) {
  return ({ node, context }) => {
    let parserServices;
    try {
      parserServices = ESLintUtils.getParserServices(context);
    } catch (e) {
      // no types info
    }

    if (parserServices?.program) {
      return isTypeCorrect({ node, context });
    }

    return isValidNaming({ name: node?.name ?? node?.id?.name, context });
  };
}

const isStore = isSomething({
  isTypeCorrect: nodeTypeIs.store,
  isValidNaming: namingOf.store.isValid,
});

const isEffect = isSomething({
  isTypeCorrect: nodeTypeIs.effect,
  isValidNaming: namingOf.effect.isValid,
});

const is = {
  store: (opts) => isStore(opts),
  effect: (opts) => isEffect(opts),
  not: { store: (opts) => !isStore(opts), effect: (opts) => !isEffect(opts) },
};

module.exports = { is };
