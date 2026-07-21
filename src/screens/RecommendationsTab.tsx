import { Chip, DataTable, Icon, type Column } from '../components'
import {
  GAP_ICON,
  GAP_LABEL,
  getRecommendationTypes,
  PRIORITY_VARIANT,
  RECOMMENDATIONS,
  sortRecommendations,
  type Recommendation,
} from '../data/recommendationsData'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'

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
      <div className="flex items-start gap-sm py-xs">
        {rec.source === 'feedback' ? (
          <Icon name="thumb_down" size={16} className="mt-0.5 shrink-0 text-chip-danger-text" />
        ) : (
          <Icon name="auto_awesome" size={16} className="mt-0.5 shrink-0 text-ai-brand" />
        )}
        <div className="min-w-0">
          <p className="truncate text-body text-text-primary">{rec.title}</p>
          <p className="line-clamp-1 text-small text-text-secondary">{rec.summary}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'gapType',
    label: 'Type',
    width: 280,
    render: (_, rec) => (
      <div className="flex flex-wrap items-center gap-x-md gap-y-[2px]">
        {getRecommendationTypes(rec).map((t) => (
          <span key={t} className="inline-flex items-center gap-xs text-small text-text-secondary">
            <Icon name={GAP_ICON[t]} size={14} className="text-text-icon" />
            {GAP_LABEL[t]}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: 'priority',
    label: 'Priority',
    width: 130,
    render: (_, rec) => <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />,
  },
  {
    key: 'conversationCount',
    label: 'Affected',
    width: 140,
    sortable: true,
    render: (_, rec) => (
      <span className="inline-flex items-center gap-xs text-small text-text-tertiary">
        <Icon name="chat_bubble_outline" size={14} />
        {rec.conversationCount} affected
      </span>
    ),
  },
]

export function RecommendationsTab({ agentName, onSelect }: RecommendationsTabProps) {
  const { feedbackRecommendations } = useFeedbackRecommendationsStore()
  const feedbackForAgent = feedbackRecommendations.filter((rec) => rec.agentName === agentName)
  const data = sortRecommendations([...RECOMMENDATIONS, ...feedbackForAgent])

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
