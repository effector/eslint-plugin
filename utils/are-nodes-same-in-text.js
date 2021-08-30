const prettier = require("prettier");

function areNodesSameInText({ context, nodes }) {
  const texts = nodes.map((node) =>
    prettier.format(context.getSourceCode().getText(node), {
      parser: "babel-ts",
    })
  );

  return texts.every((text) => text === texts[0]);
}

module.exports = { areNodesSameInText };
