import { useState } from 'react'
import iconAgentsPurple from '../../assets/icon-agents-purple.svg'
import { Icon } from '../Icon/Icon'
import type { CallAiSummaryProps } from './CallAiSummary.types'

export const DEFAULT_CALL_AI_SUMMARY = [
  'Caller reported a severe headache they believe is a migraine.',
  'Agent confirmed the pain is general head pain, not dental or jaw-related.',
  'Patient record was found and the caller was guided toward next steps for care.',
]

export function CallAiSummary({ bullets = DEFAULT_CALL_AI_SUMMARY, className = 'mt-lg' }: CallAiSummaryProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className={`ai-summary-panel ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-xs text-left"
      >
        <span
          className="ai-gradient-icon size-4 shrink-0"
          style={{
            WebkitMaskImage: `url("${iconAgentsPurple}")`,
            maskImage: `url("${iconAgentsPurple}")`,
          }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-body text-text-primary">AI summary</span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={20}
          className="shrink-0 text-text-icon"
        />
      </button>
      {open && (
        <ul className="mt-sm flex flex-col gap-xs">
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-sm text-small text-text-secondary">
              <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-text-tertiary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
