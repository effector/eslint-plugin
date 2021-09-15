import { createStore, restore, createEvent, combine } from "effector";

// Just createStore
const justStore$ = createStore(null);

// Restore
const eventForRestore = createEvent();
const restoredStore$ = restore(eventForRestore, null);

// Combine
const combinedStore$ = combine($justStore, $restoredStore);

// Map
const mappedStore$ = $combinedStore.map((values) => values.length);

export { justStore$, restoredStore$, combinedStore$, mappedStore$ };
