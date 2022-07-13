import { createEffect } from "effector";
import React from "react";

const somethingHasppenedFx = createEffect();

export class SomeComponent extends React.Component {
  componentDidMount() {
    somethingHasppenedFx({});
  }

  render() {
    return null;
  }
}
