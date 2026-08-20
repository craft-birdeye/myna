import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { Chip } from '../Chip/Chip'
import type { ChipVariant } from '../Chip/Chip.types'
import type { FanoutQueryDetailPanelProps } from './FanoutQueryDetailPanel.types'

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Completed: 'success',
  Running: 'info',
  Failed: 'danger',
}

/** Read-only "input" look (bordered box, not just label+text) for detail fields. */
function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <p className="text-small text-text-secondary">{label}</p>
      <div className="min-h-[34px] w-full rounded-md border border-border-input bg-surface-subtle px-md py-sm text-body text-text-primary">
        {children}
      </div>
    </div>
  )
}

/** Standalone slide-in detail drawer for a Fanout queries row — copies the overlay/slide-in shell
 *  from `ProcedureSidePanel` and the back-arrow + "more actions" dropdown header from
 *  `ProcedureDetailScreen`. Neither of those files is modified. */
export function FanoutQueryDetailPanel({
  open,
  prompt,
  fanoutQueries,
  status,
  updatedBy,
  updatedOn,
  onClose,
  onDownload,
  onEmail,
  onSchedule,
  onDelete,
}: FanoutQueryDetailPanelProps) {
  const [actionsOpen, setActionsOpen] = useState(false)

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
          <div className="flex min-w-0 items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md text-text-icon transition-colors hover:bg-surface-hover"
            >
              <BackArrowIcon color="#555" />
            </button>
            <h2 className="min-w-0 truncate text-h3 text-text-primary">Fanout query run</h2>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={actionsOpen}
              onClick={() => setActionsOpen((o) => !o)}
              className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon transition-colors hover:bg-surface-l2"
            >
              <MoreVertical className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            {actionsOpen && (
              <>
                <div className="fixed inset-0 z-[105]" onClick={() => setActionsOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                  <button
                    type="button"
                    className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    onClick={() => { setActionsOpen(false); onDownload?.() }}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    onClick={() => { setActionsOpen(false); onEmail?.() }}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    onClick={() => { setActionsOpen(false); onSchedule?.() }}
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
                    onClick={() => { setActionsOpen(false); onDelete?.() }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2xl py-xl">
          <div className="mb-xl">
            <ReadOnlyField label="User prompt">{prompt}</ReadOnlyField>
          </div>

          <div className="mb-xl grid grid-cols-3 gap-lg">
            <ReadOnlyField label="Status">
              <Chip label={status} variant={STATUS_VARIANT[status] ?? 'neutral'} />
            </ReadOnlyField>
            <ReadOnlyField label="Updated by">{updatedBy}</ReadOnlyField>
            <ReadOnlyField label="Updated on">{updatedOn}</ReadOnlyField>
          </div>

          <div className="flex flex-col gap-sm">
            <p className="text-small text-text-secondary">Fanout queries ({fanoutQueries.length})</p>
            <div className="flex flex-wrap gap-xs rounded-sm border border-border p-lg">
              {fanoutQueries.map((q, i) => (
                <span
                  key={`${q}-${i}`}
                  className="inline-flex shrink-0 items-center gap-xs whitespace-nowrap rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
