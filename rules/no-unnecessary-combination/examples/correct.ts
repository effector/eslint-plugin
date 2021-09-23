import { createEvent, createStore, forward, guard, sample } from "effector";

const event1 = createEvent();
const event2 = createEvent();
const $store1 = createStore(null);
const $store2 = createStore(null);

sample({ clock: [event1, event2], source: [$store1, $store2] });

sample({ clock: event1, source: [$store1, $store2] });

sample({ clock: event1, source: { a: $store1, b: $store2 } });

guard({ clock: [event1, event2], source: $store1, filter: Boolean });

guard({ clock: event1, source: { a: $store1 }, filter: Boolean });

const otherEvent = createEvent();

forward({ from: [event1, event2], to: otherEvent });
