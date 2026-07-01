import { parseSampleFile } from './parseSql.js';

const result = parseSampleFile();

console.log('\n=== Parsed SQL Schema ===\n');

for (const table of result) {
  console.log(`Table: ${table.table}`);
  console.table(
    table.columns.map((col) => ({ Column: col.name, Type: col.type }))
  );
  console.log('');
}

console.log('--- Raw output ---');
console.log(JSON.stringify(result, null, 2));
