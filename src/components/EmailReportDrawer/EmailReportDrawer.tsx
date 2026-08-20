import { useEffect, useState } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { ConfigureEmailFields } from './ConfigureEmailFields'
import type { EmailReportDrawerProps } from './EmailReportDrawer.types'

/** Right-side drawer for emailing a report — Recipients/Subject/Body, functionally matching
 *  the product's existing "Email report" config (recipients as removable name chips) but built
 *  from this app's own tokens rather than copying that screen's visuals. */
export function EmailReportDrawer({
  open,
  title = 'Email report',
  initialRecipients = [],
  initialSubject = '',
  initialBody = '',
  onClose,
  onSend,
}: EmailReportDrawerProps) {
  const [recipients, setRecipients] = useState<string[]>(initialRecipients)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)

  useEffect(() => {
    if (open) {
      setRecipients(initialRecipients)
      setSubject(initialSubject)
      setBody(initialBody)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSend = recipients.length > 0 && subject.trim().length > 0

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
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
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{title}</h2>
          </div>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => canSend && onSend({ recipients, subject, body })}
            className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
              canSend ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Send
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-lg overflow-y-auto px-2xl pb-2xl">
          <ConfigureEmailFields
            recipients={recipients}
            onRecipientsChange={setRecipients}
            subject={subject}
            onSubjectChange={setSubject}
            body={body}
            onBodyChange={setBody}
          />
        </div>
      </aside>
    </div>
  )
}
