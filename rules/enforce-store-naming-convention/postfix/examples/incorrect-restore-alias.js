import { restore as createStoreFromEvent, createEvent } from "effector";

const eventForRestore = createEvent();
const restoredStore = createStoreFromEvent(eventForRestore, null);

export { restoredStore };
