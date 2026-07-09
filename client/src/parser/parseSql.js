import NodeSQLParser from "node-sql-parser";
const { Parser } = NodeSQLParser;
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts foreign key relationships from CREATE TABLE statement
 * @param {Object} stmt - The CREATE TABLE statement AST
 * @param {string} tableName - The table name
 * @returns {Array<{from_table: string, from_column: string, to_table: string, to_column: string}>}
 */
function extractForeignKeys(stmt, tableName) {
  const relationships = [];

  for (const def of stmt.create_definitions) {
    if (def.resource !== "constraint") continue;
    if (def.constraint_type !== "FOREIGN KEY") continue;

    // Extract the column(s) from this table
    const fromCols = def.definition || [];
    const fromCol = fromCols[0]?.column || fromCols[0];

    // Extract the referenced table and column(s)
    const refDef = def.reference_definition;
    if (!refDef) continue;

    const refTable = refDef.table[0].table;
    const refCols = refDef.definition || [];
    const refCol = refCols[0]?.column || refCols[0];

    relationships.push({
      from_table: tableName,
      from_column: fromCol,
      to_table: refTable,
      to_column: refCol,
    });
  }

  return relationships;
}

/**
 * Reads a .sql file and extracts table names with their columns and foreign key relationships.
 *
 * @param {string} sqlFilePath - Absolute path to the .sql file
 * @returns {Object} { tables: Array, relationships: Array }
 */
export function parseSqlFile(sqlFilePath) {
  const sqlText = fs.readFileSync(sqlFilePath, "utf-8");
  const parser = new Parser();
  const ast = parser.astify(sqlText, { database: "MySQL" });

  // astify returns a single object for one statement, or an array for multiple
  const statements = Array.isArray(ast) ? ast : [ast];

  const tables = [];
  const relationships = [];

  for (const stmt of statements) {
    // Only process CREATE TABLE statements
    if (stmt.type !== "create") continue;

    const tableName = stmt.table[0].table;

    const columns = [];
    for (const def of stmt.create_definitions) {
      // Skip constraints (FOREIGN KEY, PRIMARY KEY, etc.) — only keep column defs
      if (def.resource === "constraint") continue;

      const colName = def.column.column;

      // Build a readable type string from the dataType field
      // node-sql-parser puts precision in .length and scale in .scale
      let colType = def.definition.dataType;
      if (def.definition.length != null) {
        if (def.definition.scale != null) {
          colType += `(${def.definition.length},${def.definition.scale})`;
        } else {
          colType += `(${def.definition.length})`;
        }
      }

      columns.push({ name: colName, type: colType });
    }

    tables.push({ table: tableName, columns });

    // Extract foreign keys from this table
    const fkRels = extractForeignKeys(stmt, tableName);
    relationships.push(...fkRels);
  }

  return { tables, relationships };
}

/**
 * Convenience: parse the bundled sample.sql file.
 */
export function parseSampleFile() {
  const samplePath = path.join(__dirname, "sample.sql");
  return parseSqlFile(samplePath);
}

/**
 * Convenience: parse the second sample.sql file.
 */
export function parseSample2File() {
  const samplePath = path.join(__dirname, "sample2.sql");
  return parseSqlFile(samplePath);
}

/**
 * Convenience: parse the third (messier) sample.sql file.
 * Week 3 stress-test: named constraints, DECIMAL, TEXT, BOOLEAN, TIMESTAMP,
 * AUTO_INCREMENT, NOT NULL, DEFAULT, self-referential FK, junction table.
 */
export function parseSample3File() {
  const samplePath = path.join(__dirname, "sample3.sql");
  return parseSqlFile(samplePath);
}
