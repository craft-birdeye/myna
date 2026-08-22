import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { HELP_GLOSSARY, type HelpGlossaryItem } from './HelpCenterPanel.types'

export interface GlossaryModalProps {
  open: boolean
  onClose: () => void
  /** Optional term id to select when opening. */
  initialTermId?: string
}

/**
 * Glossary popup — Figma Agent ARC `15988:11969`.
 * Left rail: search + categorized terms. Right pane: definition, visual, example.
 */
export function GlossaryModal({ open, onClose, initialTermId }: GlossaryModalProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(HELP_GLOSSARY[0]?.id ?? '')

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedId(initialTermId && HELP_GLOSSARY.some((t) => t.id === initialTermId)
      ? initialTermId
      : HELP_GLOSSARY[0]?.id ?? '')
  }, [open, initialTermId])

  const q = query.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      HELP_GLOSSARY.filter(
        (t) =>
          !q ||
          t.term.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      ),
    [q],
  )

  const categories = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, HelpGlossaryItem[]>()
    for (const term of filtered) {
      if (!map.has(term.category)) {
        map.set(term.category, [])
        order.push(term.category)
      }
      map.get(term.category)!.push(term)
    }
    return order.map((name) => ({ name, terms: map.get(name)! }))
  }, [filtered])

  const selected =
    filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? HELP_GLOSSARY[0]

  useEffect(() => {
    if (!open || filtered.length === 0) return
    if (!filtered.some((t) => t.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [open, filtered, selectedId])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[72px]"
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-modal-title"
        className="relative flex h-[calc(100vh-96px)] w-full max-w-[1200px] overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-2xl top-2xl z-10 flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={20} />
        </button>

        {/* Left rail */}
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-border">
          <header className="shrink-0 px-xl pt-2xl">
            <div className="flex h-9 items-center gap-sm">
              <button
                type="button"
                aria-label="Back"
                onClick={onClose}
                className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="arrow_back" size={20} />
              </button>
              <h2
                id="glossary-modal-title"
                className="m-0 min-w-0 flex-1 truncate text-[16px] leading-[22px] tracking-[-0.32px] text-text-primary"
              >
                Glossary
              </h2>
            </div>

            <label className="mt-lg flex h-10 items-center gap-sm rounded-md border border-border-input bg-surface-icon px-md">
              <Icon name="search" size={16} className="shrink-0 text-text-icon" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </label>
          </header>

          <div className="mt-md min-h-0 flex-1 overflow-auto px-xl pb-xl [scrollbar-gutter:stable]">
            {categories.length === 0 ? (
              <p className="py-2xl text-center text-body text-text-tertiary">
                No terms match your search.
              </p>
            ) : (
              categories.map((cat) => (
                <div key={cat.name} className="mb-sm">
                  <p className="m-0 pb-sm pt-md text-small text-text-secondary">{cat.name}</p>
                  <ul className="m-0 flex list-none flex-col gap-0 p-0">
                    {cat.terms.map((term) => {
                      const isSelected = term.id === selected?.id
                      return (
                        <li key={term.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(term.id)}
                            className={`flex w-full items-center gap-sm rounded-md px-md py-md text-left transition-colors ${
                              isSelected
                                ? 'border border-border bg-surface-icon'
                                : 'border border-transparent hover:bg-surface-hover'
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block text-body ${
                                  isSelected ? 'text-primary' : 'text-text-primary'
                                }`}
                              >
                                {term.term}
                              </span>
                              <span className="mt-xs block line-clamp-1 text-small text-text-secondary">
                                {term.summary}
                              </span>
                            </span>
                            <Icon
                              name="chevron_right"
                              size={16}
                              className="shrink-0 text-text-secondary"
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Detail pane */}
        <div className="min-w-0 flex-1 overflow-auto p-2xl pr-3xl [scrollbar-gutter:stable]">
          {selected ? (
            <>
              <h3 className="m-0 text-h3 text-text-primary">{selected.term}</h3>

              <section className="mt-xl">
                <h4 className="m-0 text-small text-text-secondary">Definition</h4>
                <p className="m-0 mt-sm whitespace-pre-line text-body text-text-primary">
                  {selected.definition}
                </p>
              </section>

              <section className="mt-xl">
                <h4 className="m-0 text-small text-text-secondary">Visual example</h4>
                <div className="relative mt-sm flex h-[280px] items-center justify-center overflow-hidden rounded-md bg-surface-icon">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #c8cdd8 1px, transparent 1px)',
                      backgroundSize: '12px 12px',
                    }}
                    aria-hidden
                  />
                  <div className="relative z-[1] h-[220px] w-[min(510px,85%)] overflow-hidden rounded-md border border-border bg-surface shadow-dropdown">
                    <div className="flex h-full flex-col gap-sm p-md">
                      <div className="h-2 w-2/5 rounded-sm bg-surface-l2" />
                      <div className="h-2 w-3/5 rounded-sm bg-surface-l2" />
                      <div className="mt-sm flex flex-1 flex-col gap-xs rounded-sm border border-border bg-surface-selected p-sm">
                        <div className="h-2 w-1/3 rounded-sm bg-surface-l2" />
                        <div className="h-2 w-full rounded-sm bg-surface-l2" />
                        <div className="h-2 w-4/5 rounded-sm bg-surface-l2" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="m-0 mt-md text-small text-text-secondary">{selected.visualCaption}</p>
              </section>

              {selected.example.trim() ? (
                <section className="mt-xl">
                  <h4 className="m-0 text-small text-text-secondary">Example</h4>
                  <div className="mt-sm rounded-md border border-border bg-surface-icon px-lg py-lg">
                    <p className="m-0 whitespace-pre-line text-body text-text-primary">
                      {selected.example}
                    </p>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
