function getStoreNameConvention(context) {
  // prefix convention is default
  return context.settings.effector?.storeNameConvention || "prefix";
}

module.exports = { getStoreNameConvention };
