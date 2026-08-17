export class Return extends Error {
  readonly value: unknown;

  constructor(value: unknown) {
    super();
    this.name = "Return";
    this.value = value;
  }
}
