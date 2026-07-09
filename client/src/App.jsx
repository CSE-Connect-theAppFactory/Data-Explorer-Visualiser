import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import TableNode from './TableNode';
import DetailPanel from './DetailPanel';
import RecordsPanel from './RecordsPanel';
import SelfLoopEdge from './SelfLoopEdge';
import { buildGraph } from './graphBuilder';
import sampleDataset1 from './parser/output.json';
import sampleDataset2 from './parser/output2.json';
import sampleDataset3 from './parser/output3.json';

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  selfLoop: SelfLoopEdge,
};

const DATASETS = [
  { key: 'sample1', label: 'Sample: customers/orders/products', data: sampleDataset1 },
  { key: 'sample2', label: 'Sample: departments/employees/projects', data: sampleDataset2 },
  { key: 'sample3', label: 'Sample: e-commerce (users/products/orders/reviews)', data: sampleDataset3 },
];

function App() {
  const [datasetKey, setDatasetKey] = useState(DATASETS[0].key);
  const dataset = DATASETS.find((d) => d.key === datasetKey).data;
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState(null);
  const [recordsEntityId, setRecordsEntityId] = useState(null);

  // Rebuilt whenever the dataset changes (e.g. switching samples)
  const baseGraph = useMemo(() => buildGraph(dataset), [dataset]);
  const rootId = dataset.entities[0]?.id ?? null;

  const [nodes, setNodes, onNodesChange] = useNodesState(baseGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseGraph.edges);
  const reactFlowInstanceRef = useRef(null);

  // Track which nodes the user has expanded
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

  // Reset the graph and any selection whenever a new dataset comes in.
  // Done during render (React's recommended way to reset state on a prop/derived-value
  // change) rather than in an effect, to avoid an extra cascading render.
  const [prevBaseGraph, setPrevBaseGraph] = useState(baseGraph);
  if (baseGraph !== prevBaseGraph) {
    setPrevBaseGraph(baseGraph);
    setNodes(baseGraph.nodes);
    setEdges(baseGraph.edges);
    setExpandedNodeIds(new Set());
    setSelectedEntityId(null);
    setSelectedRelationshipId(null);
  }

  // Automatically compute graph visibility based on what's expanded
  useEffect(() => {
    if (!rootId) return;

    const visibleNodes = new Set([rootId]); // Root is always visible

    // Breadth-first search to find all reachable visible nodes
    let queue = [rootId];
    let visited = new Set([rootId]);

    while (queue.length > 0) {
      const currentId = queue.shift();

      // If this visible node is also expanded, its neighbors become visible
      if (expandedNodeIds.has(currentId)) {
        // Find neighbors
        const neighbors = baseGraph.edges
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
  }, [expandedNodeIds, baseGraph, rootId, setNodes, setEdges]);

  // Dagre computes different node coordinates per dataset, so the camera
  // must re-fit on every dataset switch instead of relying on ReactFlow's
  // fitView prop, which only runs once on mount.
  useEffect(() => {
    reactFlowInstanceRef.current?.fitView({ duration: 300 });
  }, [baseGraph]);

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

  const onNodeClick = useCallback((event, clickedNode) => {
    // Only allow clicking if the node is actually revealed
    if (!clickedNode.data.isRevealed) return;

    setSelectedEntityId(clickedNode.id);
    setSelectedRelationshipId(null);

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

  const onEdgeClick = useCallback((event, clickedEdge) => {
    setSelectedRelationshipId((prev) => {
      const next = prev === clickedEdge.id ? null : clickedEdge.id;
      // Open the source table's panel with this relationship highlighted,
      // instead of just spotlighting the edge with no panel content.
      setSelectedEntityId(next ? clickedEdge.source : null);
      return next;
    });
  }, []);

  return (
    <div className="app-container">
      <div className="header">
        <h1>Data Explorer Visualiser</h1>
        <p>Proof of Concept: Drill Down ERD</p>
      </div>
      <div className="flow-wrapper">
        <div className="canvas-area">
          <ReactFlow
            nodes={nodesWithHandlers}
            edges={edgesWithSelection}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#4c1d95" />
            <Controls />
          </ReactFlow>
        </div>
        <div className="data-source-controls">
          <select
            value={datasetKey}
            onChange={(e) => setDatasetKey(e.target.value)}
          >
            {DATASETS.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </div>
        <DetailPanel
          dataset={dataset}
          selectedEntityId={selectedEntityId}
          selectedRelationshipId={selectedRelationshipId}
          onClose={() => setSelectedEntityId(null)}
        />
        {recordsEntityId && (
          <RecordsPanel
            dataset={dataset}
            entityId={recordsEntityId}
            onClose={() => setRecordsEntityId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
