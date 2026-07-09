import React from 'react';
import './DetailPanel.css';

/**
 * Slide-in detail panel shown when a ReactFlow table node is clicked.
 * Props:
 *   node   – the selected node object (null when nothing selected)
 *   onClose – callback to close the panel
 */
export default function DetailPanel({ node, onClose }) {
  const isOpen = Boolean(node);

  return (
    <div className={`detail-panel ${isOpen ? 'detail-panel--open' : ''}`}>
      {node && (
        <>
          <div className="detail-panel__header">
            <div className="detail-panel__title">
              <span className="detail-panel__icon">🗄️</span>
              <span>{node.data.label}</span>
            </div>
            <button
              className="detail-panel__close"
              onClick={onClose}
              aria-label="Close detail panel"
            >
              ✕
            </button>
          </div>

          <div className="detail-panel__meta">
            <span className="detail-panel__badge">TABLE</span>
            <span className="detail-panel__col-count">
              {node.data.columns?.length ?? 0} columns
            </span>
          </div>

          <div className="detail-panel__body">
            <h3 className="detail-panel__section-title">Columns</h3>
            <div className="detail-panel__columns">
              {node.data.columns?.map((col, idx) => (
                <div
                  key={idx}
                  className={`detail-panel__col-row ${col.isPrimaryKey ? 'pk' : ''} ${col.isForeignKey ? 'fk' : ''}`}
                >
                  <div className="detail-panel__col-left">
                    {col.isPrimaryKey && (
                      <span className="detail-panel__key-badge pk-badge" title="Primary Key">PK</span>
                    )}
                    {col.isForeignKey && (
                      <span className="detail-panel__key-badge fk-badge" title="Foreign Key">FK</span>
                    )}
                    {!col.isPrimaryKey && !col.isForeignKey && (
                      <span className="detail-panel__key-badge empty-badge"> </span>
                    )}
                    <span className="detail-panel__col-name">{col.name}</span>
                  </div>
                  <span className="detail-panel__col-type">{col.type}</span>
                </div>
              ))}
            </div>

            {node.data.relationships && node.data.relationships.length > 0 && (
              <>
                <h3 className="detail-panel__section-title">Relationships</h3>
                <div className="detail-panel__relationships">
                  {node.data.relationships.map((rel, idx) => (
                    <div key={idx} className="detail-panel__rel-row">
                      <span className="detail-panel__rel-from">
                        {rel.from_field}
                      </span>
                      <span className="detail-panel__rel-arrow">→</span>
                      <span className="detail-panel__rel-to">
                        {rel.to_entity}.{rel.to_field}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
    </div>
  );
}
