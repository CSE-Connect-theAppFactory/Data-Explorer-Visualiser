// Helpers for reading Team A's agreed JSON shape: { entities[], fields[], relationships[] }

export function getEntity(dataset, entityId) {
  return dataset.entities.find((e) => e.id === entityId) ?? null;
}

export function getFieldsForEntity(dataset, entityId) {
  return dataset.fields.filter((f) => f.entity_id === entityId);
}

export function getRelationshipsForEntity(dataset, entityId) {
  return dataset.relationships.filter(
    (r) => r.from_entity === entityId || r.to_entity === entityId
  );
}

export function getRelationship(dataset, relationshipId) {
  return dataset.relationships.find((r) => r.id === relationshipId) ?? null;
}

export function getRecordsForEntity(dataset, entityId) {
  return (dataset.records ?? []).filter((r) => r.entity_id === entityId);
}
