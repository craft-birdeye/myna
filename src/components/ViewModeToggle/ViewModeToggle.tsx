import { Tooltip } from '../Tooltip/Tooltip'
import { NounForms, ViewMode, ViewModeToggleProps } from './ViewModeToggle.types'

// A conversation is the full back-and-forth thread with a patient, possibly spanning multiple
// visits over time. A session is just one exchange within that thread — from an agent's first
// message to that agent's resolution. Every page that offers this toggle is written generically
// against whichever noun is currently selected; only the label (and, where noted, the volume)
// changes, not the underlying story.
export const NOUN_FORMS: Record<ViewMode, NounForms> = {
  conversations: { capPlural: 'Conversations', capSingular: 'Conversation', lowPlural: 'conversations', lowSingular: 'conversation' },
  sessions:      { capPlural: 'Sessions',      capSingular: 'Session',      lowPlural: 'sessions',      lowSingular: 'session' },
}

const VIEW_MODE_TOOLTIPS: Record<ViewMode, string> = {
  sessions: "One exchange within a conversation — from an agent's first message to that agent's resolution.",
  conversations: 'The full back-and-forth thread with a patient, which can span multiple visits over time.',
}

// A conversation can hold more than one session, so session counts run higher than conversation
// counts for the same underlying volume — this is the shared multiplier every page uses to keep
// that relationship consistent wherever a raw count needs to scale with the toggle.
const SESSIONS_PER_CONVERSATION = 1.35

export function scaleForViewMode(value: number, mode: ViewMode): number {
  return mode === 'sessions' ? Math.round(value * SESSIONS_PER_CONVERSATION) : value
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface p-[2px]">
      {(['sessions', 'conversations'] as const).map((mode) => (
        <Tooltip key={mode} content={VIEW_MODE_TOOLTIPS[mode]} variant="detail">
          <button
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-sm px-md py-xs text-body capitalize transition-colors ${
              value === mode ? 'bg-surface-selected text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {mode}
          </button>
        </Tooltip>
      ))}
    </div>
  )
}
