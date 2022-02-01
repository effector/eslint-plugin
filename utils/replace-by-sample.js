const { buildObjectInText } = require("./builders");

function* replaceForwardBySample(
  forwardConfig,
  { fixer, node, context, importNodes }
) {
  let mapperFunctionNode = null;

  let clockMapperUsed = false;
  let targetMapperUsed = false;

  let clockNode = forwardConfig.from.value;
  let targetNode = forwardConfig.to.value;

  if (
    clockNode.type === "CallExpression" &&
    clockNode?.callee?.property?.name === "map"
  ) {
    mapperFunctionNode = clockNode?.arguments?.[0];
    clockNode = clockNode.callee.object;
    clockMapperUsed = true;
  }

  if (
    targetNode.type === "CallExpression" &&
    targetNode?.callee?.property?.name === "prepend"
  ) {
    mapperFunctionNode = targetNode?.arguments?.[0];
    targetNode = targetNode.callee.object;
    targetMapperUsed = true;
  }

  // We cannot apply two mappers in one sample
  // Let's revert mappers and use .map + .prepend
  if (clockMapperUsed && targetMapperUsed) {
    mapperFunctionNode = null;
    clockNode = forwardConfig.from.value;
    targetNode = forwardConfig.to.value;
  }

  yield* replaceBySample(
    { clockNode, targetNode, mapperFunctionNode },
    { node, fixer, context, importNodes, methodName: "forward" }
  );
}

function* replaceBySample(
  { clockNode, targetNode, mapperFunctionNode },
  { node, fixer, context, importNodes, methodName }
) {
  yield fixer.replaceText(
    node,
    `sample(${buildObjectInText.fromMapOfNodes({
      properties: {
        clock: clockNode,
        fn: mapperFunctionNode,
        target: targetNode,
      },
      context,
    })})`
  );

  yield fixer.replaceText(importNodes.get(methodName), "sample");
}

module.exports = { replaceForwardBySample };
