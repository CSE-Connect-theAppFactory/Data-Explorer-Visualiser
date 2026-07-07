#!/usr/bin/env node
const path = require('path');
const mysql = require('promise-mysql');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];

/**
 * Validates the required environment variables and logs missing ones.
 * @returns {boolean} - Returns true if all variables are present; false otherwise.
 */
const validateEnvVars = () => {
  const missingVars = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('The following environment variables are missing in the .env file:');
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    console.error('Please ensure your .env file includes all required variables.');
    return false;
  }
  return true;
};

/**
 * Exports all tables from the connected MySQL database to a JSON file and generates TypeScript types.
 * 
 * This function connects to the MySQL database using the credentials provided 
 * in the `.env` file, retrieves all table names, fetches their data, and writes 
 * the data to a JSON file named `database_export.json` in the current directory.
 * It also generates TypeScript type definitions for the tables based on their structure 
 * and saves them to a `database_types.d.ts` file.
 * 
 * @async
 * @function exportAllTablesWithTypes
 * @returns {Promise<void>} Resolves when the data export and type generation are complete.
 */

const exportAllTablesWithTypes = async () => {
  if (!validateEnvVars()) {
    console.log('Expected .env file in:', process.cwd());
    return process.exit(1);
  }

  try {

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
      console.error('Database configuration is missing in .env file.');
      return process.exit(1);
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    // Fetch the list of tables in the database
    const tables = await connection.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];

    const databaseContent = {};
    const typeDefinitions = [];

    // Loop through each table and fetch its data and metadata
    for (const table of tables) {
      const tableName = table[tableKey];
      console.log(`Exporting table: ${tableName}`);

      // Fetch all rows of the table
      const rows = await connection.query(`SELECT * FROM ${tableName}`);
      databaseContent[tableName] = rows;

      // Fetch the table column information for type generation
      const columns = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
      const fields = columns.map(column => {
        const tsType = mapMysqlTypeToTypeScript(column.Type);
        const optional = column.Null === 'YES' ? '?' : '';
        return `  ${column.Field}${optional}: ${tsType};`;
      });
      const typeDef = `export interface ${capitalize(tableName)} {\n${fields.join('\n')}\n}`;
      typeDefinitions.push(typeDef);
    }

    // Write the collected data to a JSON file
    const jsonFileName = 'database_export.json';
    fs.writeFileSync(jsonFileName, JSON.stringify(databaseContent, null, 2), 'utf8');
    console.log(`All table data has been exported to ${jsonFileName}`);

    // Write the TypeScript type definitions to a .d.ts file
    const typesFileName = 'database_types.d.ts';
    fs.writeFileSync(typesFileName, typeDefinitions.join('\n\n'), 'utf8');
    console.log(`TypeScript types have been exported to ${typesFileName}`);

    // Close the database connection
    await connection.end();
  } catch (error) {
    console.error('Error exporting data:', error);
  }
};

/**
 * Maps MySQL column types to TypeScript types.
 * 
 * @param {string} mysqlType - The MySQL column type.
 * @returns {string} The corresponding TypeScript type.
 */
const mapMysqlTypeToTypeScript = (mysqlType) => {
  if (mysqlType.startsWith('int') || mysqlType.startsWith('decimal') || mysqlType.startsWith('float') || mysqlType.startsWith('double')) {
    return 'number';
  }
  if (mysqlType.startsWith('varchar') || mysqlType.startsWith('text') || mysqlType.startsWith('char')) {
    return 'string';
  }
  if (mysqlType.startsWith('date') || mysqlType.startsWith('timestamp')) {
    return 'Date';
  }
  if (mysqlType.startsWith('tinyint(1)')) {
    return 'boolean';
  }
  return 'any'; // Fallback for unsupported types
};

/**
 * Capitalizes the first letter of a string.
 * 
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

exportAllTablesWithTypes();
