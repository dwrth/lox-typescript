import type Interpreter from "./interpreter";

export class LoxCallable {
  arity() {}
  call(interpreter: Interpreter, args: unknown[]) {}

  constructor(obj: object) {
    Object.assign(this, obj);
  }
}
