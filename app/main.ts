import fs from "fs";
import Scanner from "./scanner";
import { Parser } from "./parser";
import { Logger } from "./logger";
import generateAst from "../tool/generate-ast";
import Interpreter from "./interpreter";
import AstPrinter from "./ast-printer";

declare global {
  var hadError: boolean;
  var hadRuntimeError: boolean;
  var logger: Logger;

  var command: "tokenize" | "parse" | "evaluate" | "generate_ast" | "run";
  var fileName: string;
  var fileContent: string;
}

const args: string[] = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: ./your_program.sh tokenize <filename>");
  process.exit(64);
}

globalThis.logger = new Logger();
globalThis.hadError = false;
globalThis.hadRuntimeError = false;

const command = args[0];
const filename = args[1];
const fileContent =
  filename.length && command !== "generate_ast"
    ? fs.readFileSync(filename, "utf8")
    : "";

const scanner = new Scanner(fileContent);
const parser = new Parser(scanner.tokens);

if (command === "tokenize") {
  if (fileContent.length === 0) {
    console.log("EOF  null");
  } else {
    console.log(scanner.tokens.map((t) => t.toString()).join("\n"));
  }
} else if (command === "parse") {
  const expr = parser.parseTokens();
  if (!globalThis.hadError && expr) {
    console.log(new AstPrinter().print(expr));
  }
} else if (command === "evaluate") {
  const expr = parser.parseTokens();
  if (!globalThis.hadError && expr !== null) {
    const interpreter = new Interpreter();
    interpreter.interpretExpr(expr);
  }
} else if (command === "run") {
  const statements = parser.parse();
  if (!globalThis.hadError && statements.length) {
    const interpreter = new Interpreter();
    interpreter.interpret(statements);
  }
} else if (command === "generate_ast") {
  generateAst(args.slice(1));
} else {
  console.error(`Usage: Unknown command: ${command}`);
  process.exit(1);
}

if (globalThis.hadError) {
  process.exit(65);
} else if (globalThis.hadRuntimeError) {
  process.exit(70);
}
