import RuntimeError from "./runtime-error";
import type { Token } from "./token";

export class Environment {
  private readonly values: Map<String, unknown> = new Map();

  get(name: Token) {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: unknown) {
    this.values.set(name, value);
  }
}
