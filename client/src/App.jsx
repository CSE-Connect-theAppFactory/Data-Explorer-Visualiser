import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import TableNode from './TableNode';
import GraphBuilder from './utilities/GraphBuilder.jsx';

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


// The parser only reports column names/types, so primary/foreign keys are
// inferred by naming convention ('id' / '*_id') and nodes are laid out on a
// grid, until the parser itself surfaces real key constraints and positions.

const { nodes: initialNodes, edges: initialEdges } = GraphBuilder(parsedTables);
const rootNodeId = parsedTables[0].table;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Track which nodes the user has expanded (whole-table expand, reveals every neighbour)
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  // Track which specific relationships (edges) the user has expanded via a row click
  const [expandedEdgeIds, setExpandedEdgeIds] = useState(new Set());

  // Automatically compute graph visibility based on what's expanded
  useEffect(() => {
    const visibleNodes = new Set([rootNodeId]); // Root is always visible

    // An edge can be walked if its whole table was expanded, or if this
    // specific relationship was expanded via a row click
    const traversableEdgeIds = new Set(
      initialEdges
        .filter(e => expandedNodeIds.has(e.source) || expandedNodeIds.has(e.target) || expandedEdgeIds.has(e.id))
        .map(e => e.id)
    );

    // Breadth-first search to find all reachable visible nodes
    let queue = [rootNodeId];
    let visited = new Set([rootNodeId]);

    while (queue.length > 0) {
      const currentId = queue.shift();

      const neighborEdges = initialEdges.filter(
        e => traversableEdgeIds.has(e.id) && (e.source === currentId || e.target === currentId)
      );

      for (const e of neighborEdges) {
        const neighbor = e.source === currentId ? e.target : e.source;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          visibleNodes.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Columns whose relationship is currently row-expanded, per table, so the
    // matching row can be highlighted alongside its edge
    const activeColumnsByNode = new Map();
    for (const e of initialEdges) {
      if (!expandedEdgeIds.has(e.id)) continue;
      const addColumn = (nodeId, columnName) => {
        if (!activeColumnsByNode.has(nodeId)) activeColumnsByNode.set(nodeId, []);
        activeColumnsByNode.get(nodeId).push(columnName);
      };
      addColumn(e.source, e.data?.sourceColumn);
      addColumn(e.target, e.data?.targetColumn);
    }

    // Update nodes visibility using our custom isRevealed property for CSS transitions
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        hidden: false, // Never unmount them so we can animate out
        data: {
          ...n.data,
          isRevealed: visibleNodes.has(n.id),
          activeColumns: activeColumnsByNode.get(n.id) || [],
        }
      }))
    );

    // Update edges visibility
    setEdges((eds) =>
      eds.map((edge) => {
        // An edge is visible if BOTH its nodes are visible AND it's traversable
        const isVisible = visibleNodes.has(edge.source) && visibleNodes.has(edge.target) &&
                          traversableEdgeIds.has(edge.id);
        const isHighlighted = expandedEdgeIds.has(edge.id);
        return {
          ...edge,
          hidden: !isVisible,
          style: {
            ...edge.style,
            stroke: isHighlighted ? '#fbbf24' : '#38bdf8',
            strokeWidth: isHighlighted ? 3 : 2,
          },
        };
      })
    );
  }, [expandedNodeIds, expandedEdgeIds, setNodes, setEdges]);

  const onNodeClick = useCallback((event, clickedNode) => {
    // Only allow clicking if the node is actually revealed
    if (!clickedNode.data.isRevealed) return;

    // Clicking a specific row expands/collapses just that one relationship
    // and highlights the matching edge, instead of revealing every neighbour
    const rowEl = event.target.closest('[data-row-column]');
    if (rowEl) {
      const columnName = rowEl.dataset.rowColumn;
      const relatedEdges = initialEdges.filter(
        (e) =>
          (e.source === clickedNode.id && e.data?.sourceColumn === columnName) ||
          (e.target === clickedNode.id && e.data?.targetColumn === columnName)
      );
      if (relatedEdges.length === 0) return;

      setExpandedEdgeIds((prev) => {
        const newSet = new Set(prev);
        const allActive = relatedEdges.every((e) => newSet.has(e.id));
        for (const e of relatedEdges) {
          if (allActive) newSet.delete(e.id);
          else newSet.add(e.id);
        }
        return newSet;
      });
      return;
    }

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
