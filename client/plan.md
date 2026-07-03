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

## Week 2 ✅

### Task 1: Add foreign key detection

- ✅ Extended the parser to recognize `FOREIGN KEY ... REFERENCES ...` constraints within a CREATE TABLE statement
- ✅ Records which table/column points to which other table/column
- ✅ Updated `src/parser/parseSql.js` to extract foreign key relationships
- ✅ Output format: includes `relationships: [{ from_table, from_column, to_table, to_column }]`

### Task 2: Shape the output as the agreed JSON model

- ✅ Converted extracted tables, columns, and foreign keys into the Team B JSON structure
- ✅ Target JSON structure: `{ entities: [...], fields: [...], relationships: [...] }`
- ✅ This is the handoff artifact - Team B reads this file directly
- ✅ Updated `src/parser/runParser.js` to export JSON files (`output.json`, `output2.json`)

### Task 3: Test against a second sample file

- ✅ Created `src/parser/sample2.sql` with different table/relationship arrangement (4 tables, 5 relationships)
- ✅ Parsed successfully - includes self-referential relationships (employees → employees)
- ✅ Confirmed correct JSON output for complex schema

### Task 4: Hand off the JSON file to Team B

- ✅ Exported actual output files ready for Team B integration
- ✅ Created `HANDOFF.md` with full schema documentation and integration guide
- ✅ Output JSON is valid and matches agreed schema
- ✅ Files ready in `src/parser/output.json` and `src/parser/output2.json`

---

## Week 3+ (Future)

- [ ] Error handling for malformed SQL
- [ ] Integration with React UI / ReactFlow nodes
- [ ] File upload / drag-and-drop in browser
