import { Environment } from "./environment";
import type Interpreter from "./interpreter";
import { LoxCallable } from "./lox-callable";
import { Return } from "./return";
import type { Funct } from "./stmt";

export class LoxFunction extends LoxCallable {
  private readonly declaration: Funct;
  private readonly closure: Environment;

  constructor(declaration: Funct, closure: Environment) {
    super({});
    this.closure = closure;
    this.declaration = declaration;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: unknown[]): unknown | null {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (err) {
      return (err as unknown as Return).value;
    }

    return null;
  }
}
