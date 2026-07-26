import type { Binary, Expr, Grouping, Literal, Unary, Visitor } from './expr';
import { TokenType } from './token';

export default class Interpreter implements Visitor<unknown> {
 public interpret(expression: Expr) {
  try {
   const value: unknown = this.evaluate(expression);
   console.log(this.stringify(value));
  } catch (err) {}
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
    return -Number(right);
  }

  return null;
 }

 visitBinaryExpr(expr: Binary): unknown {
  const left: unknown = this.evaluate(expr.left);
  const right: unknown = this.evaluate(expr.right);

  switch (expr.operator.type) {
   case TokenType.GREATER:
    return Number(left) > Number(right);
   case TokenType.GREATER_EQUAL:
    return Number(left) >= Number(right);
   case TokenType.LESS:
    return Number(left) < Number(right);
   case TokenType.LESS_EQUAL:
    return Number(left) <= Number(right);
   case TokenType.MINUS:
    return Number(left) - Number(right);
   case TokenType.PLUS:
    if (typeof left === 'number' && typeof right === 'number') {
     return Number(left) + Number(right);
    }
    if (typeof left === 'string' && typeof right === 'string') {
     return String(left) + String(right);
    }
    break;
   case TokenType.SLASH:
    return Number(left) / Number(right);
   case TokenType.STAR:
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

  return a === b;
 }

 private stringify(value: unknown): string {
  if (value === null) {
   return 'nil';
  }

  if (!isNaN(Number(value))) {
   let text: string = String(value);
   if (text.endsWith('.0')) {
    text = text.substring(0, text.length - 2);
   }
   return text;
  }

  return String(value);
 }
}
