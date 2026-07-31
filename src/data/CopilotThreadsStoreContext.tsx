import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * Per-agent Copilot conversation history.
 *
 * Every AI surface in the app (create-agent flow, recommendation detail, inbox coaching,
 * the docked Copilot panel) is a window onto the same copilot — this store is the shared
 * memory that makes that true. Threads are scoped to an agent instance name and surface in
 * the CopilotPanel's "Recent conversations" list.
 *
 * Threads with a `recommendationId` are links: opening them jumps to that recommendation's
 * detail page instead of rendering a transcript in the panel.
 */

export type CopilotThreadOrigin = 'create' | 'recommendation' | 'coaching' | 'ask'

export interface CopilotThreadMessage {
  id: string
  role: 'user' | 'copilot' | 'system'
  text: string
}

export interface CopilotThread {
  id: string
  agentName: string
  origin: CopilotThreadOrigin
  title: string
  /** Human-friendly relative label ("Just now", "May 12") — prototype data, not computed. */
  timeLabel: string
  messages: CopilotThreadMessage[]
  /** When set, opening this thread navigates to the recommendation detail page. */
  recommendationId?: string
}

export interface UpsertThreadInput {
  agentName: string
  origin: CopilotThreadOrigin
  title: string
  messages?: CopilotThreadMessage[]
  recommendationId?: string
  /** Stable id for dedupe — e.g. `rec::<id>` or `create::<agentName>`. Upserting an existing
   *  id bumps the thread to the top and refreshes its title/timeLabel instead of duplicating. */
  dedupeKey?: string
}

interface CopilotThreadsStore {
  /** Most-recent-first threads for one agent, including its seeded creation thread. */
  listThreads: (agentName: string) => CopilotThread[]
  getThread: (id: string) => CopilotThread | undefined
  /** Returns the thread id (existing id when deduped). */
  upsertThread: (input: UpsertThreadInput) => string
  appendMessages: (threadId: string, messages: CopilotThreadMessage[]) => void
}

const STORAGE_KEY = 'myna-copilot-threads'

let nextId = 1
const uid = (prefix: string) => `${prefix}-${Date.now()}-${nextId++}`

const msg = (role: CopilotThreadMessage['role'], text: string): CopilotThreadMessage => ({
  id: uid('m'),
  role,
  text,
})

/** Every agent instance lazily gets its creation conversation as the first history entry. */
function seedThreadsFor(agentName: string): CopilotThread[] {
  return [
    {
      id: `create::${agentName}`,
      agentName,
      origin: 'create',
      title: 'Created this agent',
      timeLabel: 'May 12',
      messages: [
        msg('user', 'I need an agent that answers our calls, books and reschedules appointments, and handles the common patient questions.'),
        msg(
          'copilot',
          `I set up ${agentName.replace(/ - .+$/, '').toLowerCase()} with procedures for booking, cancellations, insurance verification and urgent-concern routing, and connected your calendar and FAQ documents.`,
        ),
        msg('system', 'Agent created'),
        msg('copilot', 'You can keep refining here anytime — ask me to tighten a procedure, change the greeting, or take on a new job.'),
      ],
    },
  ]
}

function loadInitial(): CopilotThread[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const CopilotThreadsStoreContext = createContext<CopilotThreadsStore | null>(null)

export function CopilotThreadsStoreProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<CopilotThread[]>(loadInitial)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
    } catch {
      // sessionStorage unavailable — history stays in-memory for this session
    }
  }, [threads])

  const listThreads = (agentName: string): CopilotThread[] => {
    const stored = threads.filter((t) => t.agentName === agentName)
    const storedIds = new Set(stored.map((t) => t.id))
    const seeds = seedThreadsFor(agentName).filter((s) => !storedIds.has(s.id))
    return [...stored, ...seeds]
  }

  const getThread = (id: string): CopilotThread | undefined => {
    const stored = threads.find((t) => t.id === id)
    if (stored) return stored
    // Seed ids encode their agent: `create::<agentName>`
    if (id.startsWith('create::')) {
      const agentName = id.slice('create::'.length)
      return seedThreadsFor(agentName).find((s) => s.id === id)
    }
    return undefined
  }

  const upsertThread = ({ agentName, origin, title, messages, recommendationId, dedupeKey }: UpsertThreadInput): string => {
    const id = dedupeKey ?? uid('thread')
    setThreads((prev) => {
      const existing = prev.find((t) => t.id === id) ?? (dedupeKey ? getSeed(dedupeKey) : undefined)
      const rest = prev.filter((t) => t.id !== id)
      const updated: CopilotThread = existing
        ? { ...existing, title, timeLabel: 'Just now', messages: messages ?? existing.messages, recommendationId: recommendationId ?? existing.recommendationId }
        : { id, agentName, origin, title, timeLabel: 'Just now', messages: messages ?? [], recommendationId }
      return [updated, ...rest]
    })
    return id
  }

  const appendMessages = (threadId: string, messages: CopilotThreadMessage[]) => {
    setThreads((prev) => {
      const existing = prev.find((t) => t.id === threadId) ?? getSeed(threadId)
      if (!existing) return prev
      const rest = prev.filter((t) => t.id !== threadId)
      return [{ ...existing, timeLabel: 'Just now', messages: [...existing.messages, ...messages] }, ...rest]
    })
  }

  return (
    <CopilotThreadsStoreContext.Provider value={{ listThreads, getThread, upsertThread, appendMessages }}>
      {children}
    </CopilotThreadsStoreContext.Provider>
  )
}

/** Resolve a seed thread by id so mutations can materialize it into state first. */
function getSeed(id: string): CopilotThread | undefined {
  if (!id.startsWith('create::')) return undefined
  const agentName = id.slice('create::'.length)
  return seedThreadsFor(agentName).find((s) => s.id === id)
}

export function useCopilotThreadsStore(): CopilotThreadsStore {
  const store = useContext(CopilotThreadsStoreContext)
  if (!store) throw new Error('useCopilotThreadsStore must be used within CopilotThreadsStoreProvider')
  return store
}

/** Helper for composing a message without exporting the uid machinery. */
export function copilotMessage(role: CopilotThreadMessage['role'], text: string): CopilotThreadMessage {
  return msg(role, text)
}
