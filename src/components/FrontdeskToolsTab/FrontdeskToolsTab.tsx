import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'

interface ToolCard {
  id: string
  name: string
  description: string
  glyph: string
  glyphClassName?: string
}

const TOOLS_TABS: Tab[] = [
  { id: 'internal', label: 'Internal tools' },
  { id: 'external', label: 'External tools' },
]

const INTERNAL_TOOLS: ToolCard[] = [
  { id: 'update-contact-preferences', name: 'Update contact preferences', description: 'Updates permissions on a contact record', glyph: 'build' },
  { id: 'escalate-to-human', name: 'Escalate to human', description: 'Decide whether to hand off a call or chat to a person, or resolve it directly.', glyph: 'build' },
  { id: 'select-message-template', name: 'Select message template', description: 'Choose which templates can be used for follow-up messages.', glyph: 'build' },
  { id: 'add-contact-to-list', name: 'Add contact to list', description: 'Adds a contact to a selected list', glyph: 'build' },
  { id: 'remove-contact-from-list', name: 'Remove contact from list', description: 'Removes a contact from a selected list', glyph: 'build' },
  { id: 'send-internal-alert', name: 'Send internal alert', description: 'Notifies your team through an email of an event that needs attention', glyph: 'build' },
  { id: 'assign-tags', name: 'Assign tags', description: 'Add tags to a call or chat', glyph: 'build' },
  { id: 'classify-tags', name: 'Classify tags', description: 'Manage tags and their descriptions', glyph: 'build' },
  { id: 'check-business-hours', name: 'Check business hours', description: 'Checks whether the business is open before scheduling or transferring', glyph: 'build' },
]

const EXTERNAL_TOOLS: ToolCard[] = [
  { id: 'salesforce', name: 'Salesforce', description: 'Sync contact and appointment records with Salesforce.', glyph: 'cloud', glyphClassName: 'bg-[#e6f4fd] text-[#00a1e0]' },
  { id: 'freshdesk', name: 'Freshdesk', description: 'Create and manage support tickets in Freshdesk.', glyph: 'support_agent', glyphClassName: 'bg-[#e7f9ea] text-[#25c16f]' },
  { id: 'quickbooks', name: 'QuickBooks Online', description: 'Sync invoices and payments with QuickBooks Online.', glyph: 'account_balance', glyphClassName: 'bg-[#e6f6e6] text-[#2ca01c]' },
  { id: 'servicetitan', name: 'ServiceTitan', description: 'Sync appointments and job records with ServiceTitan.', glyph: 'plumbing', glyphClassName: 'bg-[#fdeee6] text-[#e8571b]' },
  { id: 'zendesk', name: 'Zendesk', description: 'Create and manage support tickets in Zendesk.', glyph: 'confirmation_number', glyphClassName: 'bg-[#e9e9e9] text-[#03363d]' },
]

/** Front desk (Sep 23) only — the Tools tab. Two sub-`Tabs` (Internal/External) over a 3-column
 *  card grid instead of Myna's `GhostwriterConnectionsTab` full-width rows; every internal tool
 *  shares the same wrench glyph (matching the reference design) while external integrations get
 *  a brand-tinted circle, same `glyphClassName` trick `GhostwriterConnectionsTab`'s reach cards
 *  use. "All tools" is a static label — there's only one category today, so a real dropdown
 *  would have nothing to filter. */
export function FrontdeskToolsTab() {
  const [tab, setTab] = useState<'internal' | 'external'>('internal')
  const tools = tab === 'internal' ? INTERNAL_TOOLS : EXTERNAL_TOOLS

  return (
    <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto bg-surface px-2xl py-xl">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-lg">
        <div>
          <h1 className="m-0 text-h3 text-text-primary">Tools</h1>
          <p className="m-0 mt-xs text-small text-text-secondary">What this agent can read from and act on.</p>
        </div>

        <Tabs tabs={TOOLS_TABS} activeTab={tab} onChange={(id) => setTab(id as 'internal' | 'external')} />

        {tab === 'internal' && (
          <span className="flex w-fit items-center gap-xs text-body text-text-action">
            All tools
            <Icon name="expand_more" size={18} />
          </span>
        )}

        <div className="grid grid-cols-3 gap-md">
          {tools.map((tool) => (
            <div key={tool.id} className="flex flex-col gap-md rounded-sm border border-border bg-surface p-lg">
              <div className="flex items-center justify-between gap-sm">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    tool.glyphClassName ?? 'bg-surface-l2 text-text-icon'
                  }`}
                >
                  <Icon name={tool.glyph} size={18} />
                </span>
                {tab === 'external' && (
                  <button type="button" className="text-body text-text-action hover:underline">
                    Connect
                  </button>
                )}
              </div>
              <div>
                <p className="m-0 text-body text-text-primary">{tool.name}</p>
                <p className="m-0 mt-xs text-small text-text-secondary">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
