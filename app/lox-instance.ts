import type { LoxClass } from "./lox-class";

export class LoxInstance {
  private klass: LoxClass;

  constructor(klass: LoxClass) {
    this.klass = klass;
  }

  toString() {
    return `${this.klass.name} instance`;
  }
}
