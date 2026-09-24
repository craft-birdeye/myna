import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AudioPreviewPlayer,
  FallbackMessageField,
  Icon,
  InfoTooltip,
  SelectMenu,
  Toast,
  TopNav,
  type SelectOption,
} from '../components'
import {
  AFTER_HOURS_MAX_CHARS,
  DEFAULT_BIRDEYE_AFTER_HOURS,
  DEFAULT_BIRDEYE_GREETING,
  DEFAULT_BIRDEYE_LINE_BUSY,
  DEFAULT_BIRDEYE_SMS_LEFT,
  DEFAULT_BIRDEYE_SMS_NO_MESSAGE,
  GREETING_MAX_CHARS,
  LINE_BUSY_MAX_CHARS,
  DEFAULT_FORWARD_PHONE,
  DEFAULT_RING_FOR,
  RING_FOR_OPTIONS,
  SMS_MAX_CHARS,
  type FallbackFailoverConfig,
} from '../data/fallbackFailoverData'
import { useFallbackFailoverStore } from '../data/FallbackFailoverStoreContext'
import voicemailSample from '../assets/voicemail_sample.mp3'

const INPUT_CLASS =
  'w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary transition-colors duration-150 focus:border-primary focus:outline-none'

const RING_FOR_SELECT_OPTIONS: SelectOption[] = RING_FOR_OPTIONS.map((opt) => ({
  value: opt,
  label: opt,
}))

function RingForSelectField({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div>
      <label className="mb-xs block text-small text-text-secondary">Ring for</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`flex h-9 w-full items-center justify-between rounded-sm border bg-surface px-md text-body transition-colors duration-150 ${
            disabled
              ? 'cursor-not-allowed border-border-input bg-surface-l2 text-text-tertiary'
              : open
                ? 'border-primary text-text-primary'
                : 'border-border-input text-text-primary hover:bg-surface-l2'
          }`}
        >
          <span>{value}</span>
          <Icon
            name={open ? 'expand_less' : 'expand_more'}
            size={20}
            className={`shrink-0 ${disabled ? 'text-text-tertiary' : 'text-text-icon'}`}
          />
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+4px)] z-[60] w-full">
            <SelectMenu
              options={RING_FOR_SELECT_OPTIONS}
              value={[value]}
              searchable={false}
              onChange={(next) => {
                if (next[0]) onChange(next[0])
                setOpen(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const SECTION_TITLE_CLASS = 'text-[16px] leading-6 tracking-[-0.32px] text-text-primary'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[16px] w-[32px] shrink-0 cursor-pointer rounded-full transition-colors duration-150 ease-out focus:outline-none ${
        checked ? 'bg-primary' : 'bg-surface-selected'
      }`}
    >
      <span
        className={`absolute top-[2px] size-3 rounded-full bg-white shadow-sm transition-[left] duration-150 ease-out ${
          checked ? 'left-[18px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

function ToggleRow({
  checked,
  onChange,
  label,
  tooltip,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  tooltip?: string
}) {
  return (
    <div className="flex items-center gap-sm">
      <span className="text-body text-text-primary">{label}</span>
      {tooltip && <InfoTooltip text={tooltip} />}
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function CollapseSection({ open, children, className = '' }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`grid transition-all duration-200 ease-out ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      } ${className}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

function SectionHeader({
  title,
  subtext,
  badge,
}: {
  title: string
  subtext: string
  badge?: string
}) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex flex-wrap items-center gap-sm">
        <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
        {badge && (
          <span className="rounded-sm bg-chip-danger-bg px-sm py-[2px] text-small text-chip-danger-text">
            {badge}
          </span>
        )}
      </div>
      <p className="text-small text-text-secondary">{subtext}</p>
    </div>
  )
}

export function FallbackFailoverScreen() {
  const { config: saved, saveConfig } = useFallbackFailoverStore()
  const [draft, setDraft] = useState<FallbackFailoverConfig>(saved)
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    setDraft(saved)
  }, [saved])

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])

  const forwardFieldsChanged = useMemo(
    () => draft.forwardPhone !== DEFAULT_FORWARD_PHONE || draft.ringFor !== DEFAULT_RING_FOR,
    [draft.forwardPhone, draft.ringFor],
  )

  function patch<K extends keyof FallbackFailoverConfig>(key: K, value: FallbackFailoverConfig[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function resetForwardDefaults() {
    setDraft((prev) => ({
      ...prev,
      forwardPhone: DEFAULT_FORWARD_PHONE,
      ringFor: DEFAULT_RING_FOR,
    }))
  }

  function handleSave() {
    saveConfig(draft)
    setToastVisible(true)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <div className="sticky top-0 z-10 flex items-start justify-between bg-surface px-2xl py-xl">
          <div className="flex flex-col gap-xs">
            <span className="text-h3 text-text-primary">Fallback and failover</span>
            <span className="text-small text-text-secondary">
              Set what callers hear and get by text when the agent can&apos;t answer.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex h-9 shrink-0 items-center rounded-sm px-lg text-body transition-colors duration-150 ease-out ${
              isDirty
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Save
          </button>
        </div>

        <div className="flex w-full max-w-[750px] flex-col gap-xl px-2xl pb-2xl">
          {/* Fallback voice greeting */}
          <section className="rounded-sm border border-border bg-surface p-xl transition-colors duration-150">
            <SectionHeader
              title="Fallback"
              badge="Prevents dead air"
              subtext="Played when the agent is off, paused, or unavailable. Customize below."
            />

            <div className="mt-md">
              <ToggleRow
                checked={draft.customizeGreeting}
                onChange={(v) => patch('customizeGreeting', v)}
                label="Customize greeting"
                tooltip="Turn off to use the Birdeye default message."
              />
            </div>

            <CollapseSection open={draft.customizeGreeting} className="mt-md">
              <FallbackMessageField
                label="Greeting callers hear"
                value={draft.greeting}
                onChange={(v) => patch('greeting', v)}
                maxChars={GREETING_MAX_CHARS}
              />
            </CollapseSection>

            <CollapseSection open={!draft.customizeGreeting} className="mt-md">
              <FallbackMessageField
                label="Greeting callers hear"
                value={DEFAULT_BIRDEYE_GREETING}
                onChange={() => undefined}
                maxChars={GREETING_MAX_CHARS}
                readOnly
              />
            </CollapseSection>

            <div className="mt-md">
              <AudioPreviewPlayer audioUrl={voicemailSample} durationSecs={11} />
            </div>
          </section>

          {/* Text message after the call */}
          <section className="rounded-sm border border-border bg-surface p-xl transition-colors duration-150">
            <SectionHeader
              title="Text"
              subtext="Text the caller after the call ends, so missed calls still get a follow-up."
            />

            <div className="mt-md">
              <ToggleRow
                checked={draft.customizeSms}
                onChange={(v) => patch('customizeSms', v)}
                label="Customize text messages"
                tooltip="Turn off to use the Birdeye default messages."
              />
            </div>

            <CollapseSection open={draft.customizeSms} className="mt-md">
              <div className="flex flex-col gap-md">
                <FallbackMessageField
                  label="When the caller leaves a message"
                  value={draft.smsLeftMessage}
                  onChange={(v) => patch('smsLeftMessage', v)}
                  maxChars={SMS_MAX_CHARS}
                />
                <FallbackMessageField
                  label="When the caller does not leave a message"
                  value={draft.smsNoMessage}
                  onChange={(v) => patch('smsNoMessage', v)}
                  maxChars={SMS_MAX_CHARS}
                />
              </div>
            </CollapseSection>

            <CollapseSection open={!draft.customizeSms} className="mt-md">
              <div className="flex flex-col gap-md">
                <FallbackMessageField
                  label="When the caller leaves a message"
                  value={DEFAULT_BIRDEYE_SMS_LEFT}
                  onChange={() => undefined}
                  maxChars={SMS_MAX_CHARS}
                  readOnly
                />
                <FallbackMessageField
                  label="When the caller does not leave a message"
                  value={DEFAULT_BIRDEYE_SMS_NO_MESSAGE}
                  onChange={() => undefined}
                  maxChars={SMS_MAX_CHARS}
                  readOnly
                />
              </div>
            </CollapseSection>
          </section>

          {/* Forward to your team */}
          <section className="rounded-sm border border-border bg-surface p-xl transition-colors duration-150">
            <SectionHeader
              title="Forward to team"
              subtext="Route callers to a live number. If no one picks up, they get the fallback text above."
            />

            <div className="mt-md flex flex-col gap-md">
              <ToggleRow
                checked={draft.forwardEnabled}
                onChange={(v) => patch('forwardEnabled', v)}
                label="Customize phone number"
                tooltip="Turn on if you have a front desk that can pick up. No answer in time? We play the fallback greeting and capture a callback."
              />

              {forwardFieldsChanged && draft.forwardEnabled && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForwardDefaults}
                    className="rounded-sm px-xs py-xs text-body text-text-action hover:bg-surface-hover"
                  >
                    Reset to default
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                <div>
                  <label className="mb-xs block text-small text-text-secondary">Forwarding number</label>
                  <input
                    type="tel"
                    value={draft.forwardPhone}
                    onChange={(e) => patch('forwardPhone', e.target.value)}
                    placeholder={DEFAULT_FORWARD_PHONE}
                    disabled={!draft.forwardEnabled}
                    className={`${INPUT_CLASS} h-9 disabled:cursor-not-allowed disabled:bg-surface-l2 disabled:text-text-tertiary`}
                  />
                </div>
                <RingForSelectField
                  value={draft.ringFor}
                  disabled={!draft.forwardEnabled}
                  onChange={(v) => patch('ringFor', v)}
                />
              </div>
            </div>
          </section>

          {/* When every line is busy */}
          <section className="rounded-sm border border-border bg-surface p-xl transition-colors duration-150">
            <SectionHeader
              title="When every line is busy"
              subtext="Play a short busy message and collect caller's name and number for a callback"
            />

            <div className="mt-md flex flex-col gap-sm">
              <ToggleRow
                checked={draft.customizeLineBusy}
                onChange={(v) => patch('customizeLineBusy', v)}
                label="Customize busy message"
                tooltip="Turn off to use the Birdeye default message."
              />

              <CollapseSection open={draft.customizeLineBusy}>
                <FallbackMessageField
                  label="Busy message"
                  value={draft.lineBusyGreeting}
                  onChange={(v) => patch('lineBusyGreeting', v)}
                  maxChars={LINE_BUSY_MAX_CHARS}
                />
              </CollapseSection>

              <CollapseSection open={!draft.customizeLineBusy}>
                <FallbackMessageField
                  label="Busy message"
                  value={DEFAULT_BIRDEYE_LINE_BUSY}
                  onChange={() => undefined}
                  maxChars={LINE_BUSY_MAX_CHARS}
                  readOnly
                />
              </CollapseSection>

              <AudioPreviewPlayer audioUrl={voicemailSample} durationSecs={11} />
            </div>
          </section>

          {/* After hours */}
          <section className="rounded-sm border border-border bg-surface p-xl transition-colors duration-150">
            <SectionHeader
              title="After-hours"
              subtext="Play a different greeting outside your business hours."
            />

            <div className="mt-md">
              <ToggleRow
                checked={draft.useBusinessHours}
                onChange={(v) => patch('useBusinessHours', v)}
                label={
                  <span>
                    Use business hours from{' '}
                    <button type="button" className="text-text-action hover:underline">
                      Business settings
                      <Icon name="open_in_new" size={14} className="ml-xs inline align-text-bottom" />
                    </button>
                  </span>
                }
                tooltip="Outside these hours, callers hear the after-hours greeting below."
              />
            </div>

            <CollapseSection open={draft.useBusinessHours} className="mt-md">
              <div className="flex flex-col gap-sm">
                <ToggleRow
                  checked={draft.customizeAfterHours}
                  onChange={(v) => patch('customizeAfterHours', v)}
                  label="Customize after-hours greeting"
                  tooltip="Turn off to use the Birdeye default message."
                />

                <CollapseSection open={draft.customizeAfterHours}>
                  <FallbackMessageField
                    label="After-hours greeting"
                    value={draft.afterHoursGreeting}
                    onChange={(v) => patch('afterHoursGreeting', v)}
                    maxChars={AFTER_HOURS_MAX_CHARS}
                  />
                </CollapseSection>

                <CollapseSection open={!draft.customizeAfterHours}>
                  <FallbackMessageField
                    label="After-hours greeting"
                    value={DEFAULT_BIRDEYE_AFTER_HOURS}
                    onChange={() => undefined}
                    maxChars={AFTER_HOURS_MAX_CHARS}
                    readOnly
                  />
                </CollapseSection>

                <AudioPreviewPlayer audioUrl={voicemailSample} durationSecs={11} />
              </div>
            </CollapseSection>
          </section>
        </div>
      </div>

      <Toast message="Settings saved." visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  )
}
