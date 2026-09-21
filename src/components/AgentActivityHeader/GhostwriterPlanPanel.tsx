import { useEffect, useRef, useState } from 'react'
import { PLAN_CARD } from '../../data/ghostwriterReadingBlock'
import {
  PLAN_PANEL_COPY,
  PLAN_PANEL_HINT,
  PLAN_SECTION_PREFIX,
  PLAN_SECTIONS,
} from '../../data/ghostwriterPlan'

interface PlanNote {
  /** Line the note hangs off. */
  lineId: string
  /** The line, or the phrase the user highlighted within it. */
  quote: string
  text: string
  /** Set once "Revise plan" has folded it into the line. */
  folded: boolean
}

/** What the popover is currently attached to. */
interface NoteDraft {
  lineId: string
  quote: string
}

/** Idle → a note is waiting (amber) → the note has replaced the line (green). */
type LineState = 'idle' | 'draft' | 'pending' | 'revised'

const LINE_TINT: Record<LineState, string> = {
  idle: '',
  draft: 'bg-[#fff8e6]',
  pending: 'bg-[#fdf3d4]',
  revised: 'bg-[#eaf8ee]',
}

export interface GhostwriterPlanPanelProps {
  onClose: () => void
}

/**
 * Right-side plan review panel. Two ways to annotate, per the design: click a line to note
 * the whole line, or drag-select a phrase within one to note just that phrase. A noted line
 * sits on an amber tint while the note waits; "Revise plan" then rewrites the line — the
 * note's own words take the line's place on a green tint, and the note card retires, since
 * its text is now the plan. Verbatim substitution: there's no model here to paraphrase.
 */
export function GhostwriterPlanPanel({ onClose }: GhostwriterPlanPanelProps) {
  const [notes, setNotes] = useState<PlanNote[]>([])
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const [draftText, setDraftText] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  const waiting = notes.filter((n) => !n.folded)
  const folded = notes.filter((n) => n.folded)

  useEffect(() => {
    if (!draft) return undefined
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) closeDraft()
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDraft()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const closeDraft = () => {
    setDraft(null)
    setDraftText('')
  }

  /** Click = whole line; a live text selection inside the line = just that phrase. */
  const openDraftFor = (line: { id: string; text: string }) => {
    const selected = window.getSelection?.()?.toString().trim() ?? ''
    const quote = selected && line.text.includes(selected) ? selected : line.text
    setDraft({ lineId: line.id, quote })
    setDraftText('')
  }

  const addNote = () => {
    if (!draft || !draftText.trim()) return
    setNotes((prev) => [...prev, { lineId: draft.lineId, quote: draft.quote, text: draftText.trim(), folded: false }])
    closeDraft()
  }

  const revise = () => setNotes((prev) => prev.map((n) => ({ ...n, folded: true })))

  const notesFor = (lineId: string) => notes.filter((n) => n.lineId === lineId)

  const footerLabel = waiting.length
    ? `${waiting.length} note${waiting.length > 1 ? 's' : ''} waiting`
    : folded.length
      ? `${folded.length} line${folded.length > 1 ? 's' : ''} revised`
      : PLAN_PANEL_COPY.emptyNotes

  return (
    <aside className="gw-flow__in relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      {/* Header */}
      <div className="flex shrink-0 items-start gap-sm border-b border-border px-lg py-md">
        <span className="mt-[2px] flex size-5 shrink-0 items-center justify-center text-[#7c3aed]" aria-hidden>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>description</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-sm">
            <span className="text-h3 text-text-primary">{PLAN_CARD.title}</span>
            <span className="rounded-sm bg-[#e8f1fc] px-sm py-[2px] text-small text-text-action">
              {PLAN_CARD.badge}
            </span>
          </div>
          <p className="m-0 mt-xs text-small text-text-tertiary">{PLAN_CARD.meta}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close plan"
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>close</span>
        </button>
      </div>

      <p className="m-0 shrink-0 border-b border-border bg-surface-l2 px-lg py-sm text-small text-text-secondary">
        {PLAN_PANEL_HINT}
      </p>

      {/* Sections — numbered, generously spaced, hairline-separated so seven of them still scan. */}
      <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-lg py-xl">
        <div className="flex flex-col">
          {PLAN_SECTIONS.map((section, sectionIndex) => (
            <section
              key={section.n}
              className={`flex flex-col gap-md ${
                sectionIndex ? 'mt-3xl border-t border-border pt-3xl' : ''
              }`}
            >
              <div className="flex flex-col gap-xs">
                <span className="text-small uppercase tracking-[0.06em] text-text-tertiary">
                  {PLAN_SECTION_PREFIX} {section.n}
                </span>
                <h3 className="m-0 text-h3 text-text-primary">{section.title}</h3>
                {section.caption && (
                  <p className="m-0 text-small text-text-tertiary">{section.caption}</p>
                )}
              </div>

              <div className="flex flex-col gap-xs">
                {section.lines.map((line) => {
                  const lineNotes = notesFor(line.id)
                  const pending = lineNotes.filter((n) => !n.folded)
                  const revised = lineNotes.filter((n) => n.folded)
                  /* Once revised, the note's wording *is* the line. */
                  const displayText = revised.length
                    ? revised.map((n) => n.text).join(' ')
                    : line.text
                  const state: LineState = revised.length
                    ? 'revised'
                    : pending.length
                      ? 'pending'
                      : draft?.lineId === line.id
                        ? 'draft'
                        : 'idle'

                  return (
                    <div key={line.id} className="flex flex-col gap-xs">
                      <button
                        type="button"
                        onClick={() => openDraftFor(line)}
                        className={`gw-plan-line group flex w-full items-start gap-sm rounded-sm px-sm py-xs text-left transition-colors ${
                          state === 'idle' ? '' : `gw-plan-line--tinted ${LINE_TINT[state]}`
                        }`}
                      >
                        {line.kind === 'bullet' && (
                          <span
                            className={`mt-[8px] size-[4px] shrink-0 rounded-full ${
                              state === 'revised' ? 'bg-[#15803d]' : 'bg-text-tertiary'
                            }`}
                            aria-hidden
                          />
                        )}
                        <span
                          className={`min-w-0 flex-1 text-body ${
                            state === 'revised'
                              ? 'text-[#15803d]'
                              : line.kind === 'lead'
                                ? 'text-text-primary'
                                : 'text-text-secondary'
                          }`}
                        >
                          {displayText}
                        </span>
                      </button>

                      {/* Only notes still waiting show a card — folded ones became the line. */}
                      {pending.map((note, i) => (
                        <div
                          key={`${note.lineId}-${i}`}
                          className="gw-flow__in ml-md flex items-start gap-sm rounded-sm border border-[#e8d9a8] bg-[#fffdf5] px-md py-sm"
                        >
                          <span className="mt-[2px] shrink-0">
                            <span
                              className="material-symbols-outlined text-[#a98426]"
                              style={{ fontSize: 15 }}
                              aria-hidden
                            >
                              chat_bubble
                            </span>
                          </span>
                          <p className="m-0 min-w-0 flex-1 text-small text-text-secondary">{note.text}</p>
                          <button
                            type="button"
                            aria-label="Remove note"
                            onClick={() => setNotes((prev) => prev.filter((n) => n !== note))}
                            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between gap-md border-t border-border px-lg py-md">
        <span className="text-small text-text-tertiary">{footerLabel}</span>
        <button
          type="button"
          disabled={!waiting.length}
          onClick={revise}
          className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
            waiting.length
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
          }`}
        >
          {PLAN_PANEL_COPY.revise}
        </button>
      </div>

      {/* Note popover — centred over the panel so it never clips at the edges. */}
      {draft && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 px-lg">
          <div
            ref={popoverRef}
            className="gw-flow__in flex w-full max-w-[380px] flex-col gap-md rounded-lg border border-border bg-surface p-lg shadow-modal"
          >
            <p className="m-0 border-l-2 border-[#d9a13b] pl-md text-small text-text-tertiary">
              {draft.quote}
            </p>
            <textarea
              autoFocus
              rows={3}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addNote()
                }
              }}
              placeholder={PLAN_PANEL_COPY.notePrompt}
              className="scrollbar-light w-full resize-none rounded-sm border border-border px-md py-sm text-body text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary"
            />
            <div className="flex items-center justify-end gap-md">
              <button
                type="button"
                onClick={closeDraft}
                className="rounded-sm px-md py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
              >
                {PLAN_PANEL_COPY.noteCancel}
              </button>
              <button
                type="button"
                disabled={!draftText.trim()}
                onClick={addNote}
                className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                  draftText.trim()
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                }`}
              >
                {PLAN_PANEL_COPY.noteAdd}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
