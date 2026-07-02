import "./Visualiser.css";
import { ReactFlow, Controls, Background, BackgroundVariant, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode from ./../TableNode.jsx';

function Visualiser(initialNodes, initialEdges, rootNodeId, nodeTypes) {
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
    )
}
