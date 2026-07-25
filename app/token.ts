export enum TokenType {
 LEFT_PAREN = 'LEFT_PAREN',
 RIGHT_PAREN = 'RIGHT_PAREN',
 LEFT_BRACE = 'LEFT_BRACE',
 RIGHT_BRACE = 'RIGHT_BRACE',

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

 STRING = 'STRING',
 NUMBER = 'NUMBER',

 IDENTIFIER = 'IDENTIFIER',

 AND = 'AND',
 CLASS = 'CLASS',
 ELSE = 'ELSE',
 FALSE = 'FALSE',
 FOR = 'FOR',
 FUN = 'FUN',
 IF = 'IF',
 NIL = 'NIL',
 OR = 'OR',
 PRINT = 'PRINT',
 RETURN = 'RETURN',
 SUPER = 'SUPER',
 THIS = 'THIS',
 TRUE = 'TRUE',
 VAR = 'VAR',
 WHILE = 'WHILE',

 EOF = 'EOF',
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
