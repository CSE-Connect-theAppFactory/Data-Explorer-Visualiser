# sqltojson

**sqltojson** is a Node.js utility designed to export data from a MySQL database into a single JSON file and generate TypeScript type definitions for the database schema. This tool is particularly useful for projects transitioning from traditional SQL-based architectures to serverless, object-oriented, or JSON-based systems. It can also be leveraged for data visualization, schema documentation, or ensuring type safety in TypeScript-based applications.

## Features

- **Convert SQL to JSON**: Exports all tables from a MySQL database into a structured JSON object.
- **TypeScript Type Generation**: Automatically generates TypeScript interfaces based on the database schema.
- **Serverless Transition**: Facilitates the migration of SQL-based projects to serverless environments by providing an easy-to-consume JSON format.
- **Data Visualization**: Outputs data in a format that can be used directly in visualization tools or front-end applications.
- **Dynamic and Reusable**: Automatically adapts to any database schema, requiring no hardcoding of table names.

## Ideal Use Cases

- **Serverless Applications**: Replace traditional database dependencies with a lightweight JSON file for serverless platforms like Vercel or AWS Lambda.
- **Object-Oriented Development**: Convert relational data into object-oriented structures for easier integration into modern programming paradigms.
- **Data Visualization**: Use the JSON output with visualization libraries or tools like D3.js, Tableau, or Power BI.
- **Type Generation**: Generate TypeScript interfaces to ensure consistent schema definitions across your project, enhancing type safety.

## Requirements

- **Node.js** (version 14.16.1 or later)
- **A MySQL database**
- **Access to MySQL database credentials**

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/tannerpace/sqltojson.git
   cd sqltojson
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your database credentials:

   ```bash
   echo -e "DB_HOST=localhost\nDB_USER=username\nDB_PASSWORD=password\nDB_DATABASE=database_name" > .env
   ```

## Usage

Run the script:

```bash
node sqlToJson.js
```

The script will:

1. Connect to the specified database.
2. Dynamically fetch all table names.
3. Export all table data into a single JSON file named `database_export.json`.
4. Generate TypeScript type definitions for all database tables in a file named `database_types.d.ts`.

### Output Files

- **`database_export.json`**: Contains the exported data as a structured JSON object.
- **`database_types.d.ts`**: Contains TypeScript interfaces for all database tables based on their schema.

### JSON Output Format

The output file, `database_export.json`, contains a JSON object where each key is a table name and its value is an array of rows from that table:

```json
{
  "users": [
    { "id": 1, "username": "user1" },
    { "id": 2, "username": "user2" }
  ],
  "locations": [
    { "id": 1, "name": "Location A" },
    { "id": 2, "name": "Location B" }
  ]
}
```

### TypeScript Type Definitions

The `database_types.d.ts` file includes TypeScript interfaces for each table. Example for a `users` table:

```typescript
export interface Users {
  id: number
  username: string
}
```

## Advanced Features

### Generating Type Definitions

The generated TypeScript type definitions provide a type-safe way to use the exported data in TypeScript-based projects.

### Serverless Transition

Replace database queries with the JSON file in serverless environments like Vercel, AWS Lambda, or Netlify Functions.

Example:

```javascript
const data = require("./database_export.json")

const getUsers = () => {
  return data.users
}
```

### Data Visualization

Integrate the JSON file with tools or libraries like D3.js or Plotly to create visual representations of your data.

#### Example Workflow

1. **Extract Data**: Run the script to generate `database_export.json`.
2. **Visualize Data**: Use the JSON file with your visualization library or tools.
3. **Generate Types**: Use the `database_types.d.ts` file to ensure schema consistency in your TypeScript project.
4. **Deploy Serverless**: Serve the JSON file in a serverless architecture by importing it directly in API routes or static files.

## Troubleshooting

- **`ER_NO_SUCH_TABLE`**: Ensure the database contains data and the `.env` file points to the correct database.
- **Empty Output**: Confirm the tables in your database contain rows.
- **Node.js Version**: Use Node.js version 14.16.1 or later for compatibility.

## License

This project is open-source and available under the MIT License.
