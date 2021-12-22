import { createDomain } from "effector";
import { createGate } from "effector-react";

const domain = createDomain();

const justGate = createGate({ domain });

export { justGate };
