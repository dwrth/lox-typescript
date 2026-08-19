import { constants } from "node:buffer";
import {
  Assign,
  Binary,
  Call,
  Get,
  Grouping,
  Literal,
  Logical,
  Set,
  This,
  Unary,
  Variable,
  type Expr,
} from "./expr";
import { Logger } from "./logger";
import {
  Block,
  Funct,
  Expression,
  If,
  Print,
  Return,
  Var,
  While,
  type Stmt,
  Class,
} from "./stmt";
import { Token, TokenType } from "./token";

class ParseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ParseError";
  }
}

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parseTokens(): Expr | null {
    try {
      return this.expression();
    } catch (error) {
      return null;
    }
  }

  public parse(): Stmt[] {
    const statements: Stmt[] = [];

    try {
      while (!this.isAtEnd()) {
        statements.push(this.declaration());
      }
    } catch (error) {
      //
    }
    return statements;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private declaration() {
    try {
      if (this.match(TokenType.CLASS)) {
        return this.classDeclaration();
      }
      if (this.match(TokenType.FUN)) {
        return this.funct("function");
      }
      if (this.match(TokenType.VAR)) {
        return this.varDeclaration();
      }

      return this.statement();
    } catch (err) {
      this.synchronize();
      return null as unknown as Stmt;
    }
  }

  private classDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");

    let superclass: Variable | null = null;
    if (this.match(TokenType.LESS)) {
      this.consume(TokenType.IDENTIFIER, "Expect superclass name.");
      superclass = new Variable(this.previous());
    }

    this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

    const methods: Funct[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.funct("method"));
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

    return new Class(name, superclass as Variable, methods);
  }

  private statement(): Stmt {
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }

    if (this.match(TokenType.RETURN)) {
      return this.returnStatement();
    }

    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }

    if (this.match(TokenType.FOR)) {
      return this.forStatement();
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      return new Block(this.block());
    }

    return this.expressionStatement();
  }

  private ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition: Expr = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch: Stmt = this.statement();
    let elseBranch: Stmt | null = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new If(condition, thenBranch, elseBranch as Stmt);
  }

  private printStatement(): Stmt {
    const value: Expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private varDeclaration(): Stmt {
    const name: Token = this.consume(
      TokenType.IDENTIFIER,
      "Expect variable name.",
    );

    let initializer: Expr | null = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    // TODO: figure out how to handle null statements
    return new Var(name, initializer as Expr);
  }

  private returnStatement(): Stmt {
    const keyword = this.previous();
    let value: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new Return(keyword, value as Expr);
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition: Expr = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body: Stmt = this.statement();

    return new While(condition, body);
  }

  private forStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt | null;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment: Expr | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body: Stmt = this.statement();

    if (increment !== null) {
      body = new Block([body, new Expression(increment)]);
    }

    if (condition === null) {
      condition = new Literal(true);
    }

    body = new While(condition, body);

    if (initializer !== null) {
      body = new Block([initializer, body]);
    }

    return body;
  }

  private expressionStatement(): Stmt {
    const expr: Expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private funct(kind: string): Funct {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);

    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
    const parameters: Token[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }

        parameters.push(
          this.consume(TokenType.IDENTIFIER, "Expect parameter name"),
        );
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.block();

    return new Funct(name, parameters, body);
  }

  private block(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      } else if (expr instanceof Get) {
        const get = expr;
        return new Set(get.object, get.name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private or(): Expr {
    let expr: Expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator: Token = this.previous();
      const right: Expr = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr: Expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator: Token = this.previous();
      const right: Expr = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private equality(): Expr {
    let expr: Expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator: Token = this.previous();
      const right: Expr = this.comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr: Expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator: Token = this.previous();
      const right: Expr = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr: Expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator: Token = this.previous();
      const right: Expr = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr: Expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator: Token = this.previous();
      const right: Expr = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator: Token = this.previous();
      const right: Expr = this.unary();
      return new Unary(operator, right);
    }

    return this.call();
  }

  private finishCall(callee: Expr) {
    const args: Expr[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments.",
    );

    return new Call(callee, paren, args);
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          "Expected property name after '.'.",
        );
        expr = new Get(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return new Literal(false);
    }

    if (this.match(TokenType.TRUE)) {
      return new Literal(true);
    }

    if (this.match(TokenType.NIL)) {
      return new Literal(null);
    }

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.THIS)) {
      return new This(this.previous());
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr: Expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }

    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): Error {
    Logger.parserError(token, message);
    return new ParseError();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) {
        return;
      }

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}
