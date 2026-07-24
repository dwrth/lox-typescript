export enum TokenType {
 LEFT_PAREN,
 RIGHT_PAREN,
 EOF,
}

export class Token {
 readonly type: TokenType;
 readonly lexeme: string;
 readonly literal: unknown;
 readonly line: number;

 constructor(type: TokenType, lexeme: string, literal: unknown, line: number) {
  this.type = type;
  this.lexeme = lexeme;
  this.literal = literal;
  this.line = line;
 }

 public toString() {
  return `${this.type} ${this.lexeme} ${this.literal}`;
 }
}
