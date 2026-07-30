import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import type { ProcedureSidePanelProps } from './ProcedureSidePanel.types'

const CHIP_PATTERN = /\{\{([^}]+)\}\}/g

/** Splits a bullet's text on `{{token}}` markers and renders each one as a read-only chip —
 *  matching how the Procedure library shows inline variable/tool references within a step. */
function renderBulletText(text: string) {
  const parts = text.split(CHIP_PATTERN)
  // String.split with a capturing group interleaves the captured token between the surrounding
  // plain-text pieces, so odd indices are always the chip labels.
  return parts.map((part, i) =>
    i % 2 === 1 ? <RefChip key={i} kind="tool" label={part} /> : <span key={i}>{part}</span>,
  )
}

/** Read-only slide-in panel showing a procedure's full steps — opened from a "Procedure
 *  updated/created" block in the recommendation chat, matching the Procedure library's own
 *  when-to-use + numbered-steps + when-to-exit layout (view-only — nothing here is editable). */
export function ProcedureSidePanel({ open, title, whenToUse, steps, exitCriteria, onClose }: ProcedureSidePanelProps) {
  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[560px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
          <h2 className="min-w-0 truncate text-h3 text-text-primary">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2xl py-xl">
          {whenToUse && (
            <div className="mb-xl flex flex-col gap-xs">
              <p className="text-small text-text-secondary">When to use this procedure?</p>
              <p className="text-body text-text-primary">{whenToUse}</p>
            </div>
          )}

          <div className="mb-xl flex flex-col gap-sm">
            <p className="text-small text-text-secondary">Steps</p>
            <div className="flex flex-col gap-lg rounded-sm border border-border p-lg">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col gap-sm">
                  <p className="text-body text-text-primary">
                    {i + 1}. {step.title}
                  </p>
                  <ul className="flex flex-col gap-xs pl-lg">
                    {step.bullets.map((bullet, j) => {
                      const added = step.addedBullets?.includes(bullet)
                      return (
                        <li
                          key={j}
                          className={`list-disc text-body marker:text-text-tertiary ${
                            added ? 'text-green-700' : 'text-text-secondary'
                          }`}
                        >
                          {renderBulletText(bullet)}
                        </li>
                      )
                    })}
                    {step.removedBullets?.map((bullet, j) => (
                      <li key={`removed-${j}`} className="list-disc text-body text-red-700 marker:text-text-tertiary">
                        <span className="line-through">{renderBulletText(bullet)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {exitCriteria && (
            <div className="flex flex-col gap-xs">
              <p className="text-small text-text-secondary">When to exit this procedure?</p>
              <p className="text-body text-text-primary">{exitCriteria}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
