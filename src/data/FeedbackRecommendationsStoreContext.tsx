import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  classifyFeedbackType,
  similarIssuesSummary,
  titleFromFeedback,
  type ConversationItem,
  type Recommendation,
} from './recommendationsData'

const STORAGE_KEY = 'myna:feedbackRecommendations'

interface SubmitFeedbackInput {
  text: string
  agentName: string
  conversation: ConversationItem
}

interface FeedbackRecommendationsStore {
  feedbackRecommendations: Recommendation[]
  submitFeedback: (input: SubmitFeedbackInput) => void
}

const FeedbackRecommendationsStoreContext = createContext<FeedbackRecommendationsStore | null>(null)

function loadInitial(): Recommendation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function priorityForCount(count: number): Recommendation['priority'] {
  return count >= 3 ? 'High' : 'Medium'
}

export function FeedbackRecommendationsStoreProvider({ children }: { children: React.ReactNode }) {
  const [feedbackRecommendations, setFeedbackRecommendations] = useState<Recommendation[]>(loadInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackRecommendations))
    } catch {
      // localStorage unavailable (e.g. private browsing) — feedback stays in-memory for this session
    }
  }, [feedbackRecommendations])

  const submitFeedback = ({ text, agentName, conversation }: SubmitFeedbackInput) => {
    const gapType = classifyFeedbackType(text)
    const feedbackKey = text.trim().toLowerCase().replace(/\s+/g, ' ')

    setFeedbackRecommendations((prev) => {
      const existingIndex = prev.findIndex(
        (rec) => rec.source === 'feedback' && rec.agentName === agentName && rec.feedbackKey === feedbackKey,
      )

      if (existingIndex >= 0) {
        const existing = prev[existingIndex]
        const conversationCount = existing.conversationCount + 1
        const updated: Recommendation = {
          ...existing,
          conversationCount,
          summary: similarIssuesSummary(conversationCount),
          priority: priorityForCount(conversationCount),
          timeAgo: 'Just now',
          conversations: [conversation, ...existing.conversations].slice(0, 20),
        }
        const next = [...prev]
        next[existingIndex] = updated
        return next
      }

      const title = titleFromFeedback(text)
      const newRecommendation: Recommendation = {
        id: `feedback-${Date.now()}`,
        gapType,
        title,
        procedureTitle: title,
        summary: similarIssuesSummary(1),
        priority: priorityForCount(1),
        timeAgo: 'Just now',
        conversationCount: 1,
        isNew: true,
        whenToUse: 'Raised via customer feedback in the Inbox.',
        steps: [{ title: 'Address the reported issue', bullets: [text] }],
        tools: [],
        rationale: 'A team member flagged this while reviewing an agent conversation in the Inbox.',
        changeType: 'Reported via Inbox feedback.',
        conversations: [conversation],
        source: 'feedback',
        agentName,
        feedbackKey,
      }
      return [...prev, newRecommendation]
    })
  }

  return (
    <FeedbackRecommendationsStoreContext.Provider value={{ feedbackRecommendations, submitFeedback }}>
      {children}
    </FeedbackRecommendationsStoreContext.Provider>
  )
}

export function useFeedbackRecommendationsStore(): FeedbackRecommendationsStore {
  const ctx = useContext(FeedbackRecommendationsStoreContext)
  if (!ctx) throw new Error('useFeedbackRecommendationsStore must be used inside FeedbackRecommendationsStoreProvider')
  return ctx
}
