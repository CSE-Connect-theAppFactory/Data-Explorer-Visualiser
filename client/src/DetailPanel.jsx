import './DetailPanel.css';
import { getEntity, getFieldsForEntity, getRelationshipsForEntity } from './lookup';

/**
 * Slide-in detail panel shown when a ReactFlow table node is clicked.
 * Props:
 *   dataset                 – the active dataset ({ entities, fields, relationships })
 *   selectedEntityId        – id of the selected table (null when nothing selected)
 *   selectedRelationshipId  – id of the selected relationship, used to highlight it below
 *   onClose                 – callback to close the panel
 */
export default function DetailPanel({ dataset, selectedEntityId, selectedRelationshipId, onClose }) {
  const entity = selectedEntityId ? getEntity(dataset, selectedEntityId) : null;
  const isOpen = Boolean(entity);
  const fields = entity ? getFieldsForEntity(dataset, entity.id) : [];
  const relationships = entity ? getRelationshipsForEntity(dataset, entity.id) : [];
  const fkFieldIds = new Set(dataset.relationships.map((r) => `${r.from_entity}.${r.from_field}`));

  return (
    <div className={`detail-panel ${isOpen ? 'detail-panel--open' : ''}`}>
      {entity && (
        <>
          <div className="detail-panel__header">
            <div className="detail-panel__title">
              <span className="detail-panel__icon">🗄️</span>
              <span>{entity.name}</span>
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
              {fields.length} column{fields.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="detail-panel__body">
            <h3 className="detail-panel__section-title">Columns</h3>
            <div className="detail-panel__columns">
              {fields.map((col) => {
                const isPrimaryKey = !!col.isPrimaryKey;
                const isForeignKey = fkFieldIds.has(col.id);
                return (
                  <div
                    key={col.id}
                    className={`detail-panel__col-row ${isPrimaryKey ? 'pk' : ''} ${isForeignKey ? 'fk' : ''}`}
                  >
                    <div className="detail-panel__col-left">
                      {isPrimaryKey && (
                        <span className="detail-panel__key-badge pk-badge" title="Primary Key">PK</span>
                      )}
                      {isForeignKey && (
                        <span className="detail-panel__key-badge fk-badge" title="Foreign Key">FK</span>
                      )}
                      {!isPrimaryKey && !isForeignKey && (
                        <span className="detail-panel__key-badge empty-badge"> </span>
                      )}
                      <span className="detail-panel__col-name">{col.name}</span>
                    </div>
                    <span className="detail-panel__col-type">{col.type}</span>
                  </div>
                );
              })}
            </div>

            {relationships.length > 0 && (
              <>
                <h3 className="detail-panel__section-title">Relationships</h3>
                <div className="detail-panel__relationships">
                  {relationships.map((rel) => (
                    <div
                      key={rel.id}
                      className={`detail-panel__rel-row ${rel.id === selectedRelationshipId ? 'detail-panel__rel-row--selected' : ''}`}
                    >
                      <span className="detail-panel__rel-from">
                        {rel.from_entity}.{rel.from_field}
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
