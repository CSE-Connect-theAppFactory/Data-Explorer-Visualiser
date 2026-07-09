import { parseSampleFile, parseSample2File, parseSample3File } from "./parseSql.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts parsed SQL data into the Team B JSON model.
 * @param {Object} parseResult - { tables: [...], relationships: [...] }
 * @returns {Object} - { entities: [...], fields: [...], relationships: [...] }
 */
function convertToTeamBModel(parseResult) {
  const { tables, relationships } = parseResult;

  // Create entities from tables
  const entities = tables.map((table) => ({
    id: table.table,
    name: table.table,
    type: "table",
  }));

  // Create fields from columns
  const fields = [];
  for (const table of tables) {
    for (const column of table.columns) {
      fields.push({
        id: `${table.table}.${column.name}`,
        entity_id: table.table,
        name: column.name,
        type: column.type,
      });
    }
  }

  // Map relationships to match Team B schema
  const mappedRelationships = relationships.map((rel) => ({
    id: `${rel.from_table}.${rel.from_column}->${rel.to_table}.${rel.to_column}`,
    from_entity: rel.from_table,
    from_field: rel.from_column,
    to_entity: rel.to_table,
    to_field: rel.to_column,
    type: "foreign_key",
  }));

  return {
    entities,
    fields,
    relationships: mappedRelationships,
  };
}

/**
 * Parse a file and save its JSON model output
 */
function parseAndExport(parserFn, outputFileName) {
  const result = parserFn();
  const teamBModel = convertToTeamBModel(result);

  console.log(`\n=== Parsed SQL Schema (${outputFileName}) ===\n`);

  for (const table of result.tables) {
    console.log(`Table: ${table.table}`);
    console.table(
      table.columns.map((col) => ({ Column: col.name, Type: col.type })),
    );
    console.log("");
  }

  if (result.relationships.length > 0) {
    console.log("=== Foreign Key Relationships ===");
    console.table(result.relationships);
    console.log("");
  }

  // Export to JSON file
  const outputPath = path.join(__dirname, outputFileName);
  fs.writeFileSync(outputPath, JSON.stringify(teamBModel, null, 2));
  console.log(`✅ JSON model exported to: ${outputFileName}`);
  console.log("--- Team B Model ---");
  console.log(JSON.stringify(teamBModel, null, 2));

  return teamBModel;
}

// Parse all three sample files
console.log("\n====== SAMPLE 1 ======");
const model1 = parseAndExport(parseSampleFile, "output.json");

console.log("\n====== SAMPLE 2 ======");
try {
  const model2 = parseAndExport(parseSample2File, "output2.json");
} catch (err) {
  console.log(
    "⚠️  sample2.sql not found yet. Run this again after creating it.",
  );
}

console.log("\n====== SAMPLE 3 (Week 3 stress test) ======");
try {
  const model3 = parseAndExport(parseSample3File, "output3.json");
} catch (err) {
  console.error("❌ sample3.sql parse failed:", err.message);
}
