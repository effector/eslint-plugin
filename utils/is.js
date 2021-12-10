const { hasEffectorType } = require("./has-effector-type");
const { isStoreNameValid } = require("./is-store-name-valid");

function isStore({ context, node }) {
  // TypeScript-way
  if (context.parserServices.hasFullTypeInformation) {
    return hasEffectorType({ node, typeNames: ["Store"], context });
  }

  // JavaScript-way
  return isStoreNameValid(node?.name, context);
}

function isEvent({ context, node }) {
  return false;
}

function isEffect({ context, node }) {
  return false;
}

module.exports = { isEffect, isEvent, isStore };
