# SQL Parser — Implementation Plan

## Week 1 (Current) ✅

### Task 1: Sample `.sql` file
- **File**: `src/parser/sample.sql`
- 3 tables: `customers`, `products`, `orders`
- Basic types only: `INT`, `VARCHAR`, `DATE`
- Simple `FOREIGN KEY ... REFERENCES ...` constraints
- No comments, no vendor-specific syntax

### Task 2: Extract table + column names
- **File**: `src/parser/parseSql.js`
- Read `.sql` file as text
- Parse via `node-sql-parser` (`Parser.astify()`)
- For each `CREATE TABLE` statement, extract: table name, column names + types
- Skip constraint definitions (FOREIGN KEY, etc.)
- Output: plain array of `{ table, columns: [{ name, type }] }`

### Task 3: Console output
- **File**: `src/parser/runParser.js`
- Run with: `node src/parser/runParser.js`
- Logs table/column data via `console.table` + raw JSON

### Success Criteria
- Running the script against `sample.sql` prints correct table and column names
- FK constraint lines are NOT included as columns

---

## Week 2+ (NOT in scope for Week 1)

- [ ] Foreign key detection and relationship logic
- [ ] Final JSON schema shape
- [ ] Error handling for malformed SQL
- [ ] Integration with React UI / ReactFlow nodes
- [ ] File upload / drag-and-drop in browser
