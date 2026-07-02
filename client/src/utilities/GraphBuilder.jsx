function GraphBuilder(tables) {
    const GRID_COLUMNS = 2;
    const NODE_SPACING_X = 400;
    const NODE_SPACING_Y = 350;

    const tableNames = new Set(tables.map((t) => t.table));
    const nodes = tables.map((t, idx) => ({
        id: t.table,
        type: 'tableNode',
        position: {
        x: (idx % GRID_COLUMNS) * NODE_SPACING_X + 100,
        y: Math.floor(idx / GRID_COLUMNS) * NODE_SPACING_Y + 100,
        },
    data: {
      label: t.table.charAt(0).toUpperCase() + t.table.slice(1),
      columns: t.columns.map((col) => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: col.name === 'id',
        isForeignKey: col.name !== 'id' && col.name.endsWith('_id'),
      })),
    },
  }));

  const edges = [];
  for (const t of tables) {
    for (const col of t.columns) {
      if (col.name === 'id' || !col.name.endsWith('_id')) continue;
      const referenced = `${col.name.slice(0, -3)}s`; // e.g. customer_id -> customers
      if (!tableNames.has(referenced) || referenced === t.table) continue;
      edges.push({
        id: `e-${referenced}-${t.table}-${col.name}`,
        source: referenced,
        target: t.table,
        sourceHandle: 'id-source',
        targetHandle: `${col.name}-target`,
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        hidden: true,
        data: { sourceColumn: 'id', targetColumn: col.name },
      });
    }
  }

  return { nodes, edges };
}
export default GraphBuilder;