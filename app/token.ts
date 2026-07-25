export enum TokenType {
 LEFT_PAREN = 'LEFT_PAREN',
 RIGHT_PAREN = 'RIGHT_PAREN',
 LEFT_BRACE = 'LEFT_BRACE',
 RIGHT_BRACE = 'RIGHT_BRACE',
 EOF = 'EOF',

 COMMA = 'COMMA',
 DOT = 'DOT',
 MINUS = 'MINUS',
 PLUS = 'PLUS',
 SEMICOLON = 'SEMICOLON',
 SLASH = 'SLASH',
 STAR = 'STAR',

 EQUAL = 'EQUAL',
 EQUAL_EQUAL = 'EQUAL_EQUAL',

 BANG = 'BANG',
 BANG_EQUAL = 'BANG_EQUAL',

 LESS = 'LESS',
 LESS_EQUAL = 'LESS_EQUAL',
 GREATER = 'GREATER',
 GREATER_EQUAL = 'GREATER_EQUAL',
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
