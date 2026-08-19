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
  Get,
  Set,
  This,
} from "./expr";
import { Logger } from "./logger";
import { LoxCallable } from "./lox-callable";
import { LoxFunction } from "./lox-function";
import RuntimeError from "./runtime-error";
import { Return as ReturnError } from "./return.ts";
import type {
  Block,
  Class,
  Expression,
  Funct,
  If,
  Print,
  Return,
  Stmt,
  Visitor as StmtVisitor,
  Var,
  While,
} from "./stmt";
import { Token, TokenType } from "./token";
import { LoxClass } from "./lox-class.ts";
import { LoxInstance } from "./lox-instance.ts";

export default class Interpreter
  implements ExprVisitor<unknown>, StmtVisitor<void>
{
  readonly globals: Environment = new Environment();
  private environment: Environment = this.globals;
  private readonly locals: Map<Expr, number> = new Map();

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
      Logger.runtimeError(err as unknown as RuntimeError);
    }
  }

  public interpretExpr(expression: Expr) {
    try {
      const value: unknown = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (err) {
      Logger.runtimeError(err as unknown as RuntimeError);
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

  visitSetExpr(expr: Set): unknown {
    const object = this.evaluate(expr.object);

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, "Only instances have fields.");
    }

    const value = this.evaluate(expr.value);
    object.set(expr.name, value);
    return value;
  }

  visitThisExpr(expr: This): unknown {
    return this.lookUpVariable(expr.keyword, expr);
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
    return this.lookUpVariable(expr.name, expr);
  }

  private lookUpVariable(name: Token, expr: Expr): unknown {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
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

    const funct: LoxCallable = callee as LoxCallable;
    // TODO: fix type
    if (args.length !== (funct.arity() as unknown as number)) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${funct.arity()} arguments but got ${args.length}.`,
      );
    }

    return funct.call(this, args);
  }

  visitGetExpr(expr: Get): unknown {
    const object = this.evaluate(expr.object);
    if (object instanceof LoxInstance) {
      return object.get(expr.name);
    }

    throw new RuntimeError(expr.name, "Only instances have properties.");
  }

  private evaluate(expr: Expr) {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
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

  visitClassStmt(stmt: Class): void {
    let superclass: unknown = null;
    if (stmt.superclass !== null) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(
          stmt.superclass.name,
          "Superclass must be a class.",
        );
      }
    }

    this.environment.define(stmt.name.lexeme, null);

    const methods: Map<string, LoxFunction> = new Map();
    for (const method of stmt.methods) {
      const funct = new LoxFunction(
        method,
        this.environment,
        method.name.lexeme === "init",
      );
      methods.set(method.name.lexeme, funct);
    }

    const klass = new LoxClass(
      stmt.name.lexeme,
      superclass as LoxClass,
      methods,
    );
    this.environment.assign(stmt.name, klass);
  }

  visitExpressionStmt(stmt: Expression) {
    this.evaluate(stmt.expression);
  }

  visitFunctStmt(stmt: Funct): void {
    const funct = new LoxFunction(stmt, this.environment, false);
    this.environment.define(stmt.name.lexeme, funct);
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

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }
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
