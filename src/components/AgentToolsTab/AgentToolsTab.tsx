import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { Icon } from '../Icon/Icon'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'
import type { AgentToolsTabProps, AgentToolsVariant } from './AgentToolsTab.types'

type ToolKind = 'internal' | 'external'

interface CatalogTool {
  id: string
  name: string
  description: string
  kind: ToolKind
  glyph: string
  glyphClassName?: string
}

const TOOLS_TABS: Tab[] = [
  { id: 'internal', label: 'Internal tools' },
  { id: 'external', label: 'External tools' },
]

const EXTERNAL_TOOLS: CatalogTool[] = [
  { id: 'salesforce', name: 'Salesforce', description: 'Salesforce', kind: 'external', glyph: 'cloud', glyphClassName: 'bg-[#e6f4fd] text-[#00a1e0]' },
  { id: 'freshdesk', name: 'Freshdesk', description: 'FreshDesk', kind: 'external', glyph: 'support_agent', glyphClassName: 'bg-[#e7f9ea] text-[#25c16f]' },
  { id: 'quickbooks', name: 'QuickBooks Online', description: 'QuickBooks Online', kind: 'external', glyph: 'account_balance', glyphClassName: 'bg-[#e6f6e6] text-[#2ca01c]' },
  { id: 'servicetitan', name: 'ServiceTitan', description: 'ServiceTitan', kind: 'external', glyph: 'plumbing', glyphClassName: 'bg-[#fdeee6] text-[#e8571b]' },
  { id: 'zendesk', name: 'Zendesk', description: 'Zendesk', kind: 'external', glyph: 'confirmation_number', glyphClassName: 'bg-[#e9e9e9] text-[#03363d]' },
]

const REVIEW_INTERNAL: CatalogTool[] = [
  { id: 'update-contact-preferences', name: 'Update contact preferences', description: 'Updates permissions on a contact record', kind: 'internal', glyph: 'build' },
  { id: 'handle-response', name: 'Handle response', description: 'Decide what the agent will do with the response composed for a review — have a human in the loop or post it directly.', kind: 'internal', glyph: 'build' },
  { id: 'select-template', name: 'Select template', description: 'Choose which templates can be used as review responses', kind: 'internal', glyph: 'build' },
  { id: 'add-contact-to-list', name: 'Add contact to list', description: 'Adds a contact to a selected list', kind: 'internal', glyph: 'build' },
  { id: 'remove-contact-from-list', name: 'Remove contact from list', description: 'Removes a contact from a selected list', kind: 'internal', glyph: 'build' },
  { id: 'send-internal-alert', name: 'Send internal alert', description: 'Notifies your team through an email of an event that needs attention', kind: 'internal', glyph: 'build' },
  { id: 'assign-tags', name: 'Assign tags', description: 'Add tags to a review', kind: 'internal', glyph: 'build' },
  { id: 'classify-tags', name: 'Classify tags', description: 'Manage review tags and their descriptions', kind: 'internal', glyph: 'build' },
]

const FRONTDESK_INTERNAL: CatalogTool[] = [
  { id: 'update-contact-preferences', name: 'Update contact preferences', description: 'Updates permissions on a contact record', kind: 'internal', glyph: 'build' },
  { id: 'escalate-to-human', name: 'Escalate to human', description: 'Decide whether to hand off a call or chat to a person, or resolve it directly.', kind: 'internal', glyph: 'build' },
  { id: 'select-message-template', name: 'Select message template', description: 'Choose which templates can be used for follow-up messages.', kind: 'internal', glyph: 'build' },
  { id: 'add-contact-to-list', name: 'Add contact to list', description: 'Adds a contact to a selected list', kind: 'internal', glyph: 'build' },
  { id: 'remove-contact-from-list', name: 'Remove contact from list', description: 'Removes a contact from a selected list', kind: 'internal', glyph: 'build' },
  { id: 'send-internal-alert', name: 'Send internal alert', description: 'Notifies your team through an email of an event that needs attention', kind: 'internal', glyph: 'build' },
  { id: 'assign-tags', name: 'Assign tags', description: 'Add tags to a call or chat', kind: 'internal', glyph: 'build' },
  { id: 'classify-tags', name: 'Classify tags', description: 'Manage tags and their descriptions', kind: 'internal', glyph: 'build' },
  { id: 'check-business-hours', name: 'Check business hours', description: 'Checks whether the business is open before scheduling or transferring', kind: 'internal', glyph: 'build' },
]

const CATALOG: Record<AgentToolsVariant, CatalogTool[]> = {
  review: [...REVIEW_INTERNAL, ...EXTERNAL_TOOLS],
  frontdesk: [...FRONTDESK_INTERNAL, ...EXTERNAL_TOOLS],
}

/** Five already-connected tools: three internal, two external. */
const INITIAL_CONNECTED: Record<AgentToolsVariant, string[]> = {
  review: ['update-contact-preferences', 'handle-response', 'select-template', 'salesforce', 'freshdesk'],
  frontdesk: ['update-contact-preferences', 'escalate-to-human', 'select-message-template', 'salesforce', 'freshdesk'],
}

function ToolGlyph({ tool }: { tool: CatalogTool }) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
        tool.glyphClassName ?? 'bg-surface-l2 text-text-icon'
      }`}
    >
      <Icon name={tool.glyph} size={18} />
    </span>
  )
}

function ToolCard({
  tool,
  onSelect,
  showConnect,
}: {
  tool: CatalogTool
  onSelect?: () => void
  showConnect?: boolean
}) {
  const body = (
    <>
      <ToolGlyph tool={tool} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-body text-text-primary">{tool.name}</p>
        <p className="m-0 mt-xs text-small text-text-secondary">{tool.description}</p>
      </div>
      {showConnect && <span className="shrink-0 text-body text-text-action">Connect</span>}
    </>
  )

  const className = 'flex w-full items-center gap-md rounded-md border border-border bg-surface px-lg py-md text-left'

  if (!onSelect) {
    return <div className={className}>{body}</div>
  }

  return (
    <button type="button" onClick={onSelect} className={`${className} transition-colors hover:bg-surface-hover`}>
      {body}
    </button>
  )
}

function AddToolPanel({
  catalog,
  onClose,
  onAdd,
}: {
  catalog: CatalogTool[]
  onClose: () => void
  onAdd: (id: string) => void
}) {
  const [tab, setTab] = useState<'internal' | 'external'>('internal')
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const needle = query.trim().toLowerCase()
  const visible = catalog.filter((tool) => {
    if (tool.kind !== tab) return false
    if (!needle) return true
    return tool.name.toLowerCase().includes(needle) || tool.description.toLowerCase().includes(needle)
  })

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Add a tool"
        className="absolute right-2 top-2 flex h-[calc(100%-16px)] w-[560px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal"
      >
        <div className="flex shrink-0 items-center gap-sm px-2xl pb-lg pt-2xl">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <h2 className="m-0 text-h3 text-text-primary">Add a tool</h2>
        </div>

        <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto px-2xl pb-2xl">
          <label className="flex h-9 items-center gap-sm rounded-md border border-border-input bg-surface px-md">
            <Icon name="search" size={18} className="shrink-0 text-text-icon" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </label>

          <Tabs tabs={TOOLS_TABS} activeTab={tab} onChange={(id) => setTab(id as 'internal' | 'external')} />

          {tab === 'internal' && (
            <span className="flex w-fit items-center gap-xs text-body text-text-action">
              All tools
              <Icon name="expand_more" size={18} />
            </span>
          )}

          <div className="flex flex-col gap-md">
            {visible.length === 0 ? (
              <p className="m-0 text-body text-text-secondary">No tools match your search.</p>
            ) : (
              visible.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  showConnect={tool.kind === 'external'}
                  onSelect={() => onAdd(tool.id)}
                />
              ))
            )}
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

/** Tools tab: a Connected tools section (five mixed internal and external tools) and an Add
 *  button that opens the catalog side panel. */
export function AgentToolsTab({ variant }: AgentToolsTabProps) {
  const catalog = CATALOG[variant]
  const [connectedIds, setConnectedIds] = useState<string[]>(INITIAL_CONNECTED[variant])
  const [addOpen, setAddOpen] = useState(false)

  const connected = catalog.filter((tool) => connectedIds.includes(tool.id))

  function addTool(id: string) {
    setConnectedIds((current) => (current.includes(id) ? current : [...current, id]))
  }

  return (
    <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto bg-surface px-2xl py-xl">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-lg">
        <div>
          <h1 className="m-0 text-h3 text-text-primary">Tools</h1>
          <p className="m-0 mt-xs text-small text-text-secondary">What this agent can read from and act on.</p>
        </div>

        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 text-h3 text-text-primary">Connected tools</h2>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex h-9 shrink-0 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
            >
              <Icon name="add" size={18} />
              Add
            </button>
          </div>

          <div className="flex flex-col gap-md">
            {connected.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>

      {addOpen && (
        <AddToolPanel catalog={catalog} onClose={() => setAddOpen(false)} onAdd={addTool} />
      )}
    </div>
  )
}
