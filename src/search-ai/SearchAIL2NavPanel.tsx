import { SideNav } from '../components'
import type { NavSection } from '../components'
import { SEARCH_AI_L2_KEY_RECOMMENDATIONS, SEARCH_AI_L2_KEY_TRACK_PROGRESS } from './searchAIL2Keys'

/**
 * Maps the compound key format used by SearchAIView (e.g. "Actions/Recommendations")
 * to/from the flat id format used by myna-main SideNav (e.g. "searchai-recommendations").
 */

const SECTIONS: NavSection[] = [
  {
    id: 'actions',
    label: 'Actions',
    items: [
      { id: 'searchai-recommendations', label: 'Recommendations' },
      { id: 'searchai-track-progress',  label: 'Track progress'  },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'searchai-citations',   label: 'Citations'   },
      { id: 'searchai-visibility',  label: 'Visibility'  },
      { id: 'searchai-rankings',    label: 'Rankings'    },
      { id: 'searchai-accuracy',    label: 'Accuracy'    },
      { id: 'searchai-sentiment',   label: 'Sentiment'   },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    items: [
      { id: 'searchai-monitor',     label: 'Monitor'     },
      { id: 'searchai-performance', label: 'Performance' },
      { id: 'searchai-builder',     label: 'Builder'     },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { id: 'searchai-prompts',     label: 'Prompts'     },
      { id: 'searchai-locations',   label: 'Locations'   },
      { id: 'searchai-competitors', label: 'Competitors' },
    ],
  },
]

/** flat id → compound key used by SearchAIView */
function toL2Key(id: string): string {
  if (id === 'searchai-recommendations') return SEARCH_AI_L2_KEY_RECOMMENDATIONS
  if (id === 'searchai-track-progress')  return SEARCH_AI_L2_KEY_TRACK_PROGRESS
  return id
}

/** compound key → flat id */
function fromL2Key(key: string): string {
  if (key === SEARCH_AI_L2_KEY_RECOMMENDATIONS) return 'searchai-recommendations'
  if (key === SEARCH_AI_L2_KEY_TRACK_PROGRESS)  return 'searchai-track-progress'
  return key
}

export interface SearchAIL2NavPanelProps {
  activeItem: string         // compound key, e.g. "Actions/Recommendations"
  onActiveItemChange: (key: string) => void
}

export function SearchAIL2NavPanel({ activeItem, onActiveItemChange }: SearchAIL2NavPanelProps) {
  return (
    <SideNav
      title="Search AI"
      sections={SECTIONS}
      activeId={fromL2Key(activeItem)}
      onSelect={(id) => onActiveItemChange(toL2Key(id))}
    />
  )
}
