import type { Expr } from "@/expr";

export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
}

export interface Stmt {
  accept<R>(visitor: Visitor<R>): R;
}

export class Expression implements Stmt {
  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitExpressionStmt(this);
  }

  expression: Expr;
}

export class Print implements Stmt {
  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: Visitor<R>) {
    return visitor.visitPrintStmt(this);
  }

  expression: Expr;
}
