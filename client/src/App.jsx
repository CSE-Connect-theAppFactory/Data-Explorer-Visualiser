import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import TableNode from './TableNode';

const nodeTypes = {
  tableNode: TableNode,
};

// Dummy data shaped exactly like the output of parseSqlFile()/parseSampleFile()
// in parser/parseSql.js: an array of { table, columns: [{ name, type }] }.
const parsedTables = [
  {
    table: 'customers',
    columns: [
      { name: 'id', type: 'INT' },
      { name: 'first_name', type: 'VARCHAR(50)' },
      { name: 'last_name', type: 'VARCHAR(50)' },
      { name: 'email', type: 'VARCHAR(100)' },
      { name: 'signup_date', type: 'DATE' },
    ],
  },
  {
    table: 'products',
    columns: [
      { name: 'id', type: 'INT' },
      { name: 'name', type: 'VARCHAR(100)' },
      { name: 'sku', type: 'VARCHAR(20)' },
      { name: 'price', type: 'INT' },
    ],
  },
  {
    table: 'orders',
    columns: [
      { name: 'id', type: 'INT' },
      { name: 'customer_id', type: 'INT' },
      { name: 'product_id', type: 'INT' },
      { name: 'quantity', type: 'INT' },
      { name: 'order_date', type: 'DATE' },
    ],
  },
];

const GRID_COLUMNS = 2;
const NODE_SPACING_X = 400;
const NODE_SPACING_Y = 350;

// The parser only reports column names/types, so primary/foreign keys are
// inferred by naming convention ('id' / '*_id') and nodes are laid out on a
// grid, until the parser itself surfaces real key constraints and positions.
function buildGraphFromTables(tables) {
  const tableNames = new Set(tables.map((t) => t.table));

  const nodes = tables.map((t, idx) => ({
    id: t.table,
    type: 'tableNode',
    position: {
      x: (idx % GRID_COLUMNS) * NODE_SPACING_X + 100,
      y: Math.floor(idx / GRID_COLUMNS) * NODE_SPACING_Y + 100,
    },
    data: {
      label: t.table.charAt(0).toUpperCase() + t.table.slice(1),
      columns: t.columns.map((col) => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: col.name === 'id',
        isForeignKey: col.name !== 'id' && col.name.endsWith('_id'),
      })),
    },
  }));

  const edges = [];
  for (const t of tables) {
    for (const col of t.columns) {
      if (col.name === 'id' || !col.name.endsWith('_id')) continue;
      const referenced = `${col.name.slice(0, -3)}s`; // e.g. customer_id -> customers
      if (!tableNames.has(referenced) || referenced === t.table) continue;
      edges.push({
        id: `e-${referenced}-${t.table}`,
        source: referenced,
        target: t.table,
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        hidden: true,
      });
    }
  }

  return { nodes, edges };
}

const { nodes: initialNodes, edges: initialEdges } = buildGraphFromTables(parsedTables);
const rootNodeId = parsedTables[0].table;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Track which nodes the user has expanded
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Automatically compute graph visibility based on what's expanded
  useEffect(() => {
    const visibleNodes = new Set([rootNodeId]); // Root is always visible

    // Breadth-first search to find all reachable visible nodes
    let queue = [rootNodeId];
    let visited = new Set([rootNodeId]);

    while (queue.length > 0) {
      const currentId = queue.shift();
      
      // If this visible node is also expanded, its neighbors become visible
      if (expandedNodeIds.has(currentId)) {
        // Find neighbors
        const neighbors = initialEdges
          .filter(e => e.source === currentId || e.target === currentId)
          .map(e => e.source === currentId ? e.target : e.source);
          
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            visibleNodes.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    // Update nodes visibility using our custom isRevealed property for CSS transitions
    setNodes((nds) => 
      nds.map((n) => ({
        ...n,
        hidden: false, // Never unmount them so we can animate out
        data: {
          ...n.data,
          isRevealed: visibleNodes.has(n.id)
        }
      }))
    );

    // Update edges visibility
    setEdges((eds) => 
      eds.map((edge) => {
        // An edge is visible if BOTH its nodes are visible 
        // AND at least one of them was expanded to trigger this connection
        const isVisible = visibleNodes.has(edge.source) && visibleNodes.has(edge.target) &&
                          (expandedNodeIds.has(edge.source) || expandedNodeIds.has(edge.target));
        return {
          ...edge,
          hidden: !isVisible
        };
      })
    );
  }, [expandedNodeIds, setNodes, setEdges]);

  const onNodeClick = useCallback((event, clickedNode) => {
    // Only allow clicking if the node is actually revealed
    if (!clickedNode.data.isRevealed) return;

    setExpandedNodeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clickedNode.id)) {
        // Collapse: clicking an expanded node hides its children
        newSet.delete(clickedNode.id);
      } else {
        // Expand: clicking a collapsed node reveals its children
        newSet.add(clickedNode.id);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <h1>Data Explorer Visualiser</h1>
        <p>Proof of Concept: Drill Down ERD</p>
      </div>
      <div className="flow-wrapper">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView 
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#4c1d95" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
