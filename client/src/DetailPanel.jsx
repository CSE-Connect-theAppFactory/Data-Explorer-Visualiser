import './DetailPanel.css';
import { getEntity, getFieldsForEntity, getRelationshipsForEntity, getRelationship } from './lookup';

export default function DetailPanel({ dataset, selectedEntityId, selectedRelationshipId }) {
  if (selectedRelationshipId) {
    const relationship = getRelationship(dataset, selectedRelationshipId);

    if (!relationship) {
      return (
        <div className="detail-panel premium-panel">
          <div className="detail-panel-header">
            <span className="detail-panel-icon">🔗</span> Relationship
          </div>
          <div className="detail-panel-body">
            <p className="detail-empty">Relationship not found.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="detail-panel premium-panel">
        <div className="detail-panel-header">
          <span className="detail-panel-icon">🔗</span> Relationship
        </div>
        <div className="detail-panel-body">
          <div className="detail-relationship-row">
            <span className="detail-relationship-table">{relationship.from_entity}</span>
            <span className="detail-relationship-via">{relationship.from_field}</span>
          </div>
          <div className="detail-relationship-row">
            <span className="detail-relationship-table">{relationship.to_entity}</span>
            <span className="detail-relationship-via">{relationship.to_field}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedEntityId) {
    return (
      <div className="detail-panel premium-panel">
        <div className="detail-panel-header">
          <span className="detail-panel-icon">📋</span> Details
        </div>
        <div className="detail-panel-body">
          <p className="detail-empty">Select a table to view its details.</p>
        </div>
      </div>
    );
  }

  const entity = getEntity(dataset, selectedEntityId);
  const fields = getFieldsForEntity(dataset, selectedEntityId);
  const relationships = getRelationshipsForEntity(dataset, selectedEntityId);

  return (
    <div className="detail-panel premium-panel">
      <div className="detail-panel-header">
        <span className="detail-panel-icon">📋</span> {entity?.name ?? selectedEntityId}
      </div>

      <div className="detail-panel-body">
        {fields.map((field) => (
          <div key={field.id} className="detail-field">
            <span className="detail-field-label">{field.name}</span>
            <span className="detail-field-value">{field.type}</span>
          </div>
        ))}

        {relationships.length > 0 && (
          <div className="detail-relationships">
            <span className="detail-panel-icon">🔗</span>
            <div className="detail-relationships-header">Connects to</div>
            {relationships.map((rel) => {
              const isOutgoing = rel.from_entity === selectedEntityId;
              const otherEntity = isOutgoing ? rel.to_entity : rel.from_entity;
              const otherField = isOutgoing ? rel.to_field : rel.from_field;
              const viaField = isOutgoing ? rel.from_field : rel.to_field;
              return (
                <div key={rel.id} className="detail-relationship-row">
                  <span className="detail-relationship-table">{otherEntity}</span>
                  <span className="detail-relationship-via">via {viaField} → {otherField}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
