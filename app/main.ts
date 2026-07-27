import fs from 'fs';
import Scanner from './scanner';
import { Parser } from './parser';
import { Logger } from './logger';
import AstPrinter from './ast-printer';
import Interpreter from './interpreter';
import type { Token } from './token';
import { exit } from 'process';

declare global {
 var logger: Logger;
 var hadError: boolean;
 var hadRuntimeError: boolean;
 var isNumeric: (value: unknown) => boolean;
}

function main(args: string[]) {
 if (args.length < 2) {
  console.error('Usage: ./your_program.sh tokenize <filename>');
  process.exit(1);
 }

 globalThis.logger = new Logger();
 globalThis.hadError = false;
 globalThis.hadRuntimeError = false;
 globalThis.isNumeric = (value: unknown) => {
  return (
   value !== '' &&
   value !== null &&
   value !== false &&
   value !== true &&
   value !== true &&
   Number.isFinite(Number(value))
  );
 };

 const command = args[0];
 const filename = args[1];
 const fileContent = fs.readFileSync(filename, 'utf8');

 const scanner = new Scanner(fileContent);
 const parser = (tokens: Token[]) => new Parser(tokens);
 let tokens: Token[];

 switch (command) {
  case 'tokenize':
   if (fileContent.length !== 0) {
    scanner.scanTokens();
    scanner.printTokenList();
   } else {
    return console.log('EOF  null');
   }
   break;
  case 'parse':
   tokens = scanner.scanTokens();
   const expression = parser(tokens).parse();

   if (globalThis.hadError || expression === null) {
    break;
   }

   console.log(new AstPrinter().print(expression));
   break;
  case 'evaluate':
   tokens = scanner.scanTokens();
   const parserE = new Parser(tokens);
   const expressionE = parserE.parse();

   if (globalThis.hadError || expressionE === null) {
    break;
   }

   const interpreter = new Interpreter();
   interpreter.interpret(expressionE);
   break;
  default:
   console.error(`Usage: Unknown command: ${command}`);
   process.exit(1);
 }

 if (globalThis.hadError) {
  process.exit(65);
 }

 if (globalThis.hadRuntimeError) {
  process.exit(70);
 }
}

main(process.argv.slice(2));
