import { createGate } from "effector-react";
import { createDomain } from "effector";

const domain = createDomain();

const SomeGate = createGate({ domain });

export { SomeGate };
