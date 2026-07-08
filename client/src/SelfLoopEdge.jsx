import { BaseEdge } from '@xyflow/react';

// React Flow's default bezier edge collapses to a near-invisible straight
// line when a self-referencing FK's source and target handles sit on the
// same side of the same node (zero horizontal distance to curve around).
// This draws a fixed-size loop bulging out to the right instead.
export default function SelfLoopEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }) {
  const bulge = 70;
  const path = `M ${sourceX},${sourceY} C ${sourceX + bulge},${sourceY} ${targetX + bulge},${targetY} ${targetX},${targetY}`;
  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />;
}
