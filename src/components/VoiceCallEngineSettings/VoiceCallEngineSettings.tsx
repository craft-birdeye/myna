import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'
import { LanguageFlag } from '../LanguageSelectMenu/LanguageSelectMenu'
import {
  DEFAULT_AGENT_VOICE,
  DefaultVoiceDrawer,
  AdditionalVoiceDrawer,
  type AdditionalVoiceConfig,
} from '../VoiceSettingsDrawers/VoiceSettingsDrawers'
import { getAgentLanguage } from '../../data/agentLanguages'

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

/** TTS heading + Primary model — shown first, above Default voice. */
export function TtsModelSettings() {
  const [ttsModel, setTtsModel] = useState('Cartesia')

  return (
    <div className="flex flex-col gap-md">
      <h3 className="text-body font-medium text-text-primary">Text-to-speech (TTS)</h3>
      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-secondary">
          Primary model <span className="text-chip-danger-text">*</span>
        </label>
        <SettingsSelect value={ttsModel} options={TTS_MODELS} onChange={setTtsModel} />
      </div>
    </div>
  )
}

/** TTS failover policy/model + a mirrored Default voice/Add additional voice for the
 *  failover path — shown after Default voice / Add additional voice, before Speech-to-text. */
export function TtsFailoverSettings() {
  const [ttsFailover, setTtsFailover] = useState('Automatic')
  const [ttsFailoverModel, setTtsFailoverModel] = useState(TTS_FAILOVER_MODELS[0])
  const [failoverVoice, setFailoverVoice] = useState(DEFAULT_AGENT_VOICE)
  const [failoverVoiceSpeed, setFailoverVoiceSpeed] = useState(1)
  const [failoverDrawerOpen, setFailoverDrawerOpen] = useState(false)
  const [failoverAdditionalVoiceConfigs, setFailoverAdditionalVoiceConfigs] = useState<AdditionalVoiceConfig[]>([])
  const [failoverAdditionalDrawerOpen, setFailoverAdditionalDrawerOpen] = useState(false)
  const [editingFailoverAdditionalVoice, setEditingFailoverAdditionalVoice] =
    useState<AdditionalVoiceConfig | null>(null)

  function handleFailoverVoiceSave(next: { voice: string; speed: number }) {
    setFailoverVoice(next.voice)
    setFailoverVoiceSpeed(next.speed)
    setFailoverAdditionalVoiceConfigs((configs) => configs.filter((cfg) => cfg.label !== next.voice))
    setFailoverDrawerOpen(false)
  }

  function openAddFailoverAdditionalVoice() {
    setEditingFailoverAdditionalVoice(null)
    setFailoverAdditionalDrawerOpen(true)
  }

  function openEditFailoverAdditionalVoice(config: AdditionalVoiceConfig) {
    setEditingFailoverAdditionalVoice(config)
    setFailoverAdditionalDrawerOpen(true)
  }

  function closeFailoverAdditionalDrawer() {
    setFailoverAdditionalDrawerOpen(false)
    setEditingFailoverAdditionalVoice(null)
  }

  function handleSaveFailoverAdditionalVoice(config: AdditionalVoiceConfig) {
    if (editingFailoverAdditionalVoice) {
      setFailoverAdditionalVoiceConfigs((configs) =>
        configs.map((cfg) => (cfg.label === editingFailoverAdditionalVoice.label ? config : cfg)),
      )
    } else {
      setFailoverAdditionalVoiceConfigs((configs) => [...configs, config])
    }
    closeFailoverAdditionalDrawer()
  }

  function handleRemoveFailoverAdditionalVoice(label: string) {
    setFailoverAdditionalVoiceConfigs((configs) => configs.filter((cfg) => cfg.label !== label))
  }

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
              Failover model <span className="text-chip-danger-text">*</span>
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
        <>
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              Default voice <span className="text-chip-danger-text">*</span>
            </label>
            <button
              type="button"
              onClick={() => setFailoverDrawerOpen(true)}
              className="flex h-9 w-full items-center gap-sm rounded-sm border border-border-input bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary"
            >
              <span
                className={`min-w-0 flex-1 truncate text-left text-body ${
                  failoverVoice ? 'text-text-primary' : 'text-text-tertiary'
                }`}
              >
                {failoverVoice || 'Select'}
              </span>
              <Icon name="chevron_right" size={20} className="shrink-0 text-text-icon" />
            </button>
            <DefaultVoiceDrawer
              open={failoverDrawerOpen}
              voice={failoverVoice}
              speed={failoverVoiceSpeed}
              onClose={() => setFailoverDrawerOpen(false)}
              onSave={handleFailoverVoiceSave}
            />
          </div>

          <div className="flex flex-col gap-xs">
            {failoverAdditionalVoiceConfigs.length > 0 && (
              <label className="text-small text-text-secondary">Additional voice</label>
            )}
            {failoverAdditionalVoiceConfigs.length > 0 ? (
              <div className="flex flex-col gap-lg rounded-sm border border-border-input bg-surface px-[10px] py-sm">
                <div className="flex flex-wrap gap-sm">
                  {failoverAdditionalVoiceConfigs.map((cfg) => {
                    const lang = getAgentLanguage(cfg.language)
                    return (
                      <button
                        key={cfg.label}
                        type="button"
                        onClick={() => openEditFailoverAdditionalVoice(cfg)}
                        className="flex h-7 max-w-full items-center gap-xs rounded-sm bg-chip-neutral-bg px-sm text-body text-text-primary hover:bg-surface-hover"
                      >
                        <LanguageFlag countryCode={lang.countryCode} label={lang.label} size="sm" />
                        <span className="truncate">{cfg.label}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${cfg.label}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFailoverAdditionalVoice(cfg.label)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemoveFailoverAdditionalVoice(cfg.label)
                            }
                          }}
                          className="flex size-4 shrink-0 items-center justify-center text-text-icon hover:text-text-primary"
                        >
                          <Icon name="close" size={14} />
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={openAddFailoverAdditionalVoice}
                  className="flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover"
                >
                  <Icon name="add_circle" size={18} className="text-primary" />
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAddFailoverAdditionalVoice}
                className="flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover"
              >
                <Icon name="add_circle" size={18} className="text-primary" />
                Add additional voice
              </button>
            )}
            <AdditionalVoiceDrawer
              open={failoverAdditionalDrawerOpen}
              initialConfig={editingFailoverAdditionalVoice}
              defaultLanguage="en"
              defaultSpeed={failoverVoiceSpeed}
              defaultVoice={failoverVoice}
              onClose={closeFailoverAdditionalDrawer}
              onSave={handleSaveFailoverAdditionalVoice}
            />
          </div>
        </>
      )}
    </div>
  )
}

/** STT heading + Primary model/Failover + Enable interruptions — shown last, before Greeting message. */
export function VoiceCallEngineSettings() {
  const [sttModel, setSttModel] = useState('Deepgram_flux')
  const [sttFailover, setSttFailover] = useState('Automatic')
  const [sttFailoverModel, setSttFailoverModel] = useState('Assembly AI')
  const [interruptions, setInterruptions] = useState(true)

  return (
    <div className="flex flex-col pt-lg">
      <div className="flex flex-col gap-md">
        <h3 className="text-body font-medium text-text-primary">Speech-to-text (STT)</h3>
        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Primary model <span className="text-chip-danger-text">*</span>
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
                Failover model <span className="text-chip-danger-text">*</span>
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

      <div className="flex items-center gap-sm py-sm mt-[12px]">
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
