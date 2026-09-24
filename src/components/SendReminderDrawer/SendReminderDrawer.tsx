import { useEffect, useState } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { TEMPLATE_LIST, TemplateSelectField } from '../TemplatePicker/TemplatePicker'
import { SendReminderDrawerProps } from './SendReminderDrawer.types'

export function SendReminderDrawer({ open, patientName, appointmentDate, appointmentTime, onClose, onSend }: SendReminderDrawerProps) {
  const [via, setVia] = useState<'sms' | 'email' | 'call'>('sms')
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [message, setMessage] = useState('')

  function defaultMessage() {
    const name = patientName ?? '[patient name]'
    const date = appointmentDate ?? '[date]'
    const time = appointmentTime ?? '[time]'
    return `Hi ${name}, this is a reminder that you have an appointment on ${date} at ${time}. Reply CONFIRM to confirm or CANCEL to cancel.`
  }

  useEffect(() => {
    if (open) {
      setVia('sms')
      setSelectedTemplateIds([])
      setMessage(defaultMessage())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientName, appointmentDate, appointmentTime])

  function handleTemplateSelect(ids: string[]) {
    setSelectedTemplateIds(ids)
    if (ids.length > 0) {
      const tpl = TEMPLATE_LIST.find((t) => t.id === ids[0])
      if (tpl) {
        const name = patientName ?? '[patient name]'
        const date = appointmentDate ?? '[date]'
        const time = appointmentTime ?? '[time]'
        setMessage(
          tpl.preview
            .replace(/\[Patient Name\]/gi, name)
            .replace(/\[Date\]/gi, date)
            .replace(/\[Time\]/gi, time)
        )
      }
    }
  }

  function handleSend() {
    onSend({ via, message })
    onClose()
  }

  const canSend = message.trim().length > 0

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
        {/* Header */}
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
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Send reminder</h2>
          </div>
          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
              canSend
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Send
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2xl pb-2xl pt-md">
          {/* Send via */}
          <fieldset className="m-0 border-none p-0">
            <legend className="mb-sm text-small text-text-primary">Send via</legend>
            <div className="flex items-center gap-lg">
              {(['sms', 'email', 'call'] as const).map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-xs text-body text-text-primary">
                  <input
                    type="radio"
                    name="sendVia"
                    value={option}
                    checked={via === option}
                    onChange={() => setVia(option)}
                    className="accent-primary"
                  />
                  {option === 'sms' ? 'SMS' : option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Template selector */}
          <div className="mt-lg">
            <TemplateSelectField
              label="Template"
              selectedIds={selectedTemplateIds}
              placeholder="Select a template"
              onSelect={handleTemplateSelect}
            />
          </div>

          {/* Message */}
          <div className="mt-lg">
            <div className="mb-xs flex items-center justify-between">
              <label htmlFor="reminder-message" className="text-small text-text-primary">Message</label>
              <span aria-live="polite" className="text-small text-text-secondary">{message.length}/300</span>
            </div>
            <textarea
              id="reminder-message"
              value={message}
              maxLength={300}
              rows={6}
              placeholder="Enter message"
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-sm border border-border px-md py-sm text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </aside>
    </div>
  )
}
