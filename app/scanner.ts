import { exit } from 'node:process';
import { Logger } from './logger';
import { Token, TokenType } from './token';

export default class Scanner {
 private readonly source: String;
 private readonly tokens: Token[] = [];
 private start: number = 0;
 private current: number = 0;
 private line: number = 1;
 private hasError: boolean = false;

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
   case '{':
    this.addToken(TokenType.LEFT_BRACE);
    break;
   case '}':
    this.addToken(TokenType.RIGHT_BRACE);
    break;
   case ',':
    this.addToken(TokenType.COMMA);
    break;
   case '.':
    this.addToken(TokenType.DOT);
    break;
   case '-':
    this.addToken(TokenType.MINUS);
    break;
   case '+':
    this.addToken(TokenType.PLUS);
    break;
   case ';':
    this.addToken(TokenType.SEMICOLON);
    break;
   case '\/':
    this.addToken(TokenType.SLASH);
    break;
   case '*':
    this.addToken(TokenType.STAR);
    break;
   default:
    Logger.error(this.line, `Unexpected character: ${c}`);
    this.hasError = true;
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
  if (this.hasError) exit(65);
 }
}
