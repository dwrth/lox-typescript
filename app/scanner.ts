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
    if (this.match('\/')) {
     while (this.peek() != '\n' && !this.isAtEnd()) {
      this.advance();
     }
    } else {
     this.addToken(TokenType.SLASH);
    }
    break;
   case '*':
    this.addToken(TokenType.STAR);
    break;
   case '=':
    this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
    break;
   case '!':
    this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
    break;
   case '<':
    this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
    break;
   case '>':
    this.addToken(
     this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER,
    );
    break;
   case '"':
    this.string();
    break;
   case '\r':
   case '\t':
    break;
   case '\n':
    this.line++;
    break;
   default:
    if (this.isDigit(c)) {
     this.number();
    } else {
     Logger.error(this.line, `Unexpected character: ${c}`);
     this.hasError = true;
    }
    break;
  }
 }

 private number() {
  while (this.isDigit(this.peek())) {
   this.advance();
  }

  if (this.peek() == '.' && this.isDigit(this.peekNext())) {
   this.advance();

   while (this.isDigit(this.peek())) {
    this.advance();
   }
  }

  this.addToken(
   TokenType.NUMBER,
   this.format(this.source.substring(this.start, this.current)),
  );
 }

 private isDigit(c: string) {
  return c >= '0' && c <= '9';
 }

 private format(num: string) {
  console.log(num);
  return `${num}${Number.isInteger(num) ? '.0' : ''}`;
 }

 private string() {
  while (this.peek() != '"' && !this.isAtEnd()) {
   if (this.peek() == '\n') {
    this.line++;
   }
   this.advance();
  }

  if (this.isAtEnd()) {
   Logger.error(this.line, 'Unterminated string.');
   this.hasError = true;
   return;
  }

  this.advance();

  this.addToken(
   TokenType.STRING,
   this.source.substring(this.start + 1, this.current - 1),
  );
 }

 private match(expected: string) {
  if (this.isAtEnd()) {
   return false;
  }
  if (this.source.charAt(this.current) != expected) {
   return false;
  }

  this.current++;
  return true;
 }

 private peek() {
  if (this.isAtEnd()) {
   return '\0';
  }

  return this.source.charAt(this.current);
 }

 private peekNext() {
  if (this.current + 1 >= this.source.length) {
   return '\0';
  }

  return this.source.charAt(this.current + 1);
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
