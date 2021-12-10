class RandomClass {
  on(event: any, callback: () => any) {
    return this;
  }
}

const $randomObject = new RandomClass();

const randomEvent = {};

$randomObject.on(randomEvent, () => null).on(randomEvent, () => null);

export { $randomObject };
