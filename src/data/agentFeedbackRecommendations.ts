export type FeedbackChannel = 'Voice' | 'Chat' | 'Text'

export interface AgentFeedbackRecommendation {
  id: string
  messageId: string
  feedback: string
  agentResponse: string
  conversationName: string
  conversationLocation: string
  channel: FeedbackChannel
  submittedAt: string
  agentName: string
}

export interface NewAgentFeedbackInput {
  messageId: string
  feedback: string
  agentResponse: string
  conversationName: string
  conversationLocation: string
  channel: FeedbackChannel
  agentName: string
}

let feedbackItems: AgentFeedbackRecommendation[] = []
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function addAgentFeedbackRecommendation(input: NewAgentFeedbackInput): AgentFeedbackRecommendation {
  const entry: AgentFeedbackRecommendation = {
    ...input,
    id: `fb-${input.messageId}-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  }
  feedbackItems = [entry, ...feedbackItems]
  notify()
  return entry
}

export function getAgentFeedbackRecommendations(): AgentFeedbackRecommendation[] {
  return feedbackItems
}

export function subscribeAgentFeedbackRecommendations(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function inferTitle(feedback: string, agentResponse: string): { title: string; procedureTitle: string; topics: string[] } {
  const combined = `${feedback} ${agentResponse}`.toLowerCase()
  if (combined.includes('business hour') || combined.includes('timing') || combined.includes('open')) {
    return { title: 'Update business hours', procedureTitle: 'Business hours', topics: ['Business hours'] }
  }
  if (combined.includes('payment') || combined.includes('pay')) {
    return { title: 'Update payment guidance', procedureTitle: 'Payment processing procedure', topics: ['Payments'] }
  }
  if (combined.includes('appointment') || combined.includes('schedule') || combined.includes('book')) {
    return { title: 'Update appointment guidance', procedureTitle: 'Appointment scheduling procedure', topics: ['Appointments'] }
  }
  return { title: 'Improve agent response', procedureTitle: 'Agent response', topics: ['General inquiry'] }
}

function formatSubmittedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Maps inbox feedback into the Frontdesk recommendations detail shape. */
export function mapFeedbackToFrontdeskRecommendation(fb: AgentFeedbackRecommendation) {
  const { title, procedureTitle, topics } = inferTitle(fb.feedback, fb.agentResponse)
  const truncatedResponse =
    fb.agentResponse.length > 140 ? `${fb.agentResponse.slice(0, 140).trim()}…` : fb.agentResponse

  return {
    id: fb.id,
    gapType: 'knowledge' as const,
    title,
    procedureTitle,
    summary: fb.feedback,
    priority: 'High' as const,
    timeAgo: 'Just now',
    conversationCount: 1,
    isNew: true,
    source: 'human' as const,
    topics,
    whenToUse: 'When a customer asks a similar question and the agent needs to respond accurately.',
    steps: [
      {
        title: 'Review flagged response',
        bullets: [
          `Feedback: "${fb.feedback}"`,
          'Update the knowledge base or procedure so the agent reflects the latest information.',
        ],
      },
    ],
    tools: [],
    rationale: `Submitted from inbox after a thumbs-down on this agent response: "${truncatedResponse}"`,
    changeType: 'Flagged via inbox feedback.',
    conversations: [
      {
        name: fb.conversationName,
        message: fb.feedback,
        channel: fb.channel,
        date: formatSubmittedDate(fb.submittedAt),
        location: fb.conversationLocation,
      },
    ],
    sim: {
      before: [{ role: 'agent' as const, text: fb.agentResponse, time: '' }],
      after: [],
    },
  }
}
