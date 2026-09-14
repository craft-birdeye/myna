import { useState } from 'react'
import { HeaderSearchField, InfoCard } from '../../components'
import { SUPER_AGENT_LIBRARY_AGENTS, SUPER_AGENT_LIBRARY_CATEGORIES } from './superAgentSeedData'

// Native "Library" screen for the Super agent L1 module — same sticky
// `bg-surface px-2xl py-xl` header as My agents/AgentDetailScreen, full-width grid
// (no `mx-auto`/`max-w` cap like the prototype's own version), left-aligned category
// pills, and `InfoCard` (the shared library-grid card) instead of the prototype's own
// card markup. All 19 of the prototype's own library agents are here (ported from
// LIB_AGENTS), grouped into its 7 real categories — not a hand-picked subset.
export interface SuperAgentLibraryScreenProps {
  /** Hands off to the prototype's own `app.useLibAgent(key)` — drafts (or reopens)
   *  the agent and opens its full AgentScreen. */
  onUseAgent: (key: string) => void
}

export function SuperAgentLibraryScreen({ onUseAgent }: SuperAgentLibraryScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof SUPER_AGENT_LIBRARY_CATEGORIES)[number]['key']>('recommended')

  const q = query.trim().toLowerCase()
  const results = q
    ? SUPER_AGENT_LIBRARY_AGENTS.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      )
    : category === 'recommended'
      ? SUPER_AGENT_LIBRARY_AGENTS.filter((a) => a.recommended)
      : SUPER_AGENT_LIBRARY_AGENTS.filter((a) => a.category === category)

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

      {!q && (
        <div className="quiet-scroll flex gap-sm overflow-x-auto px-2xl pt-lg">
          {SUPER_AGENT_LIBRARY_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-sm px-lg text-body transition-colors ${
                category === c.key
                  ? 'bg-surface-selected text-text-primary'
                  : 'border border-border-selected bg-surface text-text-secondary hover:bg-surface-l2'
              }`}
            >
              {c.label}
            </button>
          ))}
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
