import type { Binary, Expr, Grouping, Literal, Unary, Visitor } from './expr';
import { Logger } from './logger';
import RuntimeError from './runtime-error';
import { Token, TokenType } from './token';

export default class Interpreter implements Visitor<unknown> {
 public interpret(expression: Expr) {
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
    return -Number(right);
  }

  return null;
 }

 private checkNumberOperand(operator: Token, operand: unknown) {
  if (globalThis.isNumeric(operand)) {
   return;
  }

  throw new RuntimeError(operator, 'Operand must be a number.');
 }

 private checkNumberOperands(operator: Token, left: unknown, right: unknown) {
  if (globalThis.isNumeric(left) && globalThis.isNumeric(right)) {
   return;
  }

  throw new RuntimeError(operator, 'Operands must be a numbers.');
 }

 visitBinaryExpr(expr: Binary): unknown {
  const left: unknown = this.evaluate(expr.left);
  const right: unknown = this.evaluate(expr.right);

  switch (expr.operator.type) {
   case TokenType.GREATER:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) > Number(right);
   case TokenType.GREATER_EQUAL:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) >= Number(right);
   case TokenType.LESS:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) < Number(right);
   case TokenType.LESS_EQUAL:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) <= Number(right);
   case TokenType.MINUS:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) - Number(right);
   case TokenType.PLUS:
    if (globalThis.isNumeric(left) && globalThis.isNumeric(right)) {
     return Number(left) + Number(right);
    }
    if (typeof left === 'string' && typeof right === 'string') {
     return String(left) + String(right);
    }

    throw new RuntimeError(
     expr.operator,
     'Operands must be two numbers or two strings.',
    );
   case TokenType.SLASH:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) / Number(right);
   case TokenType.STAR:
    this.checkNumberOperands(expr.operator, left, right);
    return Number(left) * Number(right);
   case TokenType.BANG_EQUAL:
    return !this.isEqual(left, right);
   case TokenType.EQUAL_EQUAL:
    return this.isEqual(left, right);
  }

  return null;
 }

 private evaluate(expr: Expr) {
  return expr.accept(this);
 }

 private isTruthy(value: unknown) {
  if (value === null) {
   return false;
  }
  if (typeof value === 'boolean') {
   return Boolean(value);
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

  return a == b;
 }

 private stringify(value: unknown): string {
  if (value === null) {
   return 'nil';
  }

  if (globalThis.isNumeric(value)) {
   let text: string = String(value);
   if (text.endsWith('.0')) {
    text = text.substring(0, text.length - 2);
   }
   return text;
  }

  return String(value);
 }
}
