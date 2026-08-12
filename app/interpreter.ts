import { Environment } from "./environment";
import type {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  Visitor as ExprVisitor,
  Variable,
  Assign,
  Logical,
  Call,
} from "./expr";
import { Logger } from "./logger";
import { LoxCallable } from "./lox-callable";
import { LoxFunction } from "./lox-function";
import RuntimeError from "./runtime-error";
import { Return as ReturnError } from "./return.ts"
import type {
  Block,
  Callable,
  Expression,
  If,
  Print,
  Return,
  Stmt,
  Visitor as StmtVisitor,
  Var,
  While,
} from "./stmt";
import { Token, TokenType } from "./token";

export default class Interpreter
  implements ExprVisitor<unknown>, StmtVisitor<void> {
  readonly globals: Environment = new Environment();
  private environment: Environment = this.globals;

  constructor() {
    this.globals.define(
      "clock",
      new LoxCallable({
        arity() {
          return 0;
        },
        call(interpreter: Interpreter, args: unknown[]) {
          return Number(Date.now()) / 1000;
        },
        toString() {
          return "<native fn>";
        },
      }),
    );
  }

  public interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (err) {
      if (err instanceof RuntimeError) {
        Logger.runtimeError(err as unknown as RuntimeError);
      }
    }
  }

  public interpretExpr(expression: Expr) {
    try {
      const value: unknown = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (err) {
      if (err instanceof RuntimeError) {
        Logger.runtimeError(err as unknown as RuntimeError);
      }
    }
  }

  visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }

  visitLogicalExpr(expr: Logical): unknown {
    const left: unknown = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) {
        return left;
      }
    } else {
      if (!this.isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expr.right);
  }

  visitGroupingExpr(expr: Grouping): unknown {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: Unary): unknown {
    const right: unknown = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
    }

    return null;
  }

  visitVariableExpr(expr: Variable): unknown {
    return this.environment.get(expr.name);
  }

  visitBinaryExpr(expr: Binary): unknown {
    const left: unknown = this.evaluate(expr.left);
    const right: unknown = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return (left as number) + (right as number);
        }
        if (typeof left === "string" && typeof right === "string") {
          return (left as string) + (right as string);
        }

        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings.",
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) / (right as number);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
    }

    return null;
  }

  visitCallExpr(expr: Call): unknown {
    const callee = this.evaluate(expr.callee);

    // console.log(typeof callee);
    // console.log(callee);

    const args: unknown[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg as Expr));
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes.",
      );
    }

    const callable: LoxCallable = callee as LoxCallable;
    // TODO: fix type
    if (args.length !== (callable.arity() as unknown as number)) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${callable.arity()} arguments but got ${args.length}.`,
      );
    }

    return callable.call(this, args);
  }

  private evaluate(expr: Expr) {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;

    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression);
  }

  visitCallableStmt(stmt: Callable): void {
    const callable = new LoxFunction(stmt);
    this.environment.define(stmt.name.lexeme, callable);
  }

  visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: Print) {
    const value: unknown = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  visitReturnStmt(stmt: Return): void {
    let value: unknown = null;
    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }

    throw new ReturnError(value);
  }

  visitVarStmt(stmt: Var): void {
    let value = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  visitWhileStmt(stmt: While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitAssignExpr(expr: Assign): unknown {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  private isTruthy(value: unknown) {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return true;
  }

  private isEqual(a: unknown, b: unknown) {
    if (a === null && b === null) {
      return true;
    }
    if (a === null) {
      return false;
    }

    return a === b;
  }

  private checkNumberOperand(operator: Token, operand: unknown) {
    if (typeof operand === "number") {
      return;
    }

    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private checkNumberOperands(operator: Token, left: unknown, right: unknown) {
    if (typeof left === "number" && typeof right === "number") {
      return;
    }

    throw new RuntimeError(operator, "Operands must be a numbers.");
  }

  private stringify(value: unknown): string {
    if (value === null || value === undefined) {
      return "nil";
    }

    if (typeof value === "number") {
      let text: string = String(value);
      if (text.endsWith(".0")) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }

    return String(value);
  }
}
