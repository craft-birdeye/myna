import { Icon, MetricTiles, Chip, LibraryCardIcon } from '../../components'
import { SUPER_AGENT_ACTIVE_AGENTS, SUPER_AGENT_PAUSED_AGENTS, type SuperAgentMyAgent } from './superAgentSeedData'

// Native "My agents" screen for the Super agent L1 module — reuses the exact header
// chrome from AgentDetailScreen (sticky `bg-surface px-2xl py-xl` header, CLAUDE.md
// §6.7 primary/secondary button classes). Full width, `px-2xl` on both sides. Only
// this module's L2 pages are native — "Create agent" still opens the prototype
// iframe. No Activity/Reports tabs — a single list is the whole screen.
export interface SuperAgentMyAgentsScreenProps {
  /** Opens the agent's full AgentScreen (Chat/Workflow/Approvals/...) inside the
   *  prototype iframe — `id` must be one of the prototype's own `app.agents` ids. */
  onOpenAgent: (id: string) => void
}

function AgentCard({ agent, onOpenAgent }: { agent: SuperAgentMyAgent; onOpenAgent: (id: string) => void }) {
  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-col gap-md p-xl">
        <div className="flex items-start gap-md">
          <LibraryCardIcon glyph={agent.glyph} size="sm" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-sm">
              <h3 className="text-body text-text-primary">{agent.name}</h3>
              {agent.fromLibrary && <Chip label="From the library" variant="neutral" />}
              {agent.waitingOnYou && <Chip label={agent.waitingOnYou} variant="warning" />}
            </div>
            <p className="mt-xs text-body text-text-secondary">{agent.description}</p>
            <div className="mt-sm flex items-center gap-xs text-small text-text-tertiary">
              <span
                className={`size-1.5 rounded-full ${agent.status === 'running' ? 'bg-chip-success-text' : 'bg-text-tertiary'}`}
                aria-hidden
              />
              {agent.status === 'running' ? 'Running' : 'Paused'} · last activity {agent.lastActivity}
            </div>
          </div>
        </div>

        {agent.alert && (
          <div className="flex items-center gap-xs rounded-sm bg-chip-warning-bg px-md py-sm text-body text-chip-warning-text">
            <Icon name="warning" size={18} />
            {agent.alert}
          </div>
        )}

        <MetricTiles metrics={agent.metrics} />
      </div>

      <div className="flex items-center justify-between border-t border-border px-xl py-md">
        <span className="text-small text-text-tertiary">Last run {agent.lastRun}</span>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
          >
            {agent.status === 'running' ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={() => onOpenAgent(agent.id)}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Open agent
          </button>
        </div>
      </div>
    </div>
  )
}

export function SuperAgentMyAgentsScreen({ onOpenAgent }: SuperAgentMyAgentsScreenProps) {
  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <div>
          <h1 className="text-h3 text-text-primary">My agents</h1>
          <p className="mt-xs text-body text-text-secondary">
            See what your AI team is handling and where your attention is needed.
          </p>
        </div>
        <button
          type="button"
          className="flex h-9 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          <Icon name="add" size={18} />
          Add an agent
        </button>
      </div>

      <div className="flex flex-col gap-lg px-2xl py-lg">
        <div className="text-small text-text-tertiary">ACTIVE&nbsp;&nbsp;{SUPER_AGENT_ACTIVE_AGENTS.length}</div>
        {SUPER_AGENT_ACTIVE_AGENTS.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onOpenAgent={onOpenAgent} />
        ))}

        {SUPER_AGENT_PAUSED_AGENTS.length > 0 && (
          <>
            <div className="mt-md text-small text-text-tertiary">PAUSED&nbsp;&nbsp;{SUPER_AGENT_PAUSED_AGENTS.length}</div>
            {SUPER_AGENT_PAUSED_AGENTS.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onOpenAgent={onOpenAgent} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
