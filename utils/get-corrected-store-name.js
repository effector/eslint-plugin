const { getStoreNameConvention } = require("./get-store-name-convention");

function getCorrectedStoreName(storeName, context) {
  const storeNameConvention = getStoreNameConvention(context);

  // handle edge case
  if (storeName.startsWith("$") && storeName.endsWith("$")) {
    const storeNameWithoutConvention = trimByPattern(storeName, "$");
    return formatStoreName(storeNameWithoutConvention, storeNameConvention);
  }

  const correctedStoreName = formatStoreName(storeName, storeNameConvention);

  return correctedStoreName;
}

function formatStoreName(storeName, convention) {
  return convention === "prefix" ? `$${storeName}` : `${storeName}$`;
}

function trimByPattern(s, template) {
  let l = 0,
    r = s.length - 1;

  while (l <= r) {
    const head = s[l];
    const tail = s[r];

    if (head === template) {
      l++;
    }

    if (tail === template) {
      r--;
    }

    if (head !== template && tail !== template) {
      return s.slice(l, r + 1);
    }
  }

  return s;
}

module.exports = { getCorrectedStoreName };
