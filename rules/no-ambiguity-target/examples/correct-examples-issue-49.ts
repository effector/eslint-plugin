import { createEffect, createEvent, createStore, guard } from "effector";

// Examples were found in production code-base with false-positive detection on 0.3.0
// https://github.com/effector/eslint-plugin/issues/49

interface IFilters {
  first: string;
  second: string;
}

interface IResponseData {
  data: string;
}

const createFactory = () => {
  const { applyFilters, getDataFx } = createHandlers();

  const $data = createStore<IResponseData>({ data: "" });

  const $filters = createStore<IFilters>({
    first: "",
    second: "",
  });

  const $hasValidFilters = $filters.map((filters) =>
    Object.values(filters).every(Boolean)
  );

  guard({
    clock: applyFilters,
    source: $filters,
    filter: $hasValidFilters,
    target: getDataFx,
  });

  return {
    $data,
    $filters,
    $hasValidFilters,
    applyFilters,
    getDataFx,
  };
};

const createHandlers = () => {
  const applyFilters = createEvent();

  const getDataFx = createEffect<IFilters, IResponseData>();

  return {
    applyFilters,
    getDataFx,
  };
};

export { createFactory };
