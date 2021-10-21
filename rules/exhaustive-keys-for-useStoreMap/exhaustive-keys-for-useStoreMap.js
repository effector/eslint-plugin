const { extractImportedFrom } = require("../../utils/extract-imported-from");
const { createLinkToRule } = require("../../utils/create-link-to-rule");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Verifies the list of keys for useStoreMap",
      category: "Quality",
      recommended: true,
      url: createLinkToRule("exhaustive-keys-for-useStoreMap"),
    },
    schema: [],
  },
  create(context) {
    const importedFromEffectorReact = new Map();

    return {
      ImportDeclaration(node) {
        extractImportedFrom({
          importMap: importedFromEffectorReact,
          node,
          libraryName: "effector-react",
        });
      },
      CallExpression(node) {
        const localUseStoreMapName =
          importedFromEffectorReact.get("useStoreMap");
        if (!localUseStoreMapName) {
          return;
        }

        const isUseStoreMapCall = node?.callee?.name === localUseStoreMapName;
        if (!isUseStoreMapCall) {
          return;
        }

        const useStoreMapConfig = node?.arguments?.[0];

        if (useStoreMapConfig?.type !== "ObjectExpression") {
          // It has keys only in object form
          return;
        }

        const fnConfig = useStoreMapConfig?.properties?.find(
          (prop) => prop?.key.name === "fn"
        );
        const keysConfig = useStoreMapConfig?.properties?.find(
          (prop) => prop?.key.name === "keys"
        );

        const availableKeys = keysConfig?.value?.elements?.map((k) => k.name);

        // TODO:: fn should use data only from arguments
      },
    };
  },
};
