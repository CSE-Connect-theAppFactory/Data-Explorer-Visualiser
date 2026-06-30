import  { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import TableNode from './TableNode';

const nodeTypes = {
  tableNode: TableNode,
};

const initialNodes = [
  {
    id: 'users',
    type: 'tableNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'Users',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'username', type: 'VARCHAR(50)' },
        { name: 'email', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    },
  },
  {
    id: 'orders',
    type: 'tableNode',
    position: { x: 450, y: 100 },
    data: {
      label: 'Orders',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'user_id', type: 'UUID', isForeignKey: true },
        { name: 'total_amount', type: 'DECIMAL(10,2)' },
        { name: 'status', type: 'VARCHAR(20)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    },
  },
  {
    id: 'products',
    type: 'tableNode',
    position: { x: 100, y: 400 },
    data: {
      label: 'Products',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'description', type: 'TEXT' },
        { name: 'price', type: 'DECIMAL(10,2)' },
        { name: 'stock', type: 'INTEGER' },
      ]
    },
  },
  {
    id: 'order_items',
    type: 'tableNode',
    position: { x: 450, y: 400 },
    data: {
      label: 'Order_Items',
      columns: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'order_id', type: 'UUID', isForeignKey: true },
        { name: 'product_id', type: 'UUID', isForeignKey: true },
        { name: 'quantity', type: 'INTEGER' },
        { name: 'unit_price', type: 'DECIMAL(10,2)' },
      ]
    },
  },
];

// sourceColumn / targetColumn link each edge to the specific key columns it represents.
// Clicking either end of an edge activates it.
const initialEdges = [
  {
    id: 'e-users-orders',
    source: 'users',
    sourceColumn: 'id',
    target: 'orders',
    targetColumn: 'user_id',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true
  },
  {
    id: 'e-orders-order_items',
    source: 'orders',
    sourceColumn: 'id',
    target: 'order_items',
    targetColumn: 'order_id',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true
  },
  {
    id: 'e-products-order_items',
    source: 'products',
    sourceColumn: 'id',
    target: 'order_items',
    targetColumn: 'product_id',
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true
  },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Each entry is "nodeId:columnName" — toggled by clicking a PK or FK row
  const [activeKeys, setActiveKeys] = useState(new Set());

  const handleColumnClick = useCallback((nodeId, colName) => {
    setActiveKeys(prev => {
      const key = `${nodeId}:${colName}`;
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // An edge is visible if either its source column or target column key is active
    const visibleEdgeIds = new Set();
    for (const edge of initialEdges) {
      const sourceKey = `${edge.source}:${edge.sourceColumn}`;
      const targetKey = `${edge.target}:${edge.targetColumn}`;
      if (activeKeys.has(sourceKey) || activeKeys.has(targetKey)) {
        visibleEdgeIds.add(edge.id);
      }
    }

    // A node is visible if it is the root or connected to at least one visible edge
    const visibleNodes = new Set(['users']);
    for (const edge of initialEdges) {
      if (visibleEdgeIds.has(edge.id)) {
        visibleNodes.add(edge.source);
        visibleNodes.add(edge.target);
      }
    }

    // Build per-node sets of active column names for highlighting
    const activeColumnsByNode = {};
    for (const key of activeKeys) {
      const colonIdx = key.indexOf(':');
      const nodeId = key.slice(0, colonIdx);
      const colName = key.slice(colonIdx + 1);
      if (!activeColumnsByNode[nodeId]) activeColumnsByNode[nodeId] = new Set();
      activeColumnsByNode[nodeId].add(colName);
    }

    setNodes(nds => nds.map(n => ({
      ...n,
      hidden: false,
      data: {
        ...n.data,
        isRevealed: visibleNodes.has(n.id),
        activeColumnNames: activeColumnsByNode[n.id] || new Set(),
        onColumnClick: (colName) => handleColumnClick(n.id, colName),
      }
    })));

    setEdges(eds => eds.map(edge => ({
      ...edge,
      hidden: !visibleEdgeIds.has(edge.id)
    })));
  }, [activeKeys, handleColumnClick, setNodes, setEdges]);

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
