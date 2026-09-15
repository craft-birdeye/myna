import React, { createContext, useContext, useState } from 'react'

/**
 * Default Instructions for the Procedures RHS (and Settings system prompt).
 * Procedure names use `{{…}}` chip markup so SystemPromptInput can render them.
 */
export const DEFAULT_AGENT_SYSTEM_PROMPT =
  'Use {{General inquiry}} when patient asks a general question about the practice, or anything that should come from the knowledge base: website, FAQs, hours, location, insurance, services, or doctors\n\n'
  + 'Use {{Talk to human}} when patient explicitly asks to speak with a person, real agent, receptionist, or human — or expresses frustration with the AI.'

interface AgentSystemPromptStore {
  systemPrompt: string
  setSystemPrompt: (value: string) => void
}

const AgentSystemPromptStoreContext = createContext<AgentSystemPromptStore | null>(null)

export function AgentSystemPromptStoreProvider({ children }: { children: React.ReactNode }) {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_AGENT_SYSTEM_PROMPT)

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
