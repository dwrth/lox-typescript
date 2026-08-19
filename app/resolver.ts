import type {
  Assign,
  Binary,
  Call,
  Expr,
  Visitor as ExprVisitor,
  Get,
  Grouping,
  Literal,
  Logical,
  Set,
  Super,
  This,
  Unary,
  Variable,
} from "./expr";
import type Interpreter from "./interpreter";
import { Logger } from "./logger";
import type {
  Block,
  Funct,
  Expression,
  If,
  Print,
  Return,
  Stmt,
  Visitor as StmtVisitor,
  Var,
  While,
  Class,
} from "./stmt";
import type { Token } from "./token";

enum FunctType {
  NONE,
  FUNCT,
  INITIALIZER,
  METHOD,
}

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;
  private readonly scopes: Map<string, boolean>[] = [];
  private currentFunct = FunctType.NONE;
  private currentClass = ClassType.NONE;

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

  visitClassStmt(stmt: Class) {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (
      stmt.superclass !== null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      Logger.parserError(
        stmt.superclass.name,
        "A class can't inherit from itself.",
      );
    }

    if (stmt.superclass !== null) {
      this.resolveExpr(stmt.superclass);
    }

    if (stmt.superclass !== null) {
      this.currentClass = ClassType.SUBCLASS;
      this.beginScope();
      this.scopes[this.scopes.length - 1].set("super", true);
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1].set("this", true);

    for (const method of stmt.methods) {
      let declaration = FunctType.METHOD;
      if (method.name.lexeme === "init") {
        declaration = FunctType.INITIALIZER;
      }

      this.resolveFunct(method, declaration);
    }

    this.endScope();

    if (stmt.superclass !== null) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
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
    if (this.currentFunct === FunctType.NONE) {
      Logger.parserError(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value !== null) {
      if (this.currentFunct === FunctType.INITIALIZER) {
        Logger.parserError(
          stmt.keyword,
          "Can't return a value from an initializer.",
        );
      }
      this.resolveExpr(stmt.value);
    }

    return null;
  }

  visitFunctStmt(stmt: Funct) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunct(stmt, FunctType.FUNCT);
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

  visitGetExpr(expr: Get) {
    this.resolveExpr(expr.object);
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

  visitSetExpr(expr: Set) {
    this.resolveExpr(expr.value);
    this.resolveExpr(expr.object);
    return null;
  }

  visitSuperExpr(expr: Super) {
    if (this.currentClass === ClassType.NONE) {
      Logger.parserError(expr.keyword, "Can't use 'super' outside of a class.");
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      Logger.parserError(
        expr.keyword,
        "Can't use 'super' in a class with no superclass.",
      );
    }
    this.resolveLocal(expr, expr.keyword);
    return null;
  }

  visitThisExpr(expr: This) {
    if (this.currentClass === ClassType.NONE) {
      Logger.parserError(expr.keyword, "Can't use 'this' outside of a class.");
      return null;
    }

    this.resolveLocal(expr, expr.keyword);
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

  private resolveFunct(funct: Funct, type: FunctType) {
    const enclosingFunct = this.currentFunct;
    this.currentFunct = type;

    this.beginScope();
    for (const param of funct.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(funct.body);
    this.endScope();
    this.currentFunct = enclosingFunct;
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
