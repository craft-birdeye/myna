import { Icon } from '../Icon/Icon'

interface KnowledgeItem {
  id: string
  title: string
  meta: string
  glyph: 'file' | 'link'
}

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  { id: 'brand-voice', title: 'Brand voice guide', meta: 'Updated last week', glyph: 'file' },
  { id: 'templates', title: 'Review response templates', meta: 'Updated 3 weeks ago', glyph: 'file' },
  { id: 'escalation', title: 'Escalation & refund policy', meta: 'Updated 2 months ago', glyph: 'file' },
  { id: 'competitor', title: 'Competitor comparison sheet', meta: 'Google Doc · shared', glyph: 'link' },
]

/** Create agent CTA (agent list view) flow only — the Knowledge tab. Read-only mock of the
 *  account's knowledge docs; nothing here is specific to the draft agent. */
export function GhostwriterKnowledgeTab() {
  return (
    <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto bg-surface px-2xl py-xl">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-lg">
        <div className="flex items-center justify-between gap-md">
          <p className="m-0 text-body text-text-secondary">
            What this agent knows about your practice. Practice-wide by default, with per-location overrides where they exist.
          </p>
          <button
            type="button"
            className="flex h-9 shrink-0 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
          >
            <Icon name="add" size={18} />
            Add knowledge
          </button>
        </div>

        <div className="rounded-sm border border-border bg-surface">
          {KNOWLEDGE_ITEMS.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-md px-lg py-md ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-md">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon">
                  <Icon name={item.glyph === 'link' ? 'link' : 'description'} size={20} />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-body text-text-primary">{item.title}</p>
                  <p className="m-0 text-small text-text-tertiary">{item.meta}</p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-sm px-md py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
