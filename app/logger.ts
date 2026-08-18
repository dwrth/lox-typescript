import type RuntimeError from "./runtime-error";
import { TokenType, type Token } from "./token";

export class Logger {
  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    globalThis.hadError = true;
  }

  public static error(line: number, message: string) {
    this.report(line, "", message);
  }

  public static parserError(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      this.report(token.line, " at end", message);
    } else {
      this.report(token.line, ` at '${token.lexeme}'`, message);
    }
  }

  public static runtimeError(error: RuntimeError) {
    console.log("ruuuunn");
    // console.log(`${error.message} \n[line ${error.token.line}]`);
    globalThis.hadRuntimeError = true;
  }
}
