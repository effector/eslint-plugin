const { getStoreNameConvention } = require("./get-store-name-convention");

function validateStoreNameConvention(context) {
  const storeNameConvention = getStoreNameConvention(context);

  if (storeNameConvention !== "prefix" && storeNameConvention !== "postfix") {
    throw new Error(
      "Invalid Configuration of effector-plugin-eslint/enforce-store-naming-convention. The value should be equal to prefix or postfix."
    );
  }
}

module.exports = { validateStoreNameConvention };
