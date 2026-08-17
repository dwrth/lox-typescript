import type { Token } from '@/token';

export interface Visitor<R> {
 visitAssignExpr(expr: Assign): R;
 visitBinaryExpr(expr: Binary): R;
 visitCallExpr(expr: Call): R;
 visitGetExpr(expr: Get): R;
 visitGroupingExpr(expr: Grouping): R;
 visitLiteralExpr(expr: Literal): R;
 visitSetExpr(expr: Set): R;
 visitThisExpr(expr: This): R;
 visitLogicalExpr(expr: Logical): R;
 visitUnaryExpr(expr: Unary): R;
 visitVariableExpr(expr: Variable): R;
}

export interface Expr {
 accept<R>(visitor: Visitor<R>): R;
}

export class Assign implements Expr {
 constructor(name: Token, value: Expr) {
  this.name = name;
  this.value = value;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitAssignExpr(this);
 }

 name: Token;
 value: Expr;
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

export class Call implements Expr {
 constructor(callee: Expr, paren: Token, args: Expr[]) {
  this.callee = callee;
  this.paren = paren;
  this.args = args;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitCallExpr(this);
 }

 callee: Expr;
 paren: Token;
 args: Expr[];
}

export class Get implements Expr {
 constructor(object: Expr, name: Token) {
  this.object = object;
  this.name = name;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitGetExpr(this);
 }

 object: Expr;
 name: Token;
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

export class Set implements Expr {
 constructor(object: Expr, name: Token, value: Expr) {
  this.object = object;
  this.name = name;
  this.value = value;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitSetExpr(this);
 }

 object: Expr;
 name: Token;
 value: Expr;
}

export class This implements Expr {
 constructor(keyword: Token) {
  this.keyword = keyword;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitThisExpr(this);
 }

 keyword: Token;
}

export class Logical implements Expr {
 constructor(left: Expr, operator: Token, right: Expr) {
  this.left = left;
  this.operator = operator;
  this.right = right;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitLogicalExpr(this);
 }

 left: Expr;
 operator: Token;
 right: Expr;
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

export class Variable implements Expr {
 constructor(name: Token) {
  this.name = name;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitVariableExpr(this);
 }

 name: Token;
}

