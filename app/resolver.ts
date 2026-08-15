import type {
  Assign,
  Binary,
  Call,
  Expr,
  Visitor as ExprVisitor,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from "./expr";
import type Interpreter from "./interpreter";
import { Logger } from "./logger";
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
import type { Token } from "./token";

enum CallableType {
  NONE,
  CALLABLE,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;
  private readonly scopes: Map<string, boolean>[] = [];
  private currentCallable = CallableType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  resolve(statements: Stmt[]) {
    for (const statement of statements) {
      this.resolveStmt(statement);
    }
  }

  visitBlockStmt(stmt: Block) {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
    return null;
  }

  visitExpressionStmt(stmt: Expression) {
    this.resolveExpr(stmt.expression);
    return null;
  }

  visitIfStmt(stmt: If) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch !== null) {
      this.resolveStmt(stmt.elseBranch);
    }
    return null;
  }

  visitPrintStmt(stmt: Print) {
    this.resolveExpr(stmt.expression);
    return null;
  }

  visitReturnStmt(stmt: Return) {
    if (this.currentCallable === CallableType.NONE) {
      Logger.parserError(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value !== null) {
      this.resolveExpr(stmt.value);
    }

    return null;
  }

  visitCallableStmt(stmt: Callable) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveCallable(stmt, CallableType.CALLABLE);
    return null;
  }

  visitVarStmt(stmt: Var) {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
    return null;
  }

  visitWhileStmt(stmt: While) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
    return null;
  }

  visitAssignExpr(expr: Assign) {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr, expr.name);
    return null;
  }

  visitBinaryExpr(expr: Binary) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
    return null;
  }

  visitCallExpr(expr: Call) {
    this.resolveExpr(expr.callee);

    for (const arg of expr.args) {
      this.resolveExpr(arg);
    }

    return null;
  }

  visitGroupingExpr(expr: Grouping) {
    this.resolveExpr(expr.expression);
  }

  visitLiteralExpr(expr: Literal) {
    return null;
  }

  visitLogicalExpr(expr: Logical) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
    return null;
  }

  visitUnaryExpr(expr: Unary) {
    this.resolveExpr(expr.right);
    return null;
  }

  visitVariableExpr(expr: Variable) {
    if (
      this.scopes.length &&
      this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false
    ) {
      Logger.parserError(
        expr.name,
        "Can't read local variable in it s own initializer.",
      );
    }

    this.resolveLocal(expr, expr.name);
    return null;
  }

  private resolveStmt(stmt: Stmt) {
    stmt.accept(this);
  }

  private resolveExpr(expr: Expr) {
    expr.accept(this);
  }

  private resolveCallable(callable: Callable, type: CallableType) {
    const enclosingCallable = this.currentCallable;
    this.currentCallable = type;

    this.beginScope();
    for (const param of callable.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(callable.body);
    this.endScope();
    this.currentCallable = enclosingCallable;
  }

  private beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token) {
    if (!this.scopes.length) {
      return;
    }

    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(name.lexeme)) {
      Logger.parserError(
        name,
        "Already a variable with this name in this scope.",
      );
    }

    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (!this.scopes.length) {
      return;
    }

    this.scopes[this.scopes.length - 1].set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}
