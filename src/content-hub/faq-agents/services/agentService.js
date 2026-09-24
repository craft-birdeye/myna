/**
 * agentService — in-memory mock for Content Hub prototype.
 * No Firebase / Firestore. All operations work on an in-memory store
 * so the agent builder canvas is fully interactive without a backend.
 */

/* ─── In-memory store ─── */
const _agents = new Map();

const _SEED_TOOLS = [
  {
    id: '39hbiez',
    name: 'Webpage scraper',
    description: 'Scrapes selected business webpages to extract content and context for analysis.',
    category: 'Data collection',
  },
  {
    id: 's69wacq',
    name: "Google's PAA questions",
    description: "Retrieves Google's People Also Ask questions for a given set of search queries.",
    category: 'Research',
  },
  {
    id: '538goya',
    name: 'Select FAQs from question pool',
    description: 'Clusters similar questions, classifies intent, and picks the strongest 8–15 to form the final FAQ set.',
    category: 'Content selection',
  },
  {
    id: 'qgmncsh',
    name: 'Send FAQs to Content Hub',
    description: 'Formats the final FAQ set and pushes it into the Content Hub editor.',
    category: 'Output',
  },
  {
    id: 'sr1m5sk',
    name: 'Send to Search AI',
    description: 'Formats the final FAQ set and sends it to Search AI recommendations.',
    category: 'Output',
  },
];

const _customTools = new Map(_SEED_TOOLS.map(t => [t.id, t]));
const _agentListeners = new Set();
const _toolListeners = new Set();

function _notifyAgentListeners() {
  const list = Array.from(_agents.values());
  _agentListeners.forEach((cb) => cb(list));
}

function _notifyToolListeners() {
  const list = Array.from(_customTools.values());
  _toolListeners.forEach((cb) => cb(list));
}

/* ─── Agent operations ─── */

export function subscribeToAgents(callback) {
  _agentListeners.add(callback);
  callback(Array.from(_agents.values()));
  return () => _agentListeners.delete(callback);
}

export async function saveAgent(id, agent) {
  _agents.set(id, { ...agent, id });
  _notifyAgentListeners();
}

export async function deleteAgent(id) {
  _agents.delete(id);
  _notifyAgentListeners();
}

export async function getAgentBySlug(_moduleSlug, _agentSlug) {
  return null;
}

export function getCachedAgent(_agentSlug, _moduleSlug) {
  return null;
}

export async function prefetchAgent() {}

export async function getAgentsByModuleSlug(_moduleSlug) {
  return Array.from(_agents.values());
}

/* ─── Custom tool operations ─── */

export async function saveCustomTool(tool) {
  _customTools.set(tool.id, tool);
  _notifyToolListeners();
  return tool;
}

export async function deleteCustomTool(id) {
  _customTools.delete(id);
  _notifyToolListeners();
}

export function subscribeToCustomTools(callback) {
  _toolListeners.add(callback);
  callback(Array.from(_customTools.values()));
  return () => _toolListeners.delete(callback);
}

export async function getCustomTools() {
  return Array.from(_customTools.values());
}

export async function getCustomToolsByIds(ids) {
  return (ids || []).map((id) => _customTools.get(id)).filter(Boolean);
}
