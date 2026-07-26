import {
 Binary,
 Grouping,
 Literal,
 Unary,
 type Expr,
 type Visitor,
} from './expr';

export default class AstPrinter implements Visitor<string> {
 print(expr: Expr): string {
  return expr.accept(this);
 }

 visitBinaryExpr(expr: Binary): string {
  return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
 }

 visitGroupingExpr(expr: Grouping): string {
  return this.parenthesize('group', expr.expression);
 }

 visitLiteralExpr(expr: Literal): string {
  if (!expr.value && expr.value !== false) {
   return 'nil';
  }
  return expr.value.toString();
 }

 visitUnaryExpr(expr: Unary): string {
  return this.parenthesize(expr.operator.lexeme, expr.right);
 }

 private parenthesize(name: string, ...exprs: Expr[]) {
  return `(${name} ${exprs.map((expr) => `${expr.accept(this)}`).join(' ')})`;
 }
}
