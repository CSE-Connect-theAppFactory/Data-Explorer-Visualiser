import NodeSQLParser from 'node-sql-parser';
const { Parser } = NodeSQLParser;
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads a .sql file and extracts table names with their columns.
 *
 * @param {string} sqlFilePath - Absolute path to the .sql file
 * @returns {Array<{table: string, columns: Array<{name: string, type: string}>}>}
 */
export function parseSqlFile(sqlFilePath) {
  const sqlText = fs.readFileSync(sqlFilePath, 'utf-8');
  const parser = new Parser();
  const ast = parser.astify(sqlText, { database: 'MySQL' });

  // astify returns a single object for one statement, or an array for multiple
  const statements = Array.isArray(ast) ? ast : [ast];

  const tables = [];

  for (const stmt of statements) {
    // Only process CREATE TABLE statements
    if (stmt.type !== 'create') continue;

    const tableName = stmt.table[0].table;

    const columns = [];
    for (const def of stmt.create_definitions) {
      // Skip constraints (FOREIGN KEY, PRIMARY KEY, etc.) — only keep column defs
      if (def.resource === 'constraint') continue;

      const colName = def.column.column;

      // Build a readable type string from the dataType field
      let colType = def.definition.dataType;
      if (def.definition.length) {
        colType += `(${def.definition.length})`;
      }

      columns.push({ name: colName, type: colType });
    }

    tables.push({ table: tableName, columns });
  }

  return tables;
}

/**
 * Convenience: parse the bundled sample.sql file.
 */
export function parseSampleFile() {
  const samplePath = path.join(__dirname, 'sample.sql');
  return parseSqlFile(samplePath);
}
