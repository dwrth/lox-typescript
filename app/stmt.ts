import type { Expr } from '@/expr';
import type { Token } from '@/token';

export interface Visitor<R> {
 visitExpressionStmt(stmt: Expression): R;
 visitPrintStmt(stmt: Print): R;
 visitVarStmt(stmt: Var): R;
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

export class Var implements Stmt {
 constructor(name: Token, initializer: Expr) {
  this.name = name;
  this.initializer = initializer;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitVarStmt(this);
 }

 name: Token;
 initializer: Expr;
}

