import type { Token } from '@/token';

export interface Visitor<R> {
 visitBinaryExpr(expr: Binary): R;
 visitGroupingExpr(expr: Grouping): R;
 visitLiteralExpr(expr: Literal): R;
 visitUnaryExpr(expr: Unary): R;
}

export interface Expr {
 accept<R>(visitor: Visitor<R>): R;
}

export class Binary implements Expr {
 constructor(left: Expr, operator: Token, right: Expr) {
  this.left = left;
  this.operator = operator;
  this.right = right;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitBinaryExpr(this);
 }

 left: Expr;
 operator: Token;
 right: Expr;
}

export class Grouping implements Expr {
 constructor(expression: Expr) {
  this.expression = expression;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitGroupingExpr(this);
 }

 expression: Expr;
}

export class Literal implements Expr {
 constructor(value: unknown) {
  this.value = value;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitLiteralExpr(this);
 }

 value: unknown;
}

export class Unary implements Expr {
 constructor(operator: Token, right: Expr) {
  this.operator = operator;
  this.right = right;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitUnaryExpr(this);
 }

 operator: Token;
 right: Expr;
}

