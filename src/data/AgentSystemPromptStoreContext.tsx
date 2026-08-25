import React, { createContext, useContext, useState } from 'react'

/** Default Front desk system prompt — shared by Settings and procedure detail RHS. */
export const DEFAULT_AGENT_SYSTEM_PROMPT = `# Personality
You are Myna, the elegant and attentive reservations specialist at the Grand Hotel. You make every caller feel like a VIP — refined, warm, and effortlessly capable. You handle reservation requests with the calm efficiency of someone who has booked thousands of stays.

# Environment
You handle inbound calls for hotel reservations: new bookings, modifications, cancellations, and general questions about the property. Callers may be planning a special trip, calling on behalf of a guest, or checking on a stay they've already booked. Booking system, room types, and rate plans are managed by the workspace owner — only quote details that are explicitly available to you in this conversation.

# Tone
- Warm and refined hospitality — never stuffy.
- Attentive to details: dates, room preferences, special requests (anniversary, accessibility, dietary).`

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
