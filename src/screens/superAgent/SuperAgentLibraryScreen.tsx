import { useEffect, useMemo, useState } from 'react'
import { HeaderSearchField, InfoCard, Tabs, type Tab } from '../../components'
import {
  isLibraryAgentVisibleForRole,
  SUPER_AGENT_LIBRARY_AGENTS,
  type SuperAgentPillar,
  type SuperAgentRole,
} from './superAgentSeedData'
import jayIcon from '@icons/Jay.svg'
import mynaIcon from '@icons/Myna.svg'
import robinIcon from '@icons/Robin.svg'

// Native "Library" screen for the Super agent L1 module — same sticky
// `bg-surface px-2xl py-xl` header as My agents/AgentDetailScreen, full-width grid
// (no `mx-auto`/`max-w` cap like the prototype's own version), and `InfoCard` (the
// shared library-grid card) instead of the prototype's own card markup. All 19 of the
// prototype's own library agents are here (ported from LIB_AGENTS). The pillar tab bar
// (All/Jay/Myna/Robin) is the only categorization dimension now — the old
// "Recommended for you / Get found / ..." category chip row was dropped in favor of it,
// so a `recommended` agent just sorts first within whichever tab it's in.
export interface SuperAgentLibraryScreenProps {
  /** Hands off to the prototype's own `app.useLibAgent(key)` — drafts (or reopens)
   *  the agent and opens its full AgentScreen. */
  onUseAgent: (key: string) => void
  /** Gates which library agents are visible for the current user. */
  activeRole: SuperAgentRole
}

// Same pillar tab bar as My agents (SuperAgentMyAgentsScreen) — same `Tabs` usage, same
// jay/myna/robin icons — but keyed by `SuperAgentLibraryAgent`'s own `pillar` field
// (this screen still sources from SUPER_AGENT_LIBRARY_AGENTS, not agentDirectoryData's
// persona model), so no My-agents-style persona mapping is needed.
type PillarTabId = SuperAgentPillar | 'all'

const PILLAR_TAB_ORDER: PillarTabId[] = ['all', 'jay', 'myna', 'robin']
const PILLAR_NAME: Record<SuperAgentPillar, string> = { jay: 'Jay', myna: 'Myna', robin: 'Robin' }
const PILLAR_ICON: Record<SuperAgentPillar, string> = { jay: jayIcon, myna: mynaIcon, robin: robinIcon }

export function SuperAgentLibraryScreen({ onUseAgent, activeRole }: SuperAgentLibraryScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Executive (all 3 pillars) keeps the "All" tab and an actual tab bar; Manager/IC
  // roles (a single pillar) skip straight to their one pillar with no tab bar at all —
  // a one-item tab bar is redundant chrome (same rule as My agents).
  const isExecutive = activeRole.pillars.length > 1
  const defaultTab: PillarTabId = isExecutive ? 'all' : (activeRole.pillars[0] ?? 'all')
  const [activeTab, setActiveTab] = useState<PillarTabId>(defaultTab)

  useEffect(() => {
    if (activeTab !== 'all' && !activeRole.pillars.includes(activeTab as SuperAgentPillar)) {
      setActiveTab(defaultTab)
    } else if (activeTab === 'all' && !isExecutive) {
      setActiveTab(defaultTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole])

  const roleVisibleAgents = useMemo(
    () => SUPER_AGENT_LIBRARY_AGENTS.filter((a) => isLibraryAgentVisibleForRole(a, activeRole)),
    [activeRole],
  )
  const visibleAgents = useMemo(
    () => (activeTab === 'all' ? roleVisibleAgents : roleVisibleAgents.filter((a) => a.pillar === activeTab)),
    [roleVisibleAgents, activeTab],
  )

  const tabs: Tab[] = (isExecutive
    ? PILLAR_TAB_ORDER
    : PILLAR_TAB_ORDER.filter((id): id is SuperAgentPillar => id !== 'all' && activeRole.pillars.includes(id))
  ).map((id) => ({
    id,
    label: id === 'all' ? 'All' : PILLAR_NAME[id],
    icon: id === 'all' ? undefined : <img src={PILLAR_ICON[id]} alt="" className="size-4 shrink-0 rounded-full" />,
  }))

  const q = query.trim().toLowerCase()
  const sortedAgents = useMemo(
    () => [...visibleAgents].sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended))),
    [visibleAgents],
  )
  const results = q
    ? sortedAgents.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      )
    : sortedAgents

  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <div>
          <h1 className="text-h3 text-text-primary">Library</h1>
          <p className="mt-xs text-body text-text-secondary">
            Prebuilt agents that can take work off your team&rsquo;s plate.
          </p>
        </div>
        <HeaderSearchField open={searchOpen} value={query} onOpenChange={setSearchOpen} onChange={setQuery} />
      </div>

      {isExecutive && (
        <div className="px-2xl pt-lg">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as PillarTabId)} showBaseline={false} />
        </div>
      )}

      {q && (
        <div className="px-2xl pt-lg text-body text-text-tertiary">
          {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
        </div>
      )}

      <div className="grid grid-cols-1 gap-lg px-2xl py-lg sm:grid-cols-2 lg:grid-cols-3">
        {results.map((agent) => (
          <InfoCard
            key={agent.key}
            glyph={agent.glyph}
            title={agent.name}
            description={agent.description}
            actionLabel="Use agent"
            onAction={() => onUseAgent(agent.key)}
          />
        ))}
      </div>
    </div>
  )
}
