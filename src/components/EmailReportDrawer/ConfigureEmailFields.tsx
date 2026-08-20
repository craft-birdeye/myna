import { useState } from 'react'
import { X } from 'lucide-react'

interface ConfigureEmailFieldsProps {
  recipients: string[]
  onRecipientsChange: (recipients: string[]) => void
  subject: string
  onSubjectChange: (subject: string) => void
  body: string
  onBodyChange: (body: string) => void
}

/** Recipients (removable name chips) + Subject + Body — shared by `EmailReportDrawer` and
 *  `ScheduleReportDrawer`'s "Configure email" section, and by `SearchAiAlert`'s Recipients field. */
export function ConfigureEmailFields({
  recipients,
  onRecipientsChange,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
}: ConfigureEmailFieldsProps) {
  const [nameInput, setNameInput] = useState('')

  function addRecipient() {
    const value = nameInput.trim()
    if (!value || recipients.includes(value)) {
      setNameInput('')
      return
    }
    onRecipientsChange([...recipients, value])
    setNameInput('')
  }

  return (
    <div className="flex flex-col gap-md">
      <p className="text-body text-text-primary">Configure email</p>

      <label className="flex flex-col gap-xs">
        <span className="text-small text-text-secondary">Recipients</span>
        <div className="flex flex-wrap items-center gap-xs rounded-md border border-border-input bg-surface px-sm py-xs">
          {recipients.map((name) => (
            <span
              key={name}
              className="inline-flex shrink-0 items-center gap-xs whitespace-nowrap rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text"
            >
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => onRecipientsChange(recipients.filter((r) => r !== name))}
                className="flex text-chip-neutral-text hover:text-text-primary"
              >
                <X className="size-3" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </span>
          ))}
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addRecipient()
              }
            }}
            onBlur={addRecipient}
            placeholder={recipients.length === 0 ? 'Enter a name' : ''}
            className="min-w-[120px] flex-1 bg-transparent py-xs text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-small text-text-secondary">Subject</span>
        <input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="h-[34px] w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-small text-text-secondary">Body</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={5}
          className="w-full resize-none rounded-sm border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none focus:border-primary"
        />
      </label>
    </div>
  )
}
