import React, { createContext, useContext, useEffect, useState } from 'react'
import { buildCoachingFeedbackRecommendation } from './coachingFeedbackRecommendations'
import {
  classifyFeedbackType,
  pickReporterName,
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
  /** Inbox conversation id the feedback was raised from — carried onto the recommendation so
   *  "See conversations" can open the real transcript instead of a synthetic one. */
  conversationId?: string
  /** Id of the specific message that was marked thumbs-down — carried onto the recommendation so
   *  the real transcript preview can highlight that exact message. */
  messageId?: string
}

interface FeedbackRecommendationsStore {
  feedbackRecommendations: Recommendation[]
  /** Returns the id of the recommendation the feedback landed on (created, or an existing one it
   *  was merged into), so a caller can immediately link to it (e.g. "Track your feedback"). */
  submitFeedback: (input: SubmitFeedbackInput) => string
  /** Wipes every Human-feedback recommendation across every agent — a clean-slate control for
   *  clearing out test/demo feedback before a fresh walkthrough. */
  clearAllFeedback: () => void
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

  const submitFeedback = ({ text, agentName, conversation, conversationId, messageId }: SubmitFeedbackInput): string => {
    // The four coaching-example transcripts (Inbox voice calls C1–C4) get a fully hand-scripted
    // chat — same pattern as the AI-detected recommendations — instead of the generic
    // heuristic-classified one below.
    const coachingRecommendation = buildCoachingFeedbackRecommendation(conversationId, agentName, conversation, messageId)
    if (coachingRecommendation) {
      setFeedbackRecommendations((prev) => {
        const existingIndex = prev.findIndex(
          (rec) => rec.source === 'feedback' && rec.agentName === agentName && rec.feedbackKey === coachingRecommendation.feedbackKey,
        )
        if (existingIndex >= 0) {
          // Always refresh to the current template — these are hand-scripted and versioned in
          // code, so a resubmission (or a template update since the record was first created)
          // should replace the stored copy rather than leave it frozen at whatever it looked
          // like when it was first created.
          const next = [...prev]
          next[existingIndex] = coachingRecommendation
          return next
        }
        return [...prev, coachingRecommendation]
      })
      return coachingRecommendation.id
    }

    const gapType = classifyFeedbackType(text)
    const feedbackKey = text.trim().toLowerCase().replace(/\s+/g, ' ')
    // Computed up front (outside the state updater) so we can hand the id straight back to the
    // caller — reused as-is if this feedback already has an open record, else freshly minted.
    const existing = feedbackRecommendations.find(
      (rec) => rec.source === 'feedback' && rec.agentName === agentName && rec.feedbackKey === feedbackKey,
    )
    const resultId = existing?.id ?? `feedback-${Date.now()}`

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

      const title = titleFromFeedback(text, gapType)
      // Human feedback is most often a knowledge gap (the agent didn't know something) — those
      // can't be accepted sight-unseen, so route them through the same "upload the real
      // document, then review" gate used for AI-detected knowledge recommendations.
      const needsSourceDocument = gapType === 'knowledge'
      const newRecommendation: Recommendation = {
        id: resultId,
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
        sourceConversationId: conversationId,
        sourceMessageId: messageId,
        reportedBy: pickReporterName(feedbackKey),
        manualUpdates: needsSourceDocument
          ? [
              {
                icon: 'upload_file',
                title: 'Upload supporting document',
                description:
                  "We don't have this confirmed anywhere yet — upload the relevant document (e.g. hours, policy, pricing) so we can add accurate information to the agent's knowledge.",
                relatedType: 'knowledge',
              },
            ]
          : undefined,
      }
      return [...prev, newRecommendation]
    })
    return resultId
  }

  const clearAllFeedback = () => {
    setFeedbackRecommendations([])
  }

  return (
    <FeedbackRecommendationsStoreContext.Provider value={{ feedbackRecommendations, submitFeedback, clearAllFeedback }}>
      {children}
    </FeedbackRecommendationsStoreContext.Provider>
  )
}

export function useFeedbackRecommendationsStore(): FeedbackRecommendationsStore {
  const ctx = useContext(FeedbackRecommendationsStoreContext)
  if (!ctx) throw new Error('useFeedbackRecommendationsStore must be used inside FeedbackRecommendationsStoreProvider')
  return ctx
}
