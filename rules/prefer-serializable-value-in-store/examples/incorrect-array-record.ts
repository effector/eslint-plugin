import { createStore } from "effector";

interface User {
  created: Date;
}

export const $users = createStore<User[]>([]);
