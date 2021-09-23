import { sample, guard, createEvent } from "effector";

const trigger = createEvent();
const target = createEvent();

// with target
sample({ clock: trigger, fn: Boolean, target });
sample({ source: trigger, fn: Boolean, target });

guard({ clock: trigger, filter: Boolean, target });
guard({ source: trigger, filter: Boolean, target });

// with simple assign
const result1 = sample({ clock: trigger, fn: Boolean });
const result2 = sample({ source: trigger, fn: Boolean });

const result3 = guard({ clock: trigger, filter: Boolean });
const result4 = guard({ source: trigger, filter: Boolean });

// with complex assign

const somplexResult = {
  target: guard({ source: trigger, filter: Boolean }),
};

function createSomething() {
  const otherTrigger = createEvent();

  return guard({ source: otherTrigger, filter: Boolean });
}

const createBooleanGuard = (otherTrigger) =>
  guard({ source: otherTrigger, filter: Boolean });
