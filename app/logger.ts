export class Logger {
 private static report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error${where}: ${message}`);
 }

 public static error(line: number, message: string) {
  this.report(line, '', message);
 }
}
