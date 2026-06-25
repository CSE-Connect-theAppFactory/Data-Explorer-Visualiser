import React, { useState, useCallback, useEffect } from 'react';
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

const initialEdges = [
  { 
    id: 'e-users-orders', 
    source: 'users', 
    target: 'orders', 
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true
  },
  { 
    id: 'e-orders-order_items', 
    source: 'orders', 
    target: 'order_items', 
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true
  },
  { 
    id: 'e-products-order_items', 
    source: 'products', 
    target: 'order_items', 
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true
  },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Track which nodes the user has expanded
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Automatically compute graph visibility based on what's expanded
  useEffect(() => {
    const visibleNodes = new Set(['users']); // Root is always visible
    
    // Breadth-first search to find all reachable visible nodes
    let queue = ['users'];
    let visited = new Set(['users']);

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
