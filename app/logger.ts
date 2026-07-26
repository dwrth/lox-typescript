import { TokenType, type Token } from './token';

export class Logger {
 private static report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error${where}: ${message}`);
  globalThis.hadError = true;
 }

 public static error(line: number, message: string) {
  this.report(line, '', message);
 }

 public static parserError(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
   this.report(token.line, ' at end', message);
  } else {
   this.report(token.line, ` at '${token.lexeme}'`, message);
  }
 }
}
