import { createEvent, createStore, sample } from "effector";

const clock = createEvent();
const source = createEvent();
const filter = createStore();
const fn = () => null;
const target = createEvent();

sample({ clock, source, filter, fn, target });

sample({ clock, source, filter, fn });
sample({ clock, source, filter, target });
sample({ clock, source, fn, target });
sample({ clock, filter, fn, target });
sample({ source, filter, fn, target });

sample({ clock, source, filter });
sample({ clock, source, fn });
sample({ clock, source, target });

sample({ clock, filter, fn });
sample({ clock, filter, target });

sample({ source, filter, fn });
sample({ source, filter, target });

sample({ filter, fn, target });
sample({ filter, fn });

sample({ filter, fn, greedy });
