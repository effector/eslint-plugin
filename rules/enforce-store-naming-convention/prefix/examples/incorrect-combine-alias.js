import {
  createStore,
  restore,
  createEvent,
  combine as mergeStores,
} from "effector";

// Just createStore
const $justStore = createStore(null);

// Restore
const eventForRestore = createEvent();
const $restoredStore = restore(eventForRestore, null);

// Combine
const combinedStore = mergeStores($justStore, $restoredStore);

export { combinedStore };
