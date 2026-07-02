
import { Handle, Position } from "@xyflow/react";
import "./TableNode.css";

export default function TableNode({ data }) {
  // Use data.isRevealed for entry/exit animations
  const visibilityClass = data.isRevealed ? "revealed" : "concealed";
  const activeColumns = data.activeColumns || [];

  return (
    <div className={`table-node premium-table ${visibilityClass}`}>
      <div className="table-header">
        <span className="table-icon">🗄️</span> {data.label}
      </div>

      <div className="table-body">
        {data.columns &&
          data.columns.map((col, idx) => {
            const isRelational = col.isPrimaryKey || col.isForeignKey;
            const isActive = activeColumns.includes(col.name);
            const handleRowClick = (event) => {
              // Stop the click from bubbling to the node, which would
              // otherwise trigger the table's expand/collapse behaviour.
              event.stopPropagation();
              data.onRowClick?.(col, data);
            };
            return (
              <div
                key={idx}
                data-row-column={isRelational ? col.name : undefined}
                onClick={handleRowClick}
                className={`table-column ${col.isPrimaryKey ? "pk-row" : ""} ${col.isForeignKey ? "fk-row" : ""} clickable-row ${isActive ? "row-active" : ""}`}
              >
                {col.isPrimaryKey && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${col.name}-source`}
                    className="row-handle pk-handle"
                  />
                )}
                {col.isForeignKey && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`${col.name}-target`}
                    className="row-handle fk-handle"
                  />
                )}
                <div className="column-left">
                  {col.isPrimaryKey && (
                    <span className="key-icon pk" title="Primary Key">
                      🔑
                    </span>
                  )}
                  {col.isForeignKey && (
                    <span className="key-icon fk" title="Foreign Key">
                      🔗
                    </span>
                  )}
                  {!col.isPrimaryKey && !col.isForeignKey && (
                    <span className="key-icon spacer"></span>
                  )}
                  <span className="column-name">{col.name}</span>
                </div>
                <span className="column-type">{col.type}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
