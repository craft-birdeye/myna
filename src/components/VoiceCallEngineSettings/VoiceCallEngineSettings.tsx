import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'

const FIELD_BORDER_CLASS =
  'rounded-sm border border-border-input transition-colors focus:border-primary focus:outline-none focus-visible:border-primary'

const INPUT_CLASS = `w-full bg-surface px-md text-body text-text-primary ${FIELD_BORDER_CLASS}`

const STT_MODELS = ['Deepgram_flux', 'Deepgram', 'AssemblyAI']
const TTS_MODELS = ['Cartesia', 'ElevenLabs', 'OpenAI']
const FAILOVER_POLICIES = ['Automatic', 'Manual', 'Disabled']

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[16px] w-[32px] shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-surface-selected'
      }`}
    >
      <span
        className={`absolute top-[2px] size-3 rounded-full bg-white shadow-sm transition-[left] ${
          checked ? 'left-[18px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

function SettingsSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
          setOpen(true)
        }}
        className={`flex h-9 w-full items-center gap-sm rounded-sm border bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary ${
          open ? 'border-primary' : 'border-border-input'
        }`}
      >
        <span className="min-w-0 flex-1 truncate text-left text-body text-text-primary">{value}</span>
        <Icon name="expand_more" size={20} className="shrink-0 text-text-icon" />
      </button>
      {open && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="fixed z-[110] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
            style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover ${
                  opt === value ? 'bg-surface-hover' : ''
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/** STT / TTS engine controls shown above Default voice in voice call settings. */
export function VoiceCallEngineSettings() {
  const [sttModel, setSttModel] = useState('Deepgram_flux')
  const [sttFailover, setSttFailover] = useState('Automatic')
  const [ttsModel, setTtsModel] = useState('Cartesia')
  const [ttsFailover, setTtsFailover] = useState('Automatic')
  const [interruptions, setInterruptions] = useState(true)
  const [ttft, setTtft] = useState('800')
  const [ttfb, setTtfb] = useState('1200')

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-md">
        <h3 className="text-body text-text-primary">Speech-to-text (STT)</h3>
        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              Model <span className="text-chip-danger-text">*</span>
            </label>
            <SettingsSelect value={sttModel} options={STT_MODELS} onChange={setSttModel} />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="flex items-center gap-xs text-small text-text-secondary">
              Failover policy
              <InfoTooltip text="What happens if the primary speech-to-text model is unavailable." variant="brief" />
            </label>
            <SettingsSelect value={sttFailover} options={FAILOVER_POLICIES} onChange={setSttFailover} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-md">
        <h3 className="text-body text-text-primary">Text-to-speech (TTS)</h3>
        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              Model <span className="text-chip-danger-text">*</span>
            </label>
            <SettingsSelect value={ttsModel} options={TTS_MODELS} onChange={setTtsModel} />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="flex items-center gap-xs text-small text-text-secondary">
              Failover policy
              <InfoTooltip text="What happens if the primary text-to-speech model is unavailable." variant="brief" />
            </label>
            <SettingsSelect value={ttsFailover} options={FAILOVER_POLICIES} onChange={setTtsFailover} />
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <label className="flex items-center gap-xs text-body text-text-primary">
            Enable interruptions
            <InfoTooltip
              text="Allow users to interrupt the agent while the first message is being delivered."
              variant="detail"
            />
          </label>
          <Toggle checked={interruptions} onChange={setInterruptions} />
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Latency budget TTFT (ms)</label>
            <input
              type="text"
              inputMode="numeric"
              value={ttft}
              onChange={(e) => setTtft(e.target.value.replace(/[^\d]/g, ''))}
              className={`${INPUT_CLASS} h-9`}
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Latency budget TTFB (ms)</label>
            <input
              type="text"
              inputMode="numeric"
              value={ttfb}
              onChange={(e) => setTtfb(e.target.value.replace(/[^\d]/g, ''))}
              className={`${INPUT_CLASS} h-9`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
