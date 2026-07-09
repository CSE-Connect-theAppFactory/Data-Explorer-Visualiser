// Converts Team A's dataset shape ({ entities, fields, relationships }) into
// React Flow's { nodes, edges }, so any dataset can drive the graph.

import { MarkerType } from '@xyflow/react';
import dagre from 'dagre';

// Matches TableNode's card width (client/src/TableNode.css) plus the fixed
// per-row/header/padding sizes, so dagre reserves exactly enough space
// between cards and never overlaps them regardless of column count.
const NODE_WIDTH = 240;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 28;
const BODY_PADDING = 24;

export function buildGraph(dataset) {
  const fkFieldIds = new Set(dataset.relationships.map((r) => `${r.from_entity}.${r.from_field}`));
  // A relationship's target field needs a handle to connect to even when
  // isPrimaryKey wasn't captured on it (e.g. a parser that skipped PK
  // detection) — otherwise the edge silently fails to render.
  const relationshipTargetFieldIds = new Set(
    dataset.relationships.map((r) => `${r.to_entity}.${r.to_field}`)
  );

  const columnsByEntity = new Map(
    dataset.entities.map((entity) => [
      entity.id,
      dataset.fields
        .filter((f) => f.entity_id === entity.id)
        .map((f) => ({
          name: f.name,
          type: f.type,
          isPrimaryKey: !!f.isPrimaryKey,
          isForeignKey: fkFieldIds.has(f.id),
          needsTargetHandle: !!f.isPrimaryKey || relationshipTargetFieldIds.has(f.id),
        })),
    ])
  );

  // Auto-layout via dagre instead of a hand-rolled grid: it ranks tables by
  // FK relationships (left-to-right) and packs rows within a rank so cards
  // never overlap and unrelated tables don't end up on one straight line.
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 160 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const entity of dataset.entities) {
    const columnCount = columnsByEntity.get(entity.id)?.length ?? 0;
    g.setNode(entity.id, {
      width: NODE_WIDTH,
      height: HEADER_HEIGHT + BODY_PADDING + columnCount * ROW_HEIGHT,
    });
  }
  for (const r of dataset.relationships) {
    // Self-references don't affect ranking — a table doesn't need to be
    // placed relative to itself.
    if (r.from_entity === r.to_entity) continue;
    g.setEdge(r.from_entity, r.to_entity);
  }
  dagre.layout(g);

  // React Flow positions are top-left; dagre returns centers.
  const positions = new Map(
    dataset.entities.map((entity) => {
      const { x, y, width, height } = g.node(entity.id);
      return [entity.id, { x: x - width / 2, y: y - height / 2 }];
    })
  );

  const nodes = dataset.entities.map((entity) => ({
    id: entity.id,
    type: 'tableNode',
    position: positions.get(entity.id),
    data: {
      label: entity.name,
      columns: columnsByEntity.get(entity.id),
    },
  }));

  const edges = dataset.relationships.map((r) => {
    const isSelfReference = r.from_entity === r.to_entity;

    let sourceSide;
    let targetSide;
    if (isSelfReference) {
      // Keep both ends on the same side so the loop bulges out next to the
      // table instead of sweeping across the canvas to the opposite side
      // of the same node.
      sourceSide = 'right';
      targetSide = 'right';
    } else {
      // Point each handle toward the other table so the line leaves/enters
      // each row from whichever side actually faces the other table.
      const sourceOnLeft = positions.get(r.from_entity).x <= positions.get(r.to_entity).x;
      sourceSide = sourceOnLeft ? 'right' : 'left';
      targetSide = sourceOnLeft ? 'left' : 'right';
    }

    return {
      id: r.id,
      source: r.from_entity,
      target: r.to_entity,
      sourceHandle: `${r.from_field}-source-${sourceSide}`,
      targetHandle: `${r.to_field}-target-${targetSide}`,
      type: isSelfReference ? 'selfLoop' : undefined,
      animated: true,
      style: { stroke: '#38bdf8', strokeWidth: 2 },
      // Arrow points from the foreign key at from_field toward the primary
      // key it references, showing which table's row the FK depends on.
      markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8', width: 18, height: 18 },
      hidden: true,
    };
  });

  return { nodes, edges };
}
