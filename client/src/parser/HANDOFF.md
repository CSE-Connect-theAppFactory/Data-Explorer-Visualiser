# Week 2 Handoff - SQL Parser Output

## Overview

The SQL parser has been successfully extended to detect and map foreign key relationships. The output is now in the agreed JSON format ready for Team B integration.

## Deliverables

### 1. Output Files

- **[output.json](output.json)** - Sample 1 schema (customers, products, orders)
- **[output2.json](output2.json)** - Sample 2 schema (departments, employees, projects, assignments)

### 2. JSON Schema Structure

Each output file contains:

```json
{
  "entities": [{ "id": "table_name", "name": "table_name", "type": "table" }],
  "fields": [
    {
      "id": "table.column",
      "entity_id": "table_name",
      "name": "column_name",
      "type": "VARCHAR(100)"
    }
  ],
  "relationships": [
    {
      "id": "from_table.from_column->to_table.to_column",
      "from_entity": "from_table",
      "from_field": "from_column",
      "to_entity": "to_table",
      "to_field": "to_column",
      "type": "foreign_key"
    }
  ]
}
```

### 3. Features Implemented

✅ Foreign key detection from CREATE TABLE statements
✅ Self-referential relationships (e.g., employees.manager_id → employees.id)
✅ Multi-table relationships mapped correctly
✅ Column type preservation (VARCHAR(50), INT, DATE, etc.)
✅ Consistent unique IDs for all entities, fields, and relationships

### 4. Parser API

#### Modified Functions

- **parseSqlFile(sqlFilePath)** - Now returns `{ tables: [...], relationships: [...] }`
- **convertToTeamBModel(parseResult)** - Converts parser output to Team B schema

#### Usage

```javascript
import { parseSampleFile } from "./parseSql.js";
const result = parseSampleFile(); // Returns { tables, relationships }
```

### 5. Test Results

Both sample files parsed successfully:

- **Sample 1**: 3 tables, 2 relationships ✅
- **Sample 2**: 4 tables, 5 relationships (including self-referential) ✅

## Integration Steps for Team B

1. Import JSON files from `src/parser/output.json` or `output2.json`
2. Use the `entities` array for creating ReactFlow nodes
3. Use the `relationships` array for creating ReactFlow edges
4. Field information can be displayed in node tooltips or sidebars

## Next Steps

- Ready for React UI integration with ReactFlow
- File upload functionality can be added to run parser on user-provided SQL files
- Error handling for malformed SQL to be added in Week 3
