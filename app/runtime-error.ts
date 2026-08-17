import type { Token } from "./token";

export default class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message?: string) {
    super(message);
    this.name = "RuntimeError";
    this.token = token;
  }
}
