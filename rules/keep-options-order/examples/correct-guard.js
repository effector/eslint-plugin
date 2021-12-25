import { createEvent, createStore, guard } from "effector";

const clock = createEvent();
const source = createEvent();
const filter = createStore();
const target = createEvent();

guard({ clock, source, filter, target });

guard({ clock, source, filter });
guard({ clock, source, filter, target });
guard({ clock, source, target });
guard({ clock, filter, target });
guard({ source, filter, target });

guard({ clock, source });

guard({ clock, filter });
guard({ clock, filter, target });

guard({ filter, target });
guard({ filter });
