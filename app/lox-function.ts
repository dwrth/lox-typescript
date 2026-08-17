import { Environment } from "./environment";
import type Interpreter from "./interpreter";
import { LoxCallable } from "./lox-callable";
import type { LoxInstance } from "./lox-instance";
import { Return } from "./return";
import type { Funct } from "./stmt";

export class LoxFunction extends LoxCallable {
  private readonly declaration: Funct;
  private readonly closure: Environment;
  private readonly isInitializer: boolean;

  constructor(
    declaration: Funct,
    closure: Environment,
    isInitializer: boolean,
  ) {
    super({});
    this.closure = closure;
    this.declaration = declaration;
    this.isInitializer = isInitializer;
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
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
      if (this.isInitializer) {
        return this.closure.getAt(0, "this");
      }
      return (err as unknown as Return).value;
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, "this");
    }

    return null;
  }
}
