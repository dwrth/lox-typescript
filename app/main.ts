import fs from 'fs';
import Scanner from './scanner';
import { Parser } from './parser';
import type { Token } from './token';
import { Logger } from './logger';
import AstPrinter from './ast-printer';

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

 let scanner: Scanner;
 let tokens: Token[];

 if (fileContent.length !== 0) {
  scanner = new Scanner(fileContent);
  tokens = scanner.scanTokens();
 } else {
  return console.log('EOF  null');
 }

 switch (command) {
  case 'tokenize':
   scanner.printTokenList();
   break;
  case 'parse':
   const parser = new Parser(tokens);
   const expression = parser.parse();
   if (globalThis.hadError || expression === null) {
    return;
   }

   console.log(new AstPrinter().print(expression));
   break;
  default:
   console.error(`Usage: Unknown command: ${command}`);
   process.exit(1);
 }
}

main(process.argv.slice(2));
