import { useEffect, useMemo, useState } from 'react'
import { Icon, MetricTiles, Tabs, type Metric, type Tab } from '../../components'
import { getAgentDirectory, type AgentDirectoryEntry, type AgentPersonaId } from '../../data/agentDirectoryData'
import { AgentDetailScreen, getAgentInstanceStatusCounts } from '../AgentDetailScreen'
import { isDirectoryAgentVisibleForRole, PILLAR_TO_PERSONA, type SuperAgentRole } from './superAgentSeedData'
import jayIcon from '@icons/Jay.svg'
import mynaIcon from '@icons/Myna.svg'
import robinIcon from '@icons/Robin.svg'

// "My agents" — now the single landing screen for the Agents (formerly Super agent) module.
// Sources from `agentDirectoryData.ts` instead of `superAgentSeedData.ts`: that data already
// carries real persona tagging (Jay/Myna/Robin), running-instance counts, alerts, and outcome
// metrics, and is the same data already powering `OverviewV2_1Screen`'s "Purchased co-worker"
// grid and `AgentDetailScreen`. Library/Knowledge/Connections are untouched and still use
// `superAgentSeedData.ts`.
type PillarTabId = AgentPersonaId | 'all'

const PILLAR_TAB_ORDER: PillarTabId[] = ['all', 'marketing', 'operations', 'cx']
const PILLAR_NAME: Record<AgentPersonaId, string> = { marketing: 'Jay', operations: 'Myna', cx: 'Robin' }
const PILLAR_ICON: Record<AgentPersonaId, string> = { marketing: jayIcon, operations: mynaIcon, cx: robinIcon }

export interface SuperAgentMyAgentsScreenProps {
  /** Current dashboard product — same as `AgentDirectoryScreen`'s own `product` prop. */
  product: string
  /** navId -> full display name (App.tsx's own `AGENT_NAMES`), used so the embedded
   *  `AgentDetailScreen` gets the exact display name its internal logic branches on
   *  instead of `agentDirectoryData`'s shorter directory-card name. Falls back to the
   *  directory entry's own `name` when a navId has no bespoke mapping. */
  agentNames: Record<string, string>
  /** Gates which pillar tabs and agent cards are visible for the current user. */
  activeRole: SuperAgentRole
}

// 16,230 -> "16.2K"; short values pass through untouched. Copied from AgentDirectoryScreen /
// OverviewV2_1Screen's own `formatAgentOutcome`.
function formatAgentOutcome(raw: string): string {
  const numeric = parseFloat(raw.replace(/,/g, ''))
  if (!isNaN(numeric) && numeric >= 1000) return `${parseFloat((numeric / 1000).toFixed(1))}K`
  return raw
}

function AgentMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-h3 text-text-primary">{value}</div>
      <div className="truncate text-small text-text-tertiary">{label}</div>
    </div>
  )
}

// Forked from `OverviewV2_1Screen`'s `AgentPerformanceCard` (same card shape: name, issue-count
// badge, active/inactive chip, description, 3-metric row) — kept as an independent copy rather
// than a cross-import, per that file's own fork-don't-import convention. Drag-reorder/editing is
// dropped since this grid isn't customizable.
function MyAgentsGroupCard({
  agent,
  displayName,
  onOpen,
}: {
  agent: AgentDirectoryEntry
  /** Exact display name `AgentDetailScreen`'s drill-in resolves for this agent (falls back
   *  to `agent.name` when there's no navId — see `SuperAgentMyAgentsScreenProps.agentNames`). */
  displayName: string
  onOpen?: () => void
}) {
  const issueCount = agent.alert ? parseInt(agent.alert.message, 10) : undefined
  const clickable = Boolean(onOpen)
  // Derive the badge from the same region data the drill-in view renders, rather than
  // trusting `agent.running` to independently agree with it. Agents with no navId have no
  // drill-in to match against, so `running` is the only number available for those.
  const activeCount = agent.navId ? getAgentInstanceStatusCounts(displayName, agent.navId).active : agent.running

  return (
    <div
      className={`flex flex-col rounded-md border border-border bg-surface p-xl transition-colors ${
        clickable ? 'cursor-pointer hover:border-border-selected hover:bg-surface-hover' : ''
      }`}
      onClick={clickable ? onOpen : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpen?.()
              }
            }
          : undefined
      }
    >
      <div className="mb-xs flex items-center justify-between gap-sm">
        <h4 className="m-0 min-w-0 truncate text-body text-text-primary">{agent.name}</h4>
        <div className="flex shrink-0 items-center gap-xs">
          {issueCount && (
            <span className="flex items-center gap-xs text-small text-text-secondary">
              <Icon name="error" size={14} className="text-chip-danger-text" />
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
          {activeCount > 0 ? (
            <span className="rounded-sm bg-chip-success-bg px-sm py-xs text-small text-chip-success-text">
              {activeCount} active
            </span>
          ) : (
            <span className="rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text">Inactive</span>
          )}
        </div>
      </div>
      <p className="m-0 mb-lg line-clamp-2 min-h-[36px] text-small text-text-tertiary">{agent.description}</p>
      <div className="mt-auto grid grid-cols-3 gap-md">
        <AgentMetric value={formatAgentOutcome(agent.outcome.value)} label={agent.outcome.label} />
        <AgentMetric value={agent.timeSaved} label="Time saved" />
        <AgentMetric value={agent.costSaved} label="Cost saved" />
      </div>
    </div>
  )
}

export function SuperAgentMyAgentsScreen({ product, agentNames, activeRole }: SuperAgentMyAgentsScreenProps) {
  const visiblePersonas = useMemo(
    () => activeRole.pillars.map((pillar) => PILLAR_TO_PERSONA[pillar]),
    [activeRole],
  )
  // Executive (all 3 pillars) keeps the "All" tab; IC/Manager roles only see their own
  // pillar tab(s), so default straight into the one visible pillar instead of "All".
  const isExecutive = visiblePersonas.length > 1
  const defaultTab: PillarTabId = isExecutive ? 'all' : (visiblePersonas[0] ?? 'all')

  const [activeTab, setActiveTab] = useState<PillarTabId>(defaultTab)
  const [selectedAgentNavId, setSelectedAgentNavId] = useState<string | null>(null)

  // Reset the active tab whenever the role changes to a set of pillars that no longer
  // includes the currently-selected tab (e.g. switching from Executive to an IC role).
  useEffect(() => {
    if (activeTab !== 'all' && !visiblePersonas.includes(activeTab as AgentPersonaId)) {
      setActiveTab(defaultTab)
    } else if (activeTab === 'all' && !isExecutive) {
      setActiveTab(defaultTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole])

  const agentDirectory = useMemo(
    () => getAgentDirectory(product).filter((a) => isDirectoryAgentVisibleForRole(a, activeRole)),
    [product, activeRole],
  )

  // Defensive: if a role switch makes the currently drilled-in agent invisible, fall
  // back to the grid rather than rendering a drill-in the role shouldn't see.
  useEffect(() => {
    if (selectedAgentNavId && !agentDirectory.some((a) => a.navId === selectedAgentNavId)) {
      setSelectedAgentNavId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentDirectory])

  if (selectedAgentNavId) {
    const agent = agentDirectory.find((a) => a.navId === selectedAgentNavId)
    const displayName = agentNames[selectedAgentNavId] ?? agent?.name ?? selectedAgentNavId

    return (
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <AgentDetailScreen
          key={selectedAgentNavId}
          agentName={displayName}
          titleOverride={displayName.endsWith('s') ? displayName : `${displayName}s`}
          navId={selectedAgentNavId}
          product={product}
          onBack={() => setSelectedAgentNavId(null)}
          hideTabsRow
          hideCreateButton
        />
      </div>
    )
  }

  const visibleTabOrder: PillarTabId[] = isExecutive
    ? PILLAR_TAB_ORDER
    : PILLAR_TAB_ORDER.filter((id): id is AgentPersonaId => id !== 'all' && visiblePersonas.includes(id))

  const tabs: Tab[] = visibleTabOrder.map((id) => ({
    id,
    label: id === 'all' ? 'All' : PILLAR_NAME[id],
    icon: id === 'all' ? undefined : <img src={PILLAR_ICON[id]} alt="" className="size-4 shrink-0 rounded-full" />,
  }))

  const filteredAgents = activeTab === 'all' ? agentDirectory : agentDirectory.filter((a) => a.persona === activeTab)

  // Each card is a *group* — e.g. "Review response agent" fans out into several per-region
  // instances underneath it (the same drill-in list `MyAgentsGroupCard`'s badge counts from).
  // The top tiles must count those individual instances, not the group cards themselves, so
  // they line up with what the badges below add up to.
  const instanceCounts = filteredAgents.map((agent) => {
    const displayName = (agent.navId && agentNames[agent.navId]) || agent.name
    // No navId means no drill-in instance list exists for this group — treat the card as a
    // single instance (active if `running > 0`, otherwise the one paused/inactive instance).
    if (!agent.navId) return { total: 1, active: agent.running > 0 ? 1 : 0 }
    return getAgentInstanceStatusCounts(displayName, agent.navId)
  })

  // Tile 1 = total individual agent instances visible in the current tab/filter, regardless
  // of status. Tile 2 = the subset of those instances currently active — a genuinely
  // different, smaller count, not a relabeled duplicate of Tile 1.
  const totalAgentsCount = instanceCounts.reduce((sum, c) => sum + c.total, 0)
  const runningCount = instanceCounts.reduce((sum, c) => sum + c.active, 0)
  const totalHours = filteredAgents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0)
  const totalCostK = filteredAgents.reduce((sum, a) => sum + parseFloat(a.costSaved.replace(/[$K]/g, '')), 0)

  const summaryMetrics: Metric[] = [
    { id: 'total-agents', value: String(totalAgentsCount), label: 'Total agents' },
    { id: 'agents-running', value: String(runningCount), label: 'Agents running' },
    { id: 'time-saved', value: `${totalHours.toFixed(1)}h`, label: 'Time saved' },
    { id: 'cost-saved', value: `$${totalCostK.toFixed(1)}K`, label: 'Cost saved' },
  ]

  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      <div className="sticky top-0 z-10 bg-surface px-2xl py-xl">
        <h1 className="text-h3 text-text-primary">My agents</h1>
        <p className="mt-xs text-body text-text-secondary">
          See what your AI team is handling and where your attention is needed.
        </p>
      </div>

      <div className="flex flex-col gap-xl px-2xl py-lg">
        {isExecutive && (
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as PillarTabId)} showBaseline={false} />
        )}

        <MetricTiles metrics={summaryMetrics} />

        {filteredAgents.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-body text-text-tertiary">
            No agents in this pillar yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <MyAgentsGroupCard
                key={agent.id}
                agent={agent}
                displayName={(agent.navId && agentNames[agent.navId]) || agent.name}
                onOpen={agent.navId ? () => setSelectedAgentNavId(agent.navId!) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
