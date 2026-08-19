import type { Expr, Variable } from '@/expr';
import type { Token } from '@/token';

export interface Visitor<R> {
 visitBlockStmt(stmt: Block): R;
 visitClassStmt(stmt: Class): R;
 visitExpressionStmt(stmt: Expression): R;
 visitFunctStmt(stmt: Funct): R;
 visitIfStmt(stmt: If): R;
 visitPrintStmt(stmt: Print): R;
 visitReturnStmt(stmt: Return): R;
 visitVarStmt(stmt: Var): R;
 visitWhileStmt(stmt: While): R;
}

export interface Stmt {
 accept<R>(visitor: Visitor<R>): R;
}

export class Block implements Stmt {
 constructor(statements: Stmt[]) {
  this.statements = statements;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitBlockStmt(this);
 }

 statements: Stmt[];
}

export class Class implements Stmt {
 constructor(name: Token, superclass: Variable, methods: Funct[]) {
  this.name = name;
  this.superclass = superclass;
  this.methods = methods;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitClassStmt(this);
 }

 name: Token;
 superclass: Variable;
 methods: Funct[];
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

export class Funct implements Stmt {
 constructor(name: Token, params: Token[], body: Stmt[]) {
  this.name = name;
  this.params = params;
  this.body = body;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitFunctStmt(this);
 }

 name: Token;
 params: Token[];
 body: Stmt[];
}

export class If implements Stmt {
 constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt) {
  this.condition = condition;
  this.thenBranch = thenBranch;
  this.elseBranch = elseBranch;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitIfStmt(this);
 }

 condition: Expr;
 thenBranch: Stmt;
 elseBranch: Stmt;
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

export class Return implements Stmt {
 constructor(keyword: Token, value: Expr) {
  this.keyword = keyword;
  this.value = value;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitReturnStmt(this);
 }

 keyword: Token;
 value: Expr;
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

export class While implements Stmt {
 constructor(condition: Expr, body: Stmt) {
  this.condition = condition;
  this.body = body;
 }

 accept<R>(visitor: Visitor<R>) {
  return visitor.visitWhileStmt(this);
 }

 condition: Expr;
 body: Stmt;
}

