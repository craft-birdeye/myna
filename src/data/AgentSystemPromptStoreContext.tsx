import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * Default Instructions for the Procedures RHS (and Settings system prompt).
 * Plain text only — this field has no procedure-insert control, so names
 * must not use `{{…}}` chip markup.
 */
export const DEFAULT_AGENT_SYSTEM_PROMPT =
  'Use General inquiry when patient asks a general question about the practice, or anything that should come from the knowledge base: website, FAQs, hours, location, insurance, services, or doctors\n\n'
  + 'Use Talk to human when patient explicitly asks to speak with a person, real agent, receptionist, or human — or expresses frustration with the AI.'

/** Drop legacy procedure-chip wrappers from older defaults (field chips stay). */
function plainProcedureNames(text: string) {
  return text
    .replace(/\{\{General inquiry\}\}/g, 'General inquiry')
    .replace(/\{\{Talk to human\}\}/g, 'Talk to human')
}

interface AgentSystemPromptStore {
  systemPrompt: string
  setSystemPrompt: (value: string) => void
}

const AgentSystemPromptStoreContext = createContext<AgentSystemPromptStore | null>(null)

export function AgentSystemPromptStoreProvider({ children }: { children: React.ReactNode }) {
  const [systemPrompt, setSystemPromptState] = useState(() => plainProcedureNames(DEFAULT_AGENT_SYSTEM_PROMPT))

  useEffect(() => {
    setSystemPromptState((prev) => plainProcedureNames(prev))
  }, [])

  const setSystemPrompt = (value: string) => setSystemPromptState(plainProcedureNames(value))

  return (
    <AgentSystemPromptStoreContext.Provider value={{ systemPrompt, setSystemPrompt }}>
      {children}
    </AgentSystemPromptStoreContext.Provider>
  )
}

export function useAgentSystemPromptStore(): AgentSystemPromptStore {
  const ctx = useContext(AgentSystemPromptStoreContext)
  if (!ctx) {
    throw new Error('useAgentSystemPromptStore must be used inside AgentSystemPromptStoreProvider')
  }
  return ctx
}

/** Returns null when rendered outside the provider (stories, library picker). */
export function useOptionalAgentSystemPromptStore(): AgentSystemPromptStore | null {
  return useContext(AgentSystemPromptStoreContext)
}
