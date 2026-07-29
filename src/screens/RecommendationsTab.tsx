import { Chip, DataTable, EmptyState, Icon, type Column } from '../components'
import { computeImpact, PRIORITY_VARIANT, RECOMMENDATIONS, sortRecommendations, type Recommendation } from '../data/recommendationsData'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'
import { useRecommendationOverridesStore } from '../data/RecommendationOverridesStoreContext'

interface RecommendationsTabProps {
  agentName: string
  onSelect: (id: string) => void
  /** A Draft instance hasn't handled any real conversations yet, so there's nothing to base a
   *  recommendation on — show an empty state instead of the (agent-wide) recommendation list. */
  isDraft?: boolean
}

const COLUMNS: Column<Recommendation>[] = [
  {
    key: 'title',
    label: 'Recommendation',
    width: 440,
    minWidth: 280,
    render: (_, rec) => (
      <div className="flex min-w-0 flex-col gap-xs py-xs">
        <p className="truncate text-body text-text-primary">{rec.title}</p>
        <p className="line-clamp-1 text-small text-text-secondary">{rec.summary}</p>
      </div>
    ),
  },
  {
    key: 'gapType',
    label: 'Type',
    width: 200,
    render: (_, rec) => (
      <span className="inline-flex items-center gap-xs text-small text-text-secondary">
        {rec.source === 'feedback' ? (
          <Icon name="thumb_down" size={16} className="shrink-0 text-chip-danger-text" />
        ) : (
          <Icon name="auto_awesome" size={16} className="shrink-0 text-ai-brand" />
        )}
        {rec.source === 'feedback' ? 'Human feedback' : 'AI recommended'}
      </span>
    ),
  },
  {
    key: 'priority',
    label: 'Impact',
    width: 130,
    render: (_, rec) => <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    render: (_, rec) => (
      <Chip
        label={rec.status === 'accepted' ? 'Accepted' : rec.status === 'rejected' ? 'Rejected' : 'Open'}
        variant={rec.status === 'accepted' ? 'success' : rec.status === 'rejected' ? 'danger' : 'info'}
      />
    ),
  },
  {
    key: 'conversationCount',
    label: 'Conversation is affected',
    width: 180,
    sortable: true,
    render: (_, rec) => <span className="text-small text-text-secondary">{rec.conversationCount}</span>,
  },
]

export function RecommendationsTab({ agentName, onSelect, isDraft = false }: RecommendationsTabProps) {
  const { feedbackRecommendations } = useFeedbackRecommendationsStore()
  const { overrides } = useRecommendationOverridesStore()
  const feedbackForAgent = feedbackRecommendations.filter((rec) => rec.agentName === agentName)
  const combined = [...RECOMMENDATIONS, ...feedbackForAgent]
  const maxConversationCount = Math.max(0, ...combined.map((rec) => rec.conversationCount))
  const data = sortRecommendations(
    combined.map((rec) => ({ ...rec, priority: computeImpact(rec.conversationCount, maxConversationCount) })),
  ).map((rec) => ({
    ...rec,
    status: overrides[rec.id]?.status ?? 'open',
  }))

  if (isDraft) {
    return (
      <div className="flex h-full items-center justify-center px-lg py-lg">
        <EmptyState
          title="No recommendations yet"
          description="This agent is still in draft and hasn't handled any conversations yet, so there's nothing to base a recommendation on."
        />
      </div>
    )
  }

  return (
    <div className="px-lg py-lg">
      <DataTable
        columns={COLUMNS}
        data={data}
        rowHeight={64}
        onRowClick={(rec) => onSelect(rec.id)}
        scrollOnHover
      />
    </div>
  )
}
