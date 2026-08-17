import type { LoxClass } from "./lox-class";
import RuntimeError from "./runtime-error";
import type { Token } from "./token";

export class LoxInstance {
  private klass: LoxClass;
  private readonly fields: Map<string, unknown> = new Map();

  constructor(klass: LoxClass) {
    this.klass = klass;
  }

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    throw new RuntimeError(name, `Undefined property "${name.lexeme}".`);
  }

  set(name: Token, value: unknown) {
    this.fields.set(name.lexeme, value);
  }

  toString() {
    return `${this.klass.name} instance`;
  }
}
