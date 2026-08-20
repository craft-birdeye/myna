import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { ConfigureEmailFields } from '../EmailReportDrawer/ConfigureEmailFields'
import type { ScheduleReportDrawerProps } from './ScheduleReportDrawer.types'

const FREQUENCY_OPTIONS = ['daily', 'weekly', 'monthly']
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_OPTIONS = ['6:00am', '7:00am', '8:00am', '9:00am', '12:00pm', '5:00pm']

function InlineSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <span className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-sm bg-transparent py-0.5 pl-1 pr-5 text-body text-text-action outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-4 text-text-action" strokeWidth={1.6} absoluteStrokeWidth />
    </span>
  )
}

/** Right-side drawer for scheduling a recurring report — Frequency (send/on/at) plus the same
 *  "Configure email" fields as `EmailReportDrawer`. */
export function ScheduleReportDrawer({
  open,
  title = 'Schedule report',
  initialFrequency = 'weekly',
  initialDay = 'Monday',
  initialTime = '8:00am',
  initialRecipients = [],
  initialSubject = '',
  initialBody = '',
  onClose,
  onCreateSchedule,
}: ScheduleReportDrawerProps) {
  const [frequency, setFrequency] = useState(initialFrequency)
  const [day, setDay] = useState(initialDay)
  const [time, setTime] = useState(initialTime)
  const [recipients, setRecipients] = useState<string[]>(initialRecipients)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)

  useEffect(() => {
    if (open) {
      setFrequency(initialFrequency)
      setDay(initialDay)
      setTime(initialTime)
      setRecipients(initialRecipients)
      setSubject(initialSubject)
      setBody(initialBody)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSubmit = recipients.length > 0 && subject.trim().length > 0

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
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => canSubmit && onCreateSchedule({ frequency, day, time, recipients, subject, body })}
              className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
                canSubmit ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              Create Schedule
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-lg overflow-y-auto px-2xl pb-2xl">
          <div className="flex flex-col gap-xs">
            <p className="text-body text-text-primary">Frequency</p>
            <div className="flex flex-wrap items-center gap-xs text-body text-text-primary">
              <span>Send</span>
              <InlineSelect value={frequency} options={FREQUENCY_OPTIONS} onChange={setFrequency} />
              <span>on</span>
              <InlineSelect value={day} options={DAY_OPTIONS} onChange={setDay} />
              <span>at</span>
              <InlineSelect value={time} options={TIME_OPTIONS} onChange={setTime} />
            </div>
          </div>

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
