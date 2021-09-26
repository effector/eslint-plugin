import { restore, createEvent } from "effector";

const eventForRestore = createEvent();
const restoredStore = restore(eventForRestore, null);

export { restoredStore };
