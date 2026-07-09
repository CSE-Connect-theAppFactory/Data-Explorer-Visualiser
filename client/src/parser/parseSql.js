import NodeSQLParser from "node-sql-parser";
const { Parser } = NodeSQLParser;
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPrimaryKeyConstraint(constraintDef) {
  return constraintDef?.constraint_type?.toLowerCase() === "primary key";
}

function isForeignKeyConstraint(constraintDef) {
  return constraintDef?.constraint_type?.toLowerCase() === "foreign key";
}

function extractForeignKey(constraintDef, tableName) {
  const fromCols = constraintDef.definition || [];
  const fromCol = fromCols[0]?.column || fromCols[0];

  const refDef = constraintDef.reference_definition;
  if (!refDef) return null;

  const refTable = refDef.table[0].table;
  const refCols = refDef.definition || [];
  const refCol = refCols[0]?.column || refCols[0];

  return { from_table: tableName, from_column: fromCol, to_table: refTable, to_column: refCol };
}

/**
 * Parses SQL text and extracts table names with their columns (including
 * isPrimaryKey) and foreign key relationships.
 *
 * Primary keys and foreign keys can show up in three different forms depending
 * on how the SQL was generated:
 *  - column-level, e.g. `id INT PRIMARY KEY` (resource: "column", def.primary_key set)
 *  - table-level, inside CREATE TABLE's parens, e.g. `PRIMARY KEY (id)` (resource: "constraint")
 *  - phpMyAdmin-style, in a separate `ALTER TABLE ... ADD PRIMARY KEY (...)` /
 *    `ADD CONSTRAINT ... FOREIGN KEY` statement that comes after the CREATE TABLE
 * All three are collected before columns are stamped with isPrimaryKey, since the
 * ALTER TABLE form can arrive after the table's columns have already been read.
 *
 * @param {string} sqlText - Raw SQL source
 * @returns {Object} { tables: Array, relationships: Array }
 */
export function parseSqlText(sqlText) {
  const parser = new Parser();
  const ast = parser.astify(sqlText, { database: "MySQL" });

  // astify returns a single object for one statement, or an array for multiple
  const statements = Array.isArray(ast) ? ast : [ast];

  const tables = [];
  const relationships = [];
  const primaryKeysByTable = {};
  const rawInserts = []; // resolved into `records` once every table's column order is known

  const addPrimaryKeyColumns = (tableName, columnNames) => {
    const existing = primaryKeysByTable[tableName] ?? new Set();
    columnNames.forEach((name) => existing.add(name));
    primaryKeysByTable[tableName] = existing;
  };

  for (const stmt of statements) {
    if (stmt.type === "create") {
      const tableName = stmt.table[0].table;
      const columns = [];

      for (const def of stmt.create_definitions) {
        if (def.resource === "constraint") {
          if (isPrimaryKeyConstraint(def)) {
            addPrimaryKeyColumns(tableName, def.definition.map((d) => d.column));
          } else if (isForeignKeyConstraint(def)) {
            const fk = extractForeignKey(def, tableName);
            if (fk) relationships.push(fk);
          }
          continue;
        }

        const colName = def.column.column;

        // Build a readable type string from the dataType field
        let colType = def.definition.dataType;
        if (def.definition.length) {
          colType += `(${def.definition.length})`;
        }

        columns.push({ name: colName, type: colType });

        if (def.primary_key) {
          addPrimaryKeyColumns(tableName, [colName]);
        }
      }

      tables.push({ table: tableName, columns });
    }

    if (stmt.type === "alter") {
      const tableName = stmt.table[0].table;

      for (const item of stmt.expr) {
        if (item.resource !== "constraint") continue; // skip plain ADD KEY indexes

        const def = item.create_definitions;
        if (isPrimaryKeyConstraint(def)) {
          addPrimaryKeyColumns(tableName, def.definition.map((d) => d.column));
        } else if (isForeignKeyConstraint(def)) {
          const fk = extractForeignKey(def, tableName);
          if (fk) relationships.push(fk);
        }
      }
    }

    if (stmt.type === "insert") {
      const tableName = stmt.table[0].table;
      const rows = stmt.values.values.map((exprList) => exprList.value.map((v) => v.value));
      rawInserts.push({ tableName, columns: stmt.columns, rows });
    }
  }

  for (const table of tables) {
    const pkCols = primaryKeysByTable[table.table] ?? new Set();
    for (const col of table.columns) {
      col.isPrimaryKey = pkCols.has(col.name);
    }
  }

  // INSERT statements without an explicit column list (`INSERT INTO t VALUES (...)`)
  // rely on the table's declared column order, so this can only resolve after the
  // CREATE TABLE pass above has run.
  const columnsByTable = {};
  for (const table of tables) {
    columnsByTable[table.table] = table.columns.map((c) => c.name);
  }

  const records = [];
  for (const insert of rawInserts) {
    const columns = insert.columns ?? columnsByTable[insert.tableName] ?? [];
    for (const row of insert.rows) {
      const values = {};
      columns.forEach((colName, i) => {
        values[colName] = row[i];
      });
      records.push({ table: insert.tableName, values });
    }
  }

  return { tables, relationships, records };
}

/**
 * Converts parseSqlText's output into Team B's dataset shape.
 * @param {Object} parseResult - { tables: [...], relationships: [...], records: [...] }
 * @returns {Object} - { entities: [...], fields: [...], relationships: [...], records: [...] }
 */
export function convertToTeamBModel(parseResult) {
  const { tables, relationships, records = [] } = parseResult;

  const entities = tables.map((table) => ({
    id: table.table,
    name: table.table,
    type: "table",
  }));

  const fields = [];
  for (const table of tables) {
    for (const column of table.columns) {
      fields.push({
        id: `${table.table}.${column.name}`,
        entity_id: table.table,
        name: column.name,
        type: column.type,
        isPrimaryKey: column.isPrimaryKey,
      });
    }
  }

  const mappedRelationships = relationships.map((rel) => ({
    id: `${rel.from_table}.${rel.from_column}->${rel.to_table}.${rel.to_column}`,
    from_entity: rel.from_table,
    from_field: rel.from_column,
    to_entity: rel.to_table,
    to_field: rel.to_column,
    type: "foreign_key",
  }));

  const mappedRecords = records.map((record, i) => ({
    id: `${record.table}#${i}`,
    entity_id: record.table,
    values: record.values,
  }));

  return { entities, fields, relationships: mappedRelationships, records: mappedRecords };
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
