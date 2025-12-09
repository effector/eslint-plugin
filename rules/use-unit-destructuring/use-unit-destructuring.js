const { createLinkToRule } = require("../../utils/create-link-to-rule");
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure destructured properties match the passed unit object/array",
      category: "Best Practices",
      recommended: true,
      url: createLinkToRule("use-unit-destructuring"),
    },
    messages: {
      unusedKey: 'Property "{{key}}" is passed but not destructured',
      missingKey:
        'Property "{{key}}" is destructured but not passed in the unit object',
      implicitSubscription:
        "Element at index {{index}} ({{name}}) is passed but not destructured, causing implicit subscription",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // Search for useUnit
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "useUnit" ||
          node.arguments.length === 0
        ) {
          return;
        }

        const argument = node.arguments[0];
        const parent = node.parent;

        if (parent.type !== "VariableDeclarator") {
          return;
        }

        // Shape is Object-like
        if (
          argument.type === "ObjectExpression" &&
          parent.id.type === "ObjectPattern"
        ) {
          handleObjectPattern(context, argument, parent.id);
        }

        // Shape is Array-like
        if (
          argument.type === "ArrayExpression" &&
          parent.id.type === "ArrayPattern"
        ) {
          handleArrayPattern(context, argument, parent.id);
        }
      },
    };
  },
};

function handleObjectPattern(context, objectArgument, objectPattern) {
  // Collect all keys from argument object
  const argumentKeys = new Set(
    objectArgument.properties
      .filter(
        (prop) => prop.type === "Property" && prop.key.type === "Identifier"
      )
      .map((prop) => prop.key.name)
  );

  // Collect destructured keys
  const destructuredKeys = new Set(
    objectPattern.properties
      .filter(
        (prop) => prop.type === "Property" && prop.key.type === "Identifier"
      )
      .map((prop) => prop.key.name)
  );

  // Check unused keys
  for (const key of argumentKeys) {
    if (!destructuredKeys.has(key)) {
      context.report({
        node: objectArgument,
        messageId: "unusedKey",
        data: { key },
      });
    }
  }

  // Check missing keys
  for (const key of destructuredKeys) {
    if (!argumentKeys.has(key)) {
      context.report({
        node: objectPattern,
        messageId: "missingKey",
        data: { key },
      });
    }
  }
}

function handleArrayPattern(context, arrayArgument, arrayPattern) {
  const argumentElements = arrayArgument.elements;
  const destructuredElements = arrayPattern.elements;

  // Check all array elements was destructured
  const destructuredCount = destructuredElements.filter(
    (el) => el !== null
  ).length;
  const argumentCount = argumentElements.filter((el) => el !== null).length;

  if (destructuredCount < argumentCount) {
    // If undestructured elements exists
    for (let i = destructuredCount; i < argumentCount; i++) {
      const element = argumentElements[i];
      if (element) {
        // Get the name of variable for an info message
        let name = "unknown";
        if (element.type === "Identifier") {
          name = element.name;
        } else if (element.type === "MemberExpression") {
          const sourceCode = context.getSourceCode
            ? context.getSourceCode()
            : context.sourceCode;
          name = sourceCode.getText(element);
        }

        context.report({
          node: element,
          messageId: "implicitSubscription",
          data: {
            index: i,
            name: name,
          },
        });
      }
    }
  }
}
