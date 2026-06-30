import React from 'react';
import './DetailPanel.css';

const fakeFields = [
  { label: 'Name', value: 'Test' },
  { label: 'Email', value: 'test@test.com' },
  { label: 'Created At', value: '2026-01-12' },
  { label: 'Status', value: 'Active' },
];

export default function DetailPanel() {
  return (
    <div className="detail-panel premium-panel">
      <div className="detail-panel-header">
        <span className="detail-panel-icon">📋</span> Details
      </div>

      <div className="detail-panel-body">
        {fakeFields.map((field) => (
          <div key={field.label} className="detail-field">
            <span className="detail-field-label">{field.label}</span>
            <span className="detail-field-value">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
