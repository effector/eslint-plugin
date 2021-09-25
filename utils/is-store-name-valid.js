const { getStoreNameConvention } = require("./get-store-name-convention");

function isStoreNameValid(storeName, context) {
    const storeNameConvention = getStoreNameConvention(context);

    // validate edge case
    if (storeName?.startsWith("$") && storeName?.endsWith("$")) {
        return false
    }

    if (storeNameConvention === "prefix" && storeName?.startsWith("$")) {
        return true;
    }

    if (storeNameConvention === "postfix" && storeName?.endsWith("$")) {
        return true;
    }

    return false;
}

module.exports = { isStoreNameValid };