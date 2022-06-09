const { extractType } = require("./extract-type");

function walkType(type, callback, { context }) {
  callback(type);

  // Walk around Array
  if (type?.symbol?.escapedName === "Array") {
    for (const typeAgrument of type?.resolvedTypeArguments) {
      walkType(typeAgrument, callback, { context });
    }
    return;
  }

  // Walk around Object
  if (type?.symbol?.members) {
    for (const [_, member] of type.symbol.members) {
      walkType(member?.valueDeclaration?.type, callback, { context });
    }
    return;
  }
}

module.exports = { walkType };
