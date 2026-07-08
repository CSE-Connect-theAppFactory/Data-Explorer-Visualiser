// Converts Team A's dataset shape ({ entities, fields, relationships }) into
// React Flow's { nodes, edges }, so any dataset can drive the graph.

export function buildGraph(dataset) {
  const fkFieldIds = new Set(dataset.relationships.map((r) => `${r.from_entity}.${r.from_field}`));

  // Undirected adjacency between entities, used to lay tables out by how
  // closely related they are rather than by array order. Self-references
  // don't affect layout — a table doesn't need to be placed relative to itself.
  const neighborsOf = new Map(dataset.entities.map((e) => [e.id, new Set()]));
  for (const r of dataset.relationships) {
    if (r.from_entity === r.to_entity) continue;
    neighborsOf.get(r.from_entity)?.add(r.to_entity);
    neighborsOf.get(r.to_entity)?.add(r.from_entity);
  }

  // BFS distance from the root (same root App.jsx reveals first) so directly
  // connected tables land in adjacent columns. This keeps unrelated tables
  // out of the straight-line path between two tables that reference each
  // other, which is what caused connector lines to cut through other cards
  // under the old index-based 3-column grid.
  const rootId = dataset.entities[0]?.id;
  const depthOf = new Map();
  if (rootId) {
    depthOf.set(rootId, 0);
    const queue = [rootId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const depth = depthOf.get(currentId);
      for (const neighborId of neighborsOf.get(currentId) ?? []) {
        if (!depthOf.has(neighborId)) {
          depthOf.set(neighborId, depth + 1);
          queue.push(neighborId);
        }
      }
    }
  }

  // Entities unreachable from the root (disconnected data) still need a
  // column; place them after the deepest reachable tier.
  const maxDepth = Math.max(0, ...depthOf.values());
  let nextFallbackDepth = maxDepth + 1;

  const rowCountByDepth = new Map();
  const positions = new Map();
  for (const entity of dataset.entities) {
    const depth = depthOf.has(entity.id) ? depthOf.get(entity.id) : nextFallbackDepth++;
    const row = rowCountByDepth.get(depth) ?? 0;
    rowCountByDepth.set(depth, row + 1);
    positions.set(entity.id, { x: depth * 380 + 100, y: row * 300 + 100 });
  }

  const nodes = dataset.entities.map((entity) => ({
    id: entity.id,
    type: 'tableNode',
    position: positions.get(entity.id),
    data: {
      label: entity.name,
      columns: dataset.fields
        .filter((f) => f.entity_id === entity.id)
        .map((f) => ({
          name: f.name,
          type: f.type,
          isPrimaryKey: !!f.isPrimaryKey,
          isForeignKey: fkFieldIds.has(f.id),
        })),
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
      hidden: true,
    };
  });

  return { nodes, edges };
}
