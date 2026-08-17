import { exit } from "node:process";
import * as fs from "fs";

export default function generateAst(args: string[]): void {
  if (args.length != 1) {
    console.error("Usage: generate_ast <output dir>");
    exit(64);
  }

  const outputDir = args[0];
  defineAst(outputDir, "Expr", [
    "Assign   | name: Token, value: Expr",
    "Binary   | left: Expr, operator: Token, right: Expr",
    "Call     | callee: Expr, paren: Token, args: Expr[]",
    "Grouping | expression: Expr",
    "Literal  | value: unknown",
    "Logical  | left: Expr, operator: Token, right: Expr",
    "Unary    | operator: Token, right: Expr",
    "Variable | name: Token",
  ]);

  defineAst(outputDir, "Stmt", [
    "Block      | statements: Stmt[]",
    "Class      | name: Token, methods: Funct[]",
    "Expression | expression: Expr",
    "Funct      | name: Token, params: Token[], body: Stmt[]",
    "If         | condition: Expr, thenBranch: Stmt, elseBranch: Stmt",
    "Print      | expression: Expr",
    "Return     | keyword: Token, value: Expr",
    "Var        | name: Token, initializer: Expr",
    "While      | condition: Expr, body: Stmt",
  ]);
}

function defineAst(outputDir: string, baseName: string, types: string[]): void {
  const path = `${outputDir}/${baseName.toLowerCase()}.ts`;
  const writer = fs.createWriteStream(path, "utf-8");

  writer.on("open", () => {
    if (baseName !== "Expr") {
      writer.write("import type { Expr } from '@/expr';\n");
    }
    writer.write("import type { Token } from '@/token';\n\n");

    defineVisitor(writer, baseName, types);

    writer.write(`export interface ${baseName} {\n`);
    writer.write(" accept<R>(visitor: Visitor<R>): R;\n");
    writer.write("}\n\n");

    for (const type of types) {
      const className = type.split("|")[0].trim();
      const fields = type.split("|")[1].trim();
      defineType(writer, baseName, className, fields);
    }
    writer.close();
  });
}

function defineVisitor(
  writer: fs.WriteStream,
  baseName: string,
  types: string[],
): void {
  writer.write(`export interface Visitor<R> {\n`);

  for (const type of types) {
    const typeName = type.split("|")[0].trim();
    writer.write(
      ` visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;\n`,
    );
  }

  writer.write("}\n\n");
}

function defineType(
  writer: fs.WriteStream,
  baseName: string,
  className: string,
  fieldList: string,
) {
  const fields = fieldList.split(",").map((f) => f.trim());

  writer.write(`export class ${className} implements ${baseName} {\n`);

  writer.write(` constructor(${fieldList}) {\n`);

  for (const field of fields) {
    const name = field.split(":")[0].trim();
    writer.write(`  this.${name} = ${name};\n`);
  }

  writer.write(" }\n\n");

  writer.write(" accept<R>(visitor: Visitor<R>) {\n");
  writer.write(`  return visitor.visit${className}${baseName}(this);\n`);
  writer.write(" }\n\n");

  for (const field of fields) {
    writer.write(` ${field};\n`);
  }

  writer.write("}\n\n");
}
