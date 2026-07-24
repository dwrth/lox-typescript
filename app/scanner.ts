import { Token, TokenType } from './token';

export default class Scanner {
 private readonly source: String;
 private readonly tokens: Token[] = [];
 private start: number = 0;
 private current: number = 0;
 private line: number = 1;

 constructor(source: string) {
  this.source = source;
 }

 public scanTokens() {
  while (!this.isAtEnd()) {
   this.start = this.current;
   this.scanToken();
  }

  this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
  return this.tokens;
 }

 private isAtEnd() {
  return this.current >= this.source.length;
 }

 private scanToken() {
  const c = this.advance();

  switch (c) {
   case '(':
    this.addToken(TokenType.LEFT_PAREN);
    break;
   case ')':
    this.addToken(TokenType.RIGHT_PAREN);
    break;
   default:
    console.error(this.line, 'Unexpected character.');
    break;
  }
 }

 private advance() {
  return this.source.charAt(this.current++);
 }

 private addToken(type: TokenType, literal: unknown = null) {
  const text: string = this.source.substring(this.start, this.current);
  this.tokens.push(new Token(type, text, literal, this.line));
 }

 public printTokenList() {
  console.log(this.tokens.map((t) => t.toString()).join('\n'));
 }
}
