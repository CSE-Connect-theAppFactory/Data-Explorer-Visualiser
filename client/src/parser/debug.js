import NodeSQLParser from "node-sql-parser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Parser } = NodeSQLParser;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlText = fs.readFileSync(path.join(__dirname, "sample.sql"), "utf-8");
const parser = new Parser();
const ast = parser.astify(sqlText, { database: "MySQL" });

const statements = Array.isArray(ast) ? ast : [ast];

for (const stmt of statements) {
  if (stmt.type !== "create") continue;

  console.log(`\n=== Table: ${stmt.table[0].table} ===`);

  for (const def of stmt.create_definitions) {
    if (
      def.resource === "constraint" &&
      def.constraint_type === "FOREIGN KEY"
    ) {
      console.log("Constraint definition:", JSON.stringify(def, null, 2));
    }
  }
}
