/**
 * templateService — in-memory mock for Content Hub prototype.
 * No Firebase / Firestore.
 */

const _templates = new Map();
const _listeners = new Set();

function _notify() {
  const list = Array.from(_templates.values());
  _listeners.forEach((cb) => cb(list));
}

export function subscribeToTemplates(callback) {
  _listeners.add(callback);
  callback(Array.from(_templates.values()));
  return () => _listeners.delete(callback);
}

export async function saveTemplate(id, template) {
  _templates.set(id, { ...template, id });
  _notify();
}

export async function deleteTemplate(id) {
  _templates.delete(id);
  _notify();
}
