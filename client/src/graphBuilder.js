// Converts Team A's dataset shape ({ entities, fields, relationships }) into
// React Flow's { nodes, edges }, so any dataset can drive the graph.

export function buildGraph(dataset) {
  const fkFieldIds = new Set(dataset.relationships.map((r) => `${r.from_entity}.${r.from_field}`));

  const nodes = dataset.entities.map((entity, i) => ({
    id: entity.id,
    type: 'tableNode',
    position: { x: (i % 3) * 350 + 100, y: Math.floor(i / 3) * 300 + 100 },
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

  const edges = dataset.relationships.map((r) => ({
    id: r.id,
    source: r.from_entity,
    target: r.to_entity,
    animated: true,
    style: { stroke: '#38bdf8', strokeWidth: 2 },
    hidden: true,
  }));

  return { nodes, edges };
}
