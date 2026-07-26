import fs from 'fs';
import Scanner from './scanner';
import { Parser } from './parser';
import { Logger } from './logger';
import AstPrinter from './ast-printer';
import Interpreter from './interpreter';
import type { Token } from './token';

declare global {
 var logger: Logger;
 var hadError: boolean;
}

function main(args: string[]) {
 if (args.length < 2) {
  console.error('Usage: ./your_program.sh tokenize <filename>');
  process.exit(1);
 }

 globalThis.logger = new Logger();
 globalThis.hadError = false;

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
    process.exit(65);
   }

   console.log(new AstPrinter().print(expression));
   break;
  case 'evaluate':
   tokens = scanner.scanTokens();
   const parserE = new Parser(tokens);
   const expressionE = parserE.parse();

   if (globalThis.hadError || expressionE === null) {
    process.exit(65);
   }

   const interpreter = new Interpreter();
   interpreter.interpret(expressionE);
   break;
  default:
   console.error(`Usage: Unknown command: ${command}`);
   process.exit(1);
 }
}

main(process.argv.slice(2));
