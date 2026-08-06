import RuntimeError from "./runtime-error";
import type { Token } from "./token";

export class Environment {
  readonly enclosing: Environment | null;
  private readonly values: Map<String, unknown> = new Map();

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assign(name: Token, value: unknown) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: unknown) {
    this.values.set(name, value);
  }
}
