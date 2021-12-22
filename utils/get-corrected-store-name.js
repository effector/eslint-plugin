const { getStoreNameConvention } = require("./get-store-name-convention");

function getCorrectedStoreName(storeName, context) {
  const storeNameConvention = getStoreNameConvention(context);

  // handle edge case
  if (storeName.startsWith("$") && storeName.endsWith("$")) {
    if (storeNameConvention === "prefix") {
      return `$${storeName.slice(0, -1)}`;
    } else {
      return `${storeName.slice(1)}$`;
    }
  }

  const correctedStoreName =
    storeNameConvention === "prefix" ? `$${storeName}` : `${storeName}$`;

  return correctedStoreName;
}

module.exports = { getCorrectedStoreName };
