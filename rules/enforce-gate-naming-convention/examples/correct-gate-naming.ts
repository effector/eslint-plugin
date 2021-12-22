import { createGate } from "effector-react";

const SomeGate = createGate();

// Factory
function createCustomGate() {
  return createGate();
}

const CustomGate = createCustomGate();

export { SomeGate, CustomGate };
