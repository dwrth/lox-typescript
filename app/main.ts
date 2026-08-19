import fs from "node:fs";
import { exit } from "node:process";
import Scanner from "./scanner";
import { Parser } from "./parser";
import generateAst from "../tool/generate-ast";
import Interpreter from "./interpreter";
import AstPrinter from "./ast-printer";
import { Resolver } from "./resolver";

declare global {
  var hadError: boolean;
  var hadRuntimeError: boolean;
}

type Command = "tokenize" | "parse" | "evaluate" | "generate_ast" | "run";

const COMMANDS: ReadonlySet<Command> = new Set([
  "tokenize",
  "parse",
  "evaluate",
  "generate_ast",
  "run",
]);

function usage() {
  console.error("Usage: ./your_program.sh <command> <filename>");
  console.error("Commands: tokenize, parse, evaluate, run, generate_ast");
  exit(64);
}

function readSource(filename: string): string {
  return fs.readFileSync(filename, "utf8");
}

function tokenize(source: string): void {
  const scanner = new Scanner(source);
  if (source.length === 0) {
    console.log("EOF  null");
  } else {
    console.log(scanner.tokens.map((t) => t.toString()).join("\n"));
  }
}

function parse(source: string): void {
  const parser = new Parser(new Scanner(source).tokens);
  const expr = parser.parseTokens();
  if (!globalThis.hadError && expr) {
    console.log(new AstPrinter().print(expr));
  }
}

function evaluate(source: string): void {
  const parser = new Parser(new Scanner(source).tokens);
  const expr = parser.parseTokens();
  if (!globalThis.hadError && expr !== null) {
    new Interpreter().interpretExpr(expr);
  }
}

function run(source: string): void {
  const parser = new Parser(new Scanner(source).tokens);
  const statements = parser.parse();
  if (!globalThis.hadError && statements.length) {
    const interpreter = new Interpreter();
    const resolver = new Resolver(interpreter);
    resolver.resolve(statements);
    if (!globalThis.hadError) {
      interpreter.interpret(statements);
    }
  }
}

const args = process.argv.slice(2);

if (args.length < 2) {
  usage();
}

globalThis.hadError = false;
globalThis.hadRuntimeError = false;

const command = args[0];
if (!COMMANDS.has(command as Command)) {
  console.error(`Usage: Unknown command: ${command}`);
  exit(1);
}

switch (command) {
  case "tokenize":
    tokenize(readSource(args[1]!));
    break;
  case "parse":
    parse(readSource(args[1]!));
    break;
  case "evaluate":
    evaluate(readSource(args[1]!));
    break;
  case "run":
    run(readSource(args[1]!));
    break;
  case "generate_ast":
    generateAst(args.slice(1));
    break;
}

if (globalThis.hadError) {
  exit(65);
} else if (globalThis.hadRuntimeError) {
  exit(70);
}
