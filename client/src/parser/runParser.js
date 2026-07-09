import { parseSampleFile, parseSample2File, parseSample3File } from "./parseSql.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
