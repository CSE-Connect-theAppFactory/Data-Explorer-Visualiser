import "@xyflow/react/dist/style.css";
import "./App.css";
import TableNode from "./TableNode";
import GraphBuilder from "./utilities/GraphBuilder.jsx";
import Visualiser from "./page/Visualiser.jsx";

// Dummy data shaped exactly like the output of parseSqlFile()/parseSampleFile()
// in parser/parseSql.js: an array of { table, columns: [{ name, type }] }.
const parsedTables = [
  {
    table: "customers",
    columns: [
      { name: "id", type: "INT" },
      { name: "first_name", type: "VARCHAR(50)" },
      { name: "last_name", type: "VARCHAR(50)" },
      { name: "email", type: "VARCHAR(100)" },
      { name: "signup_date", type: "DATE" },
    ],
  },
  {
    table: "products",
    columns: [
      { name: "id", type: "INT" },
      { name: "name", type: "VARCHAR(100)" },
      { name: "sku", type: "VARCHAR(20)" },
      { name: "price", type: "INT" },
    ],
  },
  {
    table: "orders",
    columns: [
      { name: "id", type: "INT" },
      { name: "customer_id", type: "INT" },
      { name: "product_id", type: "INT" },
      { name: "quantity", type: "INT" },
      { name: "order_date", type: "DATE" },
    ],
  },
];

// The parser only reports column names/types, so primary/foreign keys are
// inferred by naming convention ('id' / '*_id') and nodes are laid out on a
// grid, until the parser itself surfaces real key constraints and positions.
const nodeTypes = {
  tableNode: TableNode,
};
const { nodes: initialNodes, edges: initialEdges } = GraphBuilder(parsedTables);
const rootNodeId = parsedTables[0].table;

function App() {
  return (
    <div className="app-container">
      <div className="header">
        <h1>Data Explorer Visualiser</h1>
        <p>Proof of Concept: Drill Down ERD</p>
      </div>
      <Visualiser
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        rootNodeId={rootNodeId}
        nodeTypes={nodeTypes}
      />
    </div>
  );
}

export default App;
