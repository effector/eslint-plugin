const prettier = require("prettier");

function areNodesSameInText({ context, nodes }) {
  const texts = nodes.map((node) => {
    let sourceText = context.getSourceCode().getText(node);

    const shouldBeWrapped =
      sourceText.startsWith("{") && sourceText.endsWith("}");

    if (shouldBeWrapped) {
      sourceText = `(${sourceText})`;
    }

    return prettier.format(sourceText, {
      parser: "babel-ts",
    });
  });

  return texts.every((text) => text === texts[0]);
}

module.exports = { areNodesSameInText };
