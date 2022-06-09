import { createStore } from "effector";

interface User {
  created: Date;
}

export const $user = createStore<User | null>(null);
