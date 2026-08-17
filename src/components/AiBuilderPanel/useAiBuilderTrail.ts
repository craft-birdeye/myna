import { useEffect, useState } from 'react'
import {
  appendCreateAiDraftTurn,
  getCreateAiDraftSession,
  subscribeCreateAiDraft,
  type CreateChatTurn,
} from '../../data/createAgentChatStore'

const DEFAULT_AGENT_REPLY =
  "Got it — I'll help with that. Describe any other changes you'd like."

function normalizeKey(agentKey: string) {
  return (agentKey || 'agent').trim().toLowerCase() || 'agent'
}

/** Shared Create with AI trail between fullscreen expand and the docked AI Builder panel. */
export function useAiBuilderTrail(agentKey: string) {
  const key = (agentKey || 'agent').trim() || 'agent'
  const [trail, setTrail] = useState<CreateChatTurn[]>(
    () => getCreateAiDraftSession(key)?.trail ?? [],
  )

  useEffect(() => {
    setTrail(getCreateAiDraftSession(key)?.trail ?? [])
    const normalized = normalizeKey(key)
    return subscribeCreateAiDraft((changedKey) => {
      if (changedKey !== normalized) return
      setTrail(getCreateAiDraftSession(key)?.trail ?? [])
    })
  }, [key])

  const send = (text: string, agentReply = DEFAULT_AGENT_REPLY) => {
    const trimmed = String(text || '').trim()
    if (!trimmed) return
    appendCreateAiDraftTurn(key, { kind: 'user', text: trimmed })
    const next = appendCreateAiDraftTurn(key, {
      kind: 'agent',
      paragraphs: [agentReply],
    })
    setTrail(next.trail)
  }

  return { trail, send, hasMessages: trail.length > 0 }
}
