import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import './TableNode.css';

export default function TableNode({ id, data }) {
  // Use data.isRevealed for entry/exit animations
  const visibilityClass = data.isRevealed ? 'revealed' : 'concealed';
  const highlightClass = data.isHighlighted ? 'highlighted-connection' : '';

  // While concealed, this node sits under a CSS transform (scale/translate)
  // that React Flow's handle-bounds measurement can pick up, mispositioning
  // every edge attached to this table. Once the reveal transition finishes
  // and the transform settles to identity, force a re-measure.
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    if (!data.isRevealed) return;
    const timer = setTimeout(() => updateNodeInternals(id), 450);
    return () => clearTimeout(timer);
  }, [data.isRevealed, id, updateNodeInternals]);

  return (
    <div className={`table-node premium-table ${visibilityClass} ${highlightClass}`}>
      <div className="table-header">
        <span className="table-icon">🗄️</span> {data.label}
      </div>

      <div className="table-body">
        {data.columns && data.columns.map((col, idx) => (
          <div
            key={idx}
            className={`table-column ${col.isPrimaryKey ? 'pk-row' : ''} ${col.isForeignKey ? 'fk-row' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              data.onColumnClick?.();
            }}
          >
            {col.needsTargetHandle && (
              <>
                <Handle type="target" position={Position.Left} id={`${col.name}-target-left`} className="row-handle" />
                <Handle type="target" position={Position.Right} id={`${col.name}-target-right`} className="row-handle" />
              </>
            )}
            <div className="column-left">
              {col.isPrimaryKey && <span className="key-icon pk" title="Primary Key">🔑</span>}
              {col.isForeignKey && <span className="key-icon fk" title="Foreign Key">🔗</span>}
              {!col.isPrimaryKey && !col.isForeignKey && <span className="key-icon spacer"></span>}
              <span className="column-name">{col.name}</span>
            </div>
            <span className="column-type">{col.type}</span>
            {col.isForeignKey && (
              <>
                <Handle type="source" position={Position.Left} id={`${col.name}-source-left`} className="row-handle" />
                <Handle type="source" position={Position.Right} id={`${col.name}-source-right`} className="row-handle" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
