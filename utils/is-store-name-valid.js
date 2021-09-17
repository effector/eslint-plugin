function isStoreNameValid(storeName, storeNameConvention) {
    if (storeNameConvention === "prefix" && storeName.startsWith("$")) {
        return true;
    }

    if (storeNameConvention === "postfix" && storeName.endsWith("$")) {
        return true;
    }

    return false;
}

module.exports = { isStoreNameValid };