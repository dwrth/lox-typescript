import type Interpreter from "./interpreter";
import { LoxCallable } from "./lox-callable";
import { LoxInstance } from "./lox-instance";

export class LoxClass extends LoxCallable {
  readonly name: string;

  constructor(name: string) {
    super({});
    this.name = name;
  }

  toString() {
    return this.name;
  }

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);
    return instance;
  }

  arity(): number {
    return 0;
  }
}
