import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import TableNode from './TableNode';
import DetailPanel from './DetailPanel';

// ── Import parser output JSON directly (Vite handles JSON imports) ──────────
// Switch this import to use a different schema (output.json, output2.json, output3.json)
import schemaData from './parser/output3.json';

const nodeTypes = { tableNode: TableNode };

// ── JSON → ReactFlow conversion ──────────────────────────────────────────────

/**
 * Determine which column names in a given table are primary keys.
 * Heuristic: a field named "id" with no FK pointing to it is treated as PK.
 * node-sql-parser doesn't emit PK info into the JSON shape, so we infer:
 *   – A column called "id" in any table is a PK.
 */
function inferPrimaryKey(columnName) {
  return columnName === 'id';
}

/**
 * Build ReactFlow nodes + edges from the { entities, fields, relationships } JSON model.
 */
function buildGraph(schema) {
  const { entities, fields, relationships } = schema;

  // Index fields by entity_id for quick lookup
  const fieldsByEntity = {};
  for (const field of fields) {
    if (!fieldsByEntity[field.entity_id]) fieldsByEntity[field.entity_id] = [];
    fieldsByEntity[field.entity_id].push(field);
  }

  // Index relationships by from_entity for Detail Panel usage
  const relsByEntity = {};
  for (const rel of relationships) {
    if (!relsByEntity[rel.from_entity]) relsByEntity[rel.from_entity] = [];
    relsByEntity[rel.from_entity].push(rel);
  }

  // Build a set of FK column ids: "<entity>.<field>"
  const fkSet = new Set(
    relationships.map((r) => `${r.from_entity}.${r.from_field}`)
  );

  // ── Nodes ──────────────────────────────────────────────────────────────────
  // Auto-layout: arrange in a grid (4 columns)
  const COLS = 3;
  const H_GAP = 310;
  const V_GAP = 340;

  const nodes = entities.map((entity, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);

    const columns = (fieldsByEntity[entity.id] ?? []).map((f) => ({
      name: f.name,
      type: f.type,
      isPrimaryKey: inferPrimaryKey(f.name),
      isForeignKey: fkSet.has(`${entity.id}.${f.name}`),
    }));

    return {
      id: entity.id,
      type: 'tableNode',
      position: { x: col * H_GAP + 60, y: row * V_GAP + 60 },
      data: {
        label: entity.name,
        columns,
        // Attach outgoing relationships so the Detail Panel can render them
        relationships: relsByEntity[entity.id] ?? [],
        // Visibility: first entity is always revealed, rest start concealed
        isRevealed: idx === 0,
      },
    };
  });

  // ── Edges ──────────────────────────────────────────────────────────────────
  const edges = relationships.map((rel) => ({
    id: rel.id,
    source: rel.from_entity,
    target: rel.to_entity,
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true, // Start hidden; revealed by the drill-down interaction
  }));

  return { nodes, edges };
}

// Pre-compute graph from imported JSON
const { nodes: initialNodes, edges: initialEdges } = buildGraph(schemaData);

// ── App Component ────────────────────────────────────────────────────────────

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Track which nodes the user has expanded
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Detail panel state
  const [selectedNode, setSelectedNode] = useState(null);

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (expandedNodeIds.has(currentId)) {
        const neighbors = initialEdges
          .filter((e) => e.source === currentId || e.target === currentId)
          .map((e) => (e.source === currentId ? e.target : e.source));

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            visibleNodes.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    // Update node visibility
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        hidden: false,
        data: {
          ...n.data,
          isRevealed: visibleNodes.has(n.id),
        },
      }))
    );

    // Update edge visibility
    setEdges((eds) =>
      eds.map((edge) => {
        const isVisible =
          visibleNodes.has(edge.source) &&
          visibleNodes.has(edge.target) &&
          (expandedNodeIds.has(edge.source) || expandedNodeIds.has(edge.target));
        return { ...edge, hidden: !isVisible };
      })
    );
  }, [expandedNodeIds, baseGraph, rootId, setNodes, setEdges]);

  // The edge backing the current relationship selection, used to highlight
  // both it and the two tables it connects.
  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedRelationshipId) ?? null,
    [edges, selectedRelationshipId]
  );

  // Column rows call onColumnClick to open the records view for their table,
  // independent of the node-level click (expand/collapse + schema selection).
  const nodesWithHandlers = useMemo(
    () => nodes.map((n) => {
      const isHighlighted = !!selectedEdge && (n.id === selectedEdge.source || n.id === selectedEdge.target);
      return { ...n, data: { ...n.data, onColumnClick: () => setRecordsEntityId(n.id), isHighlighted } };
    }),
    [nodes, selectedEdge]
  );

  const edgesWithSelection = useMemo(
    () => edges.map((edge) => {
      const isSelected = edge.id === selectedRelationshipId;
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isSelected ? '#facc15' : edge.style?.stroke,
          strokeWidth: isSelected ? 4 : edge.style?.strokeWidth,
        },
        markerEnd: {
          ...edge.markerEnd,
          color: isSelected ? '#facc15' : edge.markerEnd?.color,
        },
        zIndex: isSelected ? 1000 : 0,
      };
    }),
    [edges, selectedRelationshipId]
  );

  const onNodeClick = useCallback(
    (event, clickedNode) => {
      if (!clickedNode.data.isRevealed) return;

      // Open detail panel for this node
      setSelectedNode(clickedNode);

      // Toggle expand/collapse for drill-down
      setExpandedNodeIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(clickedNode.id)) {
          newSet.delete(clickedNode.id);
        } else {
          newSet.add(clickedNode.id);
        }
        return newSet;
      });
    },
    []
  );

  // Close the detail panel (and keep expanded state)
  const closePanel = useCallback(() => setSelectedNode(null), []);

  // Close panel when clicking the canvas background
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onEdgeClick = useCallback((event, clickedEdge) => {
    setSelectedRelationshipId((prev) => (prev === clickedEdge.id ? null : clickedEdge.id));
    setSelectedEntityId(null);
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-left">
          <h1>Data Explorer Visualiser</h1>
          <p>Click a node to expand its relationships and view field details</p>
        </div>
        <div className="header-right">
          <span className="schema-badge">
            {schemaData.entities.length} tables · {schemaData.relationships.length} relationships
          </span>
        </div>
      </div>

      <div className="flow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#4c1d95" />
          <Controls />
        </ReactFlow>

        {/* Detail Panel slides in from the right */}
        <DetailPanel node={selectedNode} onClose={closePanel} />
      </div>
    </div>
  );
}

export default App;
