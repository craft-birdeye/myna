import { Chip, DataTable, Icon, type Column } from '../components'
import { PRIORITY_VARIANT, RECOMMENDATIONS, sortRecommendations, type Recommendation } from '../data/recommendationsData'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'
import { useRecommendationOverridesStore } from '../data/RecommendationOverridesStoreContext'

interface RecommendationsTabProps {
  agentName: string
  onSelect: (id: string) => void
}

const COLUMNS: Column<Recommendation>[] = [
  {
    key: 'title',
    label: 'Recommendation',
    width: 440,
    minWidth: 280,
    render: (_, rec) => (
      <div className="min-w-0 py-xs">
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
    label: 'Priority',
    width: 130,
    render: (_, rec) => <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    render: (_, rec) => (
      <span className="text-small text-text-secondary">{rec.status === 'accepted' ? 'Accepted' : 'Open'}</span>
    ),
  },
  {
    key: 'conversationCount',
    label: 'Conversation is affected',
    width: 180,
    sortable: true,
    render: (_, rec) => <span className="text-small text-text-tertiary">{rec.conversationCount}</span>,
  },
]

export function RecommendationsTab({ agentName, onSelect }: RecommendationsTabProps) {
  const { feedbackRecommendations, clearAllFeedback } = useFeedbackRecommendationsStore()
  const { overrides } = useRecommendationOverridesStore()
  const feedbackForAgent = feedbackRecommendations.filter((rec) => rec.agentName === agentName)
  const data = sortRecommendations([...RECOMMENDATIONS, ...feedbackForAgent]).map((rec) => ({
    ...rec,
    status: overrides[rec.id]?.status === 'accepted' ? 'accepted' : 'open',
  }))

  return (
    <div className="px-lg py-lg">
      {feedbackRecommendations.length > 0 && (
        <div className="mb-md flex justify-end">
          <button
            type="button"
            onClick={clearAllFeedback}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Clear all human feedback
          </button>
        </div>
      )}
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
