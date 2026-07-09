# SQL Parser — Implementation Plan

## Week 1

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

## Week 2

### Task 1: Add foreign key detection

- Extended the parser to recognize `FOREIGN KEY ... REFERENCES ...` constraints within a CREATE TABLE statement
- Records which table/column points to which other table/column
- Updated `src/parser/parseSql.js` to extract foreign key relationships
- Output format: includes `relationships: [{ from_table, from_column, to_table, to_column }]`

### Task 2: Shape the output as the agreed JSON model

- Converted extracted tables, columns, and foreign keys into the Team B JSON structure
- Target JSON structure: `{ entities: [...], fields: [...], relationships: [...] }`
- This is the handoff artifact - Team B reads this file directly
- Updated `src/parser/runParser.js` to export JSON files (`output.json`, `output2.json`)

### Task 3: Test against a second sample file

- Created `src/parser/sample2.sql` with different table/relationship arrangement (4 tables, 5 relationships)
- Parsed successfully - includes self-referential relationships (employees → employees)
- Confirmed correct JSON output for complex schema

### Task 4: Hand off the JSON file to Team B

- Exported actual output files ready for Team B integration
- Created `HANDOFF.md` with full schema documentation and integration guide
- Output JSON is valid and matches agreed schema
- Files ready in `src/parser/output.json` and `src/parser/output2.json`

---

## Week 3 (Current)

### Task 1: Stress-test parser against a messier sample file

- Created `src/parser/sample3.sql` — 6-table e-commerce CMS schema
- **Edge cases covered:**
  - SQL comments (`-- ...`)
  - `DECIMAL(10,2)`, `TEXT`, `BOOLEAN`, `TIMESTAMP` column types
  - `NOT NULL`, `DEFAULT`, `UNIQUE`, `AUTO_INCREMENT` column modifiers
  - Named FK constraints: `CONSTRAINT fk_name FOREIGN KEY (...) REFERENCES ...`
  - Self-referential FK: `categories.parent_id → categories.id`
  - Junction table: `order_items` (two FKs to `orders` + `products`)
  - Multiple FKs from one table to different targets
- Parser handled all of the above without errors
- Fixed a bug: `DECIMAL(10,2)` was previously output as `DECIMAL(10)` — added `def.definition.scale` to the type-string builder in `parseSql.js`
- Exported `src/parser/output3.json` — 6 entities, 34 fields, 8 relationships

### Task 2: Support Team B — JSON shape integration

- Added `buildGraph()` utility in `App.jsx` that converts `{ entities, fields, relationships }` JSON → ReactFlow nodes + edges
  - Auto-lays out nodes in a 3-column grid
  - Infers `isPrimaryKey` (columns named `id`) and `isForeignKey` (cross-referenced against `relationships` array)
  - Attaches outgoing relationships to each node's data for the Detail Panel
- `App.jsx` now imports `output3.json` directly (Vite JSON import) — no hardcoded schema
- Header now shows live table/relationship count badge from the loaded JSON

### Task 3: Detail Panel component

- Created `src/DetailPanel.jsx` — slide-in side panel rendered on node click
  - Displays table name, column count, and full column list with PK/FK badges
  - Shows outgoing FK relationships for the selected table
  - Smooth `translateX` CSS transition (opens from right)
  - Closes via ✕ button or clicking the canvas background
- Created `src/DetailPanel.css` — glassmorphism styling matching existing design system
