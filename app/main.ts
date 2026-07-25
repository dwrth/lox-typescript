import fs from 'fs';
import Scanner from './scanner';

class Lox {
 private args: string[] = process.argv.slice(2);
 private command: string;
 private filename: string;

 public constructor() {
  if (this.args.length < 2) {
   console.error('Usage: ./your_program.sh tokenize <filename>');
   process.exit(1);
  }

  this.command = this.args[0];
  this.filename = this.args[1];

  switch (this.command) {
   case 'tokenize':
    const fileContent: string = fs.readFileSync(this.filename, 'utf8');
    if (fileContent.length !== 0) {
     const scanner = new Scanner(fileContent);
     scanner.scanTokens();
     scanner.printTokenList();
    } else {
     console.log('EOF  null');
    }
    break;
   default:
    console.error(`Usage: Unknown command: ${this.command}`);
    process.exit(1);
  }
 }
}

new Lox();
