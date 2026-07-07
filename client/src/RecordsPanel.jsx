import './RecordsPanel.css';
import { getEntity, getFieldsForEntity, getRecordsForEntity } from './lookup';

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  return String(value);
}

export default function RecordsPanel({ dataset, entityId, onClose }) {
  const entity = getEntity(dataset, entityId);
  const fields = getFieldsForEntity(dataset, entityId);
  const records = getRecordsForEntity(dataset, entityId);

  return (
    <div className="records-overlay" onClick={onClose}>
      <div className="records-panel" onClick={(event) => event.stopPropagation()}>
        <div className="records-panel-header">
          <span>{entity?.name ?? entityId} - {records.length} record{records.length === 1 ? '' : 's'}</span>
          <button className="records-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="records-panel-body">
          {records.length === 0 ? (
            <p className="records-empty">
              No data rows found for this table. The parsed SQL only had structure
              (CREATE TABLE), not INSERT statements.
            </p>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  {fields.map((field) => (
                    <th key={field.id}>{field.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    {fields.map((field) => (
                      <td key={field.id}>{formatValue(record.values[field.name])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
