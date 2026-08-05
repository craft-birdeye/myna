/** Shared HTML5 DnD helpers for LHS → canvas drops. */

export function setFlowDragData(dataTransfer, { type, label, description }) {
  if (!dataTransfer) return;
  dataTransfer.setData('application/reactflow-type', type);
  dataTransfer.setData('application/reactflow-label', label ?? '');
  dataTransfer.setData('application/reactflow-description', description ?? '');
  // Custom kind MIME appears in `types` during dragover (unlike getData values).
  dataTransfer.setData(`application/reactflow-kind-${type}`, '1');
  dataTransfer.effectAllowed = 'copy';
}

export function getFlowDragPayload(dataTransfer) {
  if (!dataTransfer) return { type: '', label: '', description: '' };
  return {
    type: dataTransfer.getData('application/reactflow-type'),
    label: dataTransfer.getData('application/reactflow-label'),
    description: dataTransfer.getData('application/reactflow-description'),
  };
}

export function isDraggingFlowKind(dataTransfer, kind) {
  const types = dataTransfer?.types;
  if (!types || !kind) return false;
  return Array.from(types).includes(`application/reactflow-kind-${kind}`);
}

export function getDraggingFlowKind(dataTransfer) {
  const types = dataTransfer?.types;
  if (!types) return null;
  for (const t of Array.from(types)) {
    if (t.startsWith('application/reactflow-kind-')) {
      return t.slice('application/reactflow-kind-'.length);
    }
  }
  return null;
}
