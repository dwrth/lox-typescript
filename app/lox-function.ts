import { Environment } from "./environment";
import type Interpreter from "./interpreter";
import type { LoxCallable } from "./lox-callable";
import type { Callable } from "./stmt";

export class LoxFunction implements LoxCallable {
  private readonly declaration: Callable;

  constructor(declaration: Callable) {
    this.declaration = declaration;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: unknown[]): void {
    const environment = new Environment(interpreter.globals);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    interpreter.executeBlock(this.declaration.body, environment);
  }
}
