import React from 'react';
import { Handle, Position } from '@xyflow/react';
import './TableNode.css';

export default function TableNode({ data }) {
  // Use data.isRevealed for entry/exit animations
  const visibilityClass = data.isRevealed ? 'revealed' : 'concealed';

  return (
    <div className={`table-node premium-table ${visibilityClass}`}>
      <Handle type="target" position={Position.Top} className="table-handle" />
      
      <div className="table-header">
        <span className="table-icon">🗄️</span> {data.label}
      </div>
      
      <div className="table-body">
        {data.columns && data.columns.map((col, idx) => (
          <div key={idx} className={`table-column ${col.isPrimaryKey ? 'pk-row' : ''} ${col.isForeignKey ? 'fk-row' : ''}`}>
            <div className="column-left">
              {col.isPrimaryKey && <span className="key-icon pk" title="Primary Key">🔑</span>}
              {col.isForeignKey && <span className="key-icon fk" title="Foreign Key">🔗</span>}
              {!col.isPrimaryKey && !col.isForeignKey && <span className="key-icon spacer"></span>}
              <span className="column-name">{col.name}</span>
            </div>
            <span className="column-type">{col.type}</span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="table-handle" />
    </div>
  );
}
