/** Store for co-pilot chats saved via "Save agent" from the create flow.
 *  Persisted to sessionStorage so the transcript survives a reload / HMR. */

export type CreateChatVariant = 'frontdesk' | 'reminder'

export type CreateChatTurn =
  | { kind: 'user'; text: string }
  | { kind: 'user-files'; labels: string[] }
  | { kind: 'thoughts'; text: string; label?: string }
  | { kind: 'agent'; paragraphs: string[] }
  | { kind: 'status'; text: string }
  | {
      kind: 'draft'
      title: string
      description: string
      variant?: CreateChatVariant | 'review-response'
      refillAdded?: boolean
    }

export type SavedCreateChat = {
  id: string
  title: string
  prompt: string
  draftTitle: string
  draftDescription: string
  /** Legacy short replies — kept for older saved chats / static history. */
  replies: string[][]
  /** Full co-pilot trail (user, thoughts, agent) when available. */
  trail?: CreateChatTurn[]
  variant?: CreateChatVariant
}

/** In-progress Create with AI thread shared between the LHS panel and fullscreen. */
export type CreateAiDraftSession = {
  agentKey: string
  trail: CreateChatTurn[]
  updatedAt: number
}

const STORAGE_KEY = 'myna.savedCreateChats'
const DRAFT_STORAGE_KEY = 'myna.createAiDraftSessions'

type Store = Partial<Record<CreateChatVariant, SavedCreateChat>>
type DraftStore = Record<string, CreateAiDraftSession>

let memoryStore: Store = readStore()
let draftMemoryStore: DraftStore = readDraftStore()

type DraftListener = (agentKey: string) => void
const draftListeners = new Set<DraftListener>()

function notifyDraftListeners(agentKey: string) {
  draftListeners.forEach((listener) => {
    try {
      listener(agentKey)
    } catch {
      // Ignore subscriber errors so one bad listener can't break writers.
    }
  })
}

/** Subscribe to Create-with-AI draft trail writes (LHS create flow ↔ AI Builder panel). */
export function subscribeCreateAiDraft(listener: DraftListener): () => void {
  draftListeners.add(listener)
  return () => {
    draftListeners.delete(listener)
  }
}

function readStore(): Store {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage unavailable (private mode / quota) — memory copy still works.
  }
}

function readDraftStore(): DraftStore {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DraftStore) : {}
  } catch {
    return {}
  }
}

function writeDraftStore(store: DraftStore) {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage unavailable — memory copy still works.
  }
}

function normalizeAgentKey(agentKey: string): string {
  return (agentKey || 'agent').trim().toLowerCase()
}

export function rememberCreateAgentChat(variant: CreateChatVariant, chat: SavedCreateChat) {
  memoryStore = { ...readStore(), ...memoryStore, [variant]: chat }
  writeStore(memoryStore)
}

/** Resolves a saved chat for an agent. Falls back to the only saved chat when
 *  the variant can't be matched (e.g. the editor opened under a draft name). */
export function getLastSavedCreateChat(
  variant: CreateChatVariant | null,
): SavedCreateChat | null {
  const store = { ...readStore(), ...memoryStore }
  if (variant && store[variant]) return store[variant]!
  const all = Object.values(store).filter(Boolean) as SavedCreateChat[]
  return all.length === 1 ? all[0] : null
}

/** Maps any agent / instance name to a create-flow variant. */
export function createChatVariantForAgent(name: string): CreateChatVariant | null {
  const lower = name.toLowerCase()
  if (lower.includes('reminder')) return 'reminder'
  if (lower.includes('front desk') || lower.includes('frontdesk')) return 'frontdesk'
  return null
}

export function getCreateAiDraftSession(agentKey: string): CreateAiDraftSession | null {
  const key = normalizeAgentKey(agentKey)
  const store = { ...readDraftStore(), ...draftMemoryStore }
  return store[key] ?? null
}

export function setCreateAiDraftTrail(agentKey: string, trail: CreateChatTurn[]): CreateAiDraftSession {
  const key = normalizeAgentKey(agentKey)
  const existing = getCreateAiDraftSession(agentKey)
  if (
    existing &&
    existing.trail.length === trail.length &&
    JSON.stringify(existing.trail) === JSON.stringify(trail)
  ) {
    return existing
  }
  const next: CreateAiDraftSession = {
    agentKey: key,
    trail,
    updatedAt: Date.now(),
  }
  draftMemoryStore = { ...readDraftStore(), ...draftMemoryStore, [key]: next }
  writeDraftStore(draftMemoryStore)
  notifyDraftListeners(key)
  return next
}

export function appendCreateAiDraftTurn(
  agentKey: string,
  turn: CreateChatTurn,
): CreateAiDraftSession {
  const existing = getCreateAiDraftSession(agentKey)
  return setCreateAiDraftTrail(agentKey, [...(existing?.trail ?? []), turn])
}

export function clearCreateAiDraftSession(agentKey: string) {
  const key = normalizeAgentKey(agentKey)
  const store = { ...readDraftStore(), ...draftMemoryStore }
  delete store[key]
  draftMemoryStore = store
  writeDraftStore(draftMemoryStore)
  notifyDraftListeners(key)
}

/** Prefer an in-progress LHS draft; fall back to the last saved create chat. */
export function getRetainedCreateAiChat(agentName: string): SavedCreateChat | null {
  const draft = getCreateAiDraftSession(agentName)
  if (draft?.trail?.length) {
    const firstUser = draft.trail.find((t) => t.kind === 'user')
    return {
      id: `draft-${normalizeAgentKey(agentName)}`,
      title: agentName || 'Create with AI',
      prompt: firstUser && firstUser.kind === 'user' ? firstUser.text : '',
      draftTitle: '',
      draftDescription: '',
      replies: [],
      trail: draft.trail,
      variant: createChatVariantForAgent(agentName) ?? undefined,
    }
  }
  return getLastSavedCreateChat(createChatVariantForAgent(agentName))
}
