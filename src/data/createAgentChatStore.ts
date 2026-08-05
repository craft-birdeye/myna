/** Store for co-pilot chats saved via "Save agent" from the create flow.
 *  Persisted to sessionStorage so the transcript survives a reload / HMR. */

export type CreateChatTurn =
  | { kind: 'user'; text: string }
  | { kind: 'user-files'; labels: string[] }
  | { kind: 'thoughts'; text: string; label?: string }
  | { kind: 'agent'; paragraphs: string[] }
  | { kind: 'status'; text: string }
  | { kind: 'draft'; title: string; description: string }

export type CreateChatVariant = 'frontdesk' | 'reminder'

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

const STORAGE_KEY = 'myna.savedCreateChats'

type Store = Partial<Record<CreateChatVariant, SavedCreateChat>>

let memoryStore: Store = readStore()

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
