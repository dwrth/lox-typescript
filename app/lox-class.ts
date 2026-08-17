import type Interpreter from "./interpreter";
import { LoxCallable } from "./lox-callable";
import type { LoxFunction } from "./lox-function";
import { LoxInstance } from "./lox-instance";

export class LoxClass extends LoxCallable {
  readonly name: string;
  private readonly methods: Map<string, LoxFunction>;

  constructor(name: string, methods: Map<string, LoxFunction>) {
    super({});
    this.name = name;
    this.methods = methods;
  }

  findMethod(name: string) {
    if (this.methods.has(name)) {
      return this.methods.get(name);
    }

    return null;
  }

  toString() {
    return this.name;
  }

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (!!initializer) {
      initializer?.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  arity(): number {
    const initializer = this.findMethod("init");
    if (!initializer) {
      return 0;
    }

    return initializer?.arity();
  }
}
