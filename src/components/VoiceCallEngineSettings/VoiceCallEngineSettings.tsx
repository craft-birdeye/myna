import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'
import {
  DEFAULT_AGENT_VOICE,
  DefaultVoiceDrawer,
} from '../VoiceSettingsDrawers/VoiceSettingsDrawers'

const STT_MODELS = ['Deepgram_flux', 'Deepgram', 'AssemblyAI']
const TTS_MODELS = ['Cartesia', 'ElevenLabs', 'OpenAI']
const FAILOVER_POLICIES = ['Automatic', 'Manual', 'Disabled']
const STT_FAILOVER_MODELS = ['Assembly AI', 'Deepgram', 'Google STT']
const TTS_FAILOVER_MODELS = ['ElevenLabs', 'OpenAI', 'Cartesia']

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

/** STT / TTS engine model pickers shown above Default voice in voice call settings. */
export function VoiceCallEngineSettings() {
  const [sttModel, setSttModel] = useState('Deepgram_flux')
  const [sttFailover, setSttFailover] = useState('Manual')
  const [sttFailoverModel, setSttFailoverModel] = useState('Assembly AI')
  const [ttsModel, setTtsModel] = useState('Cartesia')

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-md">
        <h3 className="text-body font-medium text-text-primary">Speech-to-text (STT)</h3>
        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Model <span className="text-chip-danger-text">*</span>
          </label>
          <SettingsSelect value={sttModel} options={STT_MODELS} onChange={setSttModel} />
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="flex items-center gap-xs text-small text-text-secondary">
              Failover policy
              <InfoTooltip text="What happens if the primary speech-to-text model is unavailable." variant="brief" />
            </label>
            <SettingsSelect value={sttFailover} options={FAILOVER_POLICIES} onChange={setSttFailover} />
          </div>
          {sttFailover === 'Manual' && (
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">
                Model <span className="text-chip-danger-text">*</span>
              </label>
              <SettingsSelect
                value={sttFailoverModel}
                options={STT_FAILOVER_MODELS}
                onChange={setSttFailoverModel}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-md pt-2xl">
        <h3 className="text-body font-medium text-text-primary">Text-to-speech (TTS)</h3>
        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Model <span className="text-chip-danger-text">*</span>
          </label>
          <SettingsSelect value={ttsModel} options={TTS_MODELS} onChange={setTtsModel} />
        </div>
      </div>
    </div>
  )
}

/** TTS failover policy + interruption toggle, shown after Default voice / Add additional voice. */
export function VoiceCallInterruptionSettings() {
  const [ttsFailover, setTtsFailover] = useState('Automatic')
  const [ttsFailoverModel, setTtsFailoverModel] = useState(TTS_FAILOVER_MODELS[0])
  const [ttsFailoverVoice, setTtsFailoverVoice] = useState(DEFAULT_AGENT_VOICE)
  const [ttsFailoverVoiceSpeed, setTtsFailoverVoiceSpeed] = useState(1)
  const [failoverVoiceDrawerOpen, setFailoverVoiceDrawerOpen] = useState(false)
  const [interruptions, setInterruptions] = useState(true)

  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <label className="flex items-center gap-xs text-small text-text-secondary">
            Failover policy
            <InfoTooltip text="What happens if the primary text-to-speech model is unavailable." variant="brief" />
          </label>
          <SettingsSelect value={ttsFailover} options={FAILOVER_POLICIES} onChange={setTtsFailover} />
        </div>
        {ttsFailover === 'Manual' && (
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              Model <span className="text-chip-danger-text">*</span>
            </label>
            <SettingsSelect
              value={ttsFailoverModel}
              options={TTS_FAILOVER_MODELS}
              onChange={setTtsFailoverModel}
            />
          </div>
        )}
      </div>

      {ttsFailover === 'Manual' && (
        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Voice <span className="text-chip-danger-text">*</span>
          </label>
          <button
            type="button"
            onClick={() => setFailoverVoiceDrawerOpen(true)}
            className="flex h-9 w-full items-center gap-sm rounded-sm border border-border-input bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary"
          >
            <span
              className={`min-w-0 flex-1 truncate text-left text-body ${
                ttsFailoverVoice ? 'text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {ttsFailoverVoice || 'Select'}
            </span>
            <Icon name="chevron_right" size={20} className="shrink-0 text-text-icon" />
          </button>
          <DefaultVoiceDrawer
            open={failoverVoiceDrawerOpen}
            voice={ttsFailoverVoice}
            speed={ttsFailoverVoiceSpeed}
            onClose={() => setFailoverVoiceDrawerOpen(false)}
            onSave={(next) => {
              setTtsFailoverVoice(next.voice)
              setTtsFailoverVoiceSpeed(next.speed)
              setFailoverVoiceDrawerOpen(false)
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-sm py-sm">
        <label className="flex items-center gap-xs text-body text-text-primary">
          Enable interruptions
          <InfoTooltip
            text="Allow users to interrupt the agent while the first message is being delivered."
            variant="detail"
          />
        </label>
        <Toggle checked={interruptions} onChange={setInterruptions} />
      </div>
    </div>
  )
}
