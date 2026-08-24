import { Chip, DataTable, EmptyState, Icon, type Column } from '../components'
import { AiAgentIcon } from '../assets/AiAgentIcon'
import { computeImpact, formatRecommendationDate, recommendationAgeMinutes, RECOMMENDATIONS, type Recommendation } from '../data/recommendationsData'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'
import { useRecommendationOverridesStore } from '../data/RecommendationOverridesStoreContext'

interface RecommendationsTabProps {
  agentName: string
  onSelect: (id: string) => void
  /** A Draft instance hasn't handled any real conversations yet, so there's nothing to base a
   *  recommendation on — show an empty state instead of the (agent-wide) recommendation list. */
  isDraft?: boolean
  /** Force the empty state (e.g. review agents that don't surface recommendations yet). */
  empty?: boolean
}

/** Row shape rendered by the table — adds a sortable numeric age alongside the raw `timeAgo`
 *  string, so the Date column (and the default order) can sort chronologically instead of
 *  alphabetically sorting strings like "15m ago" vs "2h ago". */
type RecommendationRow = Recommendation & { ageMinutes: number }

const COLUMNS: Column<RecommendationRow>[] = [
  {
    key: 'title',
    label: 'Recommendation',
    width: 440,
    minWidth: 280,
    render: (_, rec) => (
      <div className="flex min-w-0 flex-col gap-xs py-xs">
        <p className="truncate text-body text-text-primary group-hover/row:text-text-action">{rec.title}</p>
        <p className="line-clamp-1 text-small text-text-secondary group-hover/row:text-text-action">{rec.summary}</p>
      </div>
    ),
  },
  {
    key: 'gapType',
    label: 'From',
    width: 200,
    sortable: true,
    render: (_, rec) => (
      <span className="inline-flex items-center gap-xs text-small text-text-secondary">
        {rec.source === 'feedback' ? (
          <Icon name="thumb_down" size={16} className="shrink-0 text-chip-danger-text" />
        ) : (
          <AiAgentIcon size={14} className="shrink-0" />
        )}
        {rec.source === 'feedback' ? (rec.reportedBy ?? 'Human feedback') : 'Myna'}
      </span>
    ),
  },
  {
    key: 'ageMinutes',
    label: 'Date',
    width: 140,
    sortable: true,
    render: (_, rec) => <span className="text-small text-text-secondary">{formatRecommendationDate(rec.timeAgo)}</span>,
  },
  {
    key: 'conversationCount',
    label: 'Conversations affected',
    width: 180,
    sortable: true,
    render: (_, rec) => <span className="text-small text-text-secondary">{rec.conversationCount}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    render: (_, rec) => (
      <Chip
        label={rec.status === 'accepted' ? 'Accepted' : rec.status === 'rejected' ? 'Rejected' : 'Open'}
        variant={rec.status === 'accepted' ? 'success' : rec.status === 'rejected' ? 'danger' : 'info'}
      />
    ),
  },
]

export function RecommendationsTab({ agentName, onSelect, isDraft = false, empty = false }: RecommendationsTabProps) {
  const { feedbackRecommendations } = useFeedbackRecommendationsStore()
  const { overrides } = useRecommendationOverridesStore()
  const feedbackForAgent = feedbackRecommendations.filter((rec) => rec.agentName === agentName)
  const combined = [...RECOMMENDATIONS, ...feedbackForAgent]
  const maxConversationCount = Math.max(0, ...combined.map((rec) => rec.conversationCount))
  const data: RecommendationRow[] = combined
    .map((rec) => ({
      ...rec,
      priority: computeImpact(rec.conversationCount, maxConversationCount),
      status: overrides[rec.id]?.status ?? 'open',
      ageMinutes: recommendationAgeMinutes(rec.timeAgo),
    }))
    // Default order: most recent first — the table's own column sort takes over once a header is clicked.
    .sort((a, b) => a.ageMinutes - b.ageMinutes)

  if (isDraft || empty) {
    return (
      <div className="flex h-full items-center justify-center px-lg py-lg">
        <EmptyState
          title="No recommendations yet"
          description={
            isDraft
              ? "This agent is still in draft and hasn't handled any conversations yet, so there's nothing to base a recommendation on."
              : 'Recommendations will appear here as this agent runs and finds opportunities to improve.'
          }
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
