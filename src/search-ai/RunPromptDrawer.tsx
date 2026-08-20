import { useMemo, useState } from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'

interface RunPromptDrawerProps {
  open: boolean
  /** Past prompts (most recent first) — surfaced as suggestions while typing. */
  history: string[]
  onClose: () => void
  onRun: (prompt: string) => void
}

/** "Run new prompt" drawer — a freeform prompt input with history-based suggestions below it.
 *  Not built on `FormDrawer` because its field types only let you pick from a fixed list; this
 *  field needs to stay freely typable while still surfacing past prompts. Shell matches
 *  `EmailReportDrawer`/`ScheduleReportDrawer`. */
export function RunPromptDrawer({ open, history, onClose, onRun }: RunPromptDrawerProps) {
  const [prompt, setPrompt] = useState('')
  const [focused, setFocused] = useState(false)

  const suggestions = useMemo(() => {
    const q = prompt.trim().toLowerCase()
    const uniqueHistory = Array.from(new Set(history))
    const matches = q ? uniqueHistory.filter((h) => h.toLowerCase().includes(q) && h.toLowerCase() !== q) : uniqueHistory
    return matches.slice(0, 5)
  }, [prompt, history])

  function reset() {
    setPrompt('')
    setFocused(false)
  }

  const canRun = prompt.trim().length > 0

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={() => { onClose(); reset() }}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={() => { onClose(); reset() }}
              className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Run new prompt</h2>
          </div>
          <button
            type="button"
            disabled={!canRun}
            onClick={() => {
              if (!canRun) return
              onRun(prompt.trim())
              reset()
            }}
            className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
              canRun ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Run
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-xs px-2xl pb-2xl">
          <label className="text-small text-text-primary">User prompt</label>
          <div className="relative">
            <input
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="e.g. How much do dental implants cost in Austin?"
              className="h-[34px] w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
            />
            {focused && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                <p className="px-md py-xs text-small text-text-secondary">Suggestions from history</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setPrompt(s); setFocused(false) }}
                    className="block w-full truncate px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
