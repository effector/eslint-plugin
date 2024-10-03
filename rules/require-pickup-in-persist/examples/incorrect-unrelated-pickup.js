import { combine } from "effector";

import { persist } from "effector-storage/local";

persist({
  store: combine({ pickup: true }),
  param: { pickup: "yes" },
});
