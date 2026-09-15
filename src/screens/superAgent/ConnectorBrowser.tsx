import { useMemo, useState } from 'react'
import { Icon, HeaderSearchField } from '../../components'
import { ChannelGlyph } from './ChannelGlyph'
import { SUPER_AGENT_CONNECTION_LOGOS } from './superAgentConnectionLogos'
import {
  SUPER_AGENT_CONNECTORS,
  SUPER_AGENT_CONNECTOR_CATEGORIES,
  type SuperAgentConnector,
  type SuperAgentConnectorCategoryKey,
} from './superAgentConnectorCatalog'

function ConnectorMark({ item }: { item: SuperAgentConnector }) {
  if (item.channel) {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center">
        <ChannelGlyph kind={item.channel} size={28} />
      </span>
    )
  }
  const logo = item.logoSrc ? SUPER_AGENT_CONNECTION_LOGOS[item.logoSrc] : undefined
  return (
    <span className="flex size-9 shrink-0 items-center justify-center">
      {logo ? <img src={logo} alt="" className="size-7" aria-hidden /> : <Icon name={item.icon ?? 'link'} size={24} className="text-text-icon" />}
    </span>
  )
}

function ConnectorCard({ item, onConnect }: { item: SuperAgentConnector; onConnect: (item: SuperAgentConnector) => void }) {
  return (
    <div className="flex items-center justify-between gap-md rounded-md border border-border px-lg py-md">
      <div className="flex min-w-0 items-center gap-md">
        <ConnectorMark item={item} />
        <div className="min-w-0">
          <h3 className="truncate text-body text-text-primary">{item.name}</h3>
          <p className={`mt-xs truncate text-small ${item.state === 'reconnect' ? 'text-chip-danger-text' : 'text-text-tertiary'}`}>
            {item.detail}
          </p>
        </div>
      </div>
      {item.state === 'connected' ? (
        <span className="flex shrink-0 items-center gap-xs whitespace-nowrap text-small text-chip-success-text">
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          Connected
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onConnect(item)}
          className={
            item.state === 'reconnect'
              ? 'flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover'
              : 'flex h-9 shrink-0 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2'
          }
        >
          {item.state === 'reconnect' ? 'Reconnect' : 'Connect'}
        </button>
      )}
    </div>
  )
}

// Categorized connector browser — replaces the old flat "Data sources" list with a
// category rail + search over real, accurately-branded connectors (see
// superAgentConnectorCatalog.ts). Clicking "Connect" on one of the 4 messaging brands
// (WhatsApp/Slack/iMessage/Telegram) opens the same ChannelConnectModal as the "Reach
// your agents" cards above, since it's the same underlying channel connection.
export function ConnectorBrowser({ onConnectChannel }: { onConnectChannel: (channel: SuperAgentConnector['channel']) => void }) {
  const [category, setCategory] = useState<SuperAgentConnectorCategoryKey | 'all'>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const m = new Map<SuperAgentConnectorCategoryKey, number>()
    for (const c of SUPER_AGENT_CONNECTORS) m.set(c.category, (m.get(c.category) ?? 0) + 1)
    return m
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SUPER_AGENT_CONNECTORS.filter((c) => {
      if (category !== 'all' && c.category !== category) return false
      if (q && !c.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [category, query])

  return (
    <div>
      <div className="flex items-center justify-between gap-md border-b border-border">
        <nav className="flex items-center gap-lg">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`flex h-9 items-center gap-xs border-b-2 -mb-px px-xs text-body transition-colors ${
              category === 'all' ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            All
            <span className="text-small text-text-tertiary">{SUPER_AGENT_CONNECTORS.length}</span>
          </button>
          {SUPER_AGENT_CONNECTOR_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`flex h-9 items-center gap-xs border-b-2 -mb-px px-xs text-body transition-colors ${
                category === cat.key ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
              <span className="text-small text-text-tertiary">{counts.get(cat.key) ?? 0}</span>
            </button>
          ))}
        </nav>
        <HeaderSearchField open={searchOpen} value={query} onOpenChange={setSearchOpen} onChange={setQuery} placeholder="Search connectors" />
      </div>

      <div className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2">
        {filtered.map((item) => (
          <ConnectorCard
            key={item.id}
            item={item}
            onConnect={(it) => {
              if (it.channel) onConnectChannel(it.channel)
            }}
          />
        ))}
        {filtered.length === 0 && <p className="col-span-full py-lg text-body text-text-tertiary">No connectors match your search.</p>}
      </div>
    </div>
  )
}
