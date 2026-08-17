import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'
import { LanguageFlag } from '../LanguageSelectMenu/LanguageSelectMenu'
import {
  DEFAULT_AGENT_VOICE,
  DefaultVoiceDrawer,
  AdditionalVoiceDrawer,
  VoicePreviewButton,
  type AdditionalVoiceConfig,
} from '../VoiceSettingsDrawers/VoiceSettingsDrawers'
import { getAgentLanguage } from '../../data/agentLanguages'

export const STT_MODELS = ['Deepgram_flux', 'Deepgram', 'AssemblyAI']
export const TTS_MODELS = ['Cartesia', 'ElevenLabs', 'OpenAI']
export const FAILOVER_POLICIES = ['Automatic', 'Manual', 'Disabled']
export const STT_FAILOVER_MODELS = ['Assembly AI', 'Deepgram', 'Google STT', 'Best available']
export const TTS_FAILOVER_MODELS = ['Eleven Labs', 'OpenAI', 'Cartesia', 'Best available']

export interface TtsModelSettingsValue {
  ttsModel: string
}

export interface TtsFailoverSettingsValue {
  ttsFailover: string
  ttsFailoverModel: string
  failoverVoice: string
  failoverVoiceSpeed: number
  failoverAdditionalVoiceConfigs: AdditionalVoiceConfig[]
}

export interface SttSettingsValue {
  sttModel: string
  sttFailover: string
  sttFailoverModel: string
  interruptions: boolean
}

export const DEFAULT_TTS_MODEL_SETTINGS: TtsModelSettingsValue = {
  ttsModel: 'Cartesia',
}

export const DEFAULT_TTS_FAILOVER_SETTINGS: TtsFailoverSettingsValue = {
  ttsFailover: 'Manual',
  ttsFailoverModel: TTS_FAILOVER_MODELS[0],
  failoverVoice: DEFAULT_AGENT_VOICE,
  failoverVoiceSpeed: 1,
  failoverAdditionalVoiceConfigs: [],
}

export const DEFAULT_STT_SETTINGS: SttSettingsValue = {
  sttModel: 'Deepgram_flux',
  sttFailover: 'Manual',
  sttFailoverModel: STT_FAILOVER_MODELS[0],
  interruptions: true,
}

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
        className={`flex h-9 w-full items-center gap-sm rounded-md border bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary ${
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
export function TtsModelSettings({
  value,
  onChange,
  /** Suppresses the built-in heading when the caller renders its own (e.g. a sub-panel header). */
  hideHeading = false,
}: {
  value?: TtsModelSettingsValue
  onChange?: (next: TtsModelSettingsValue) => void
  hideHeading?: boolean
} = {}) {
  const [internal, setInternal] = useState(DEFAULT_TTS_MODEL_SETTINGS)
  const settings = value ?? internal
  const update = onChange ?? setInternal

  return (
    <div className="flex flex-col gap-md">
      {!hideHeading && <h3 className="text-body text-text-primary">Text-to-speech (TTS)</h3>}
      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-secondary">
          Primary model <span className="text-chip-danger-text">*</span>
        </label>
        <SettingsSelect
          value={settings.ttsModel}
          options={TTS_MODELS}
          onChange={(ttsModel) => update({ ...settings, ttsModel })}
        />
      </div>
    </div>
  )
}

/** TTS failover model + a mirrored Default voice/Add additional voice for the
 *  failover path — shown after Default voice / Add additional voice, before Speech-to-text. */
export function TtsFailoverSettings({
  value,
  onChange,
}: {
  value?: TtsFailoverSettingsValue
  onChange?: (next: TtsFailoverSettingsValue) => void
} = {}) {
  const [internal, setInternal] = useState(DEFAULT_TTS_FAILOVER_SETTINGS)
  const settings = value ?? internal
  const update = onChange ?? setInternal

  const [failoverDrawerOpen, setFailoverDrawerOpen] = useState(false)
  const [failoverAdditionalDrawerOpen, setFailoverAdditionalDrawerOpen] = useState(false)
  const [editingFailoverAdditionalVoice, setEditingFailoverAdditionalVoice] =
    useState<AdditionalVoiceConfig | null>(null)

  function handleFailoverVoiceSave(next: { voice: string; speed: number }) {
    update({
      ...settings,
      failoverVoice: next.voice,
      failoverVoiceSpeed: next.speed,
      failoverAdditionalVoiceConfigs: settings.failoverAdditionalVoiceConfigs.filter(
        (cfg) => cfg.label !== next.voice,
      ),
    })
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
      update({
        ...settings,
        failoverAdditionalVoiceConfigs: settings.failoverAdditionalVoiceConfigs.map((cfg) =>
          cfg.label === editingFailoverAdditionalVoice.label ? config : cfg,
        ),
      })
    } else {
      update({
        ...settings,
        failoverAdditionalVoiceConfigs: [...settings.failoverAdditionalVoiceConfigs, config],
      })
    }
    closeFailoverAdditionalDrawer()
  }

  function handleRemoveFailoverAdditionalVoice(label: string) {
    update({
      ...settings,
      failoverAdditionalVoiceConfigs: settings.failoverAdditionalVoiceConfigs.filter(
        (cfg) => cfg.label !== label,
      ),
    })
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-secondary">
          Failover model <span className="text-chip-danger-text">*</span>
        </label>
        <SettingsSelect
          value={settings.ttsFailoverModel}
          options={TTS_FAILOVER_MODELS}
          onChange={(ttsFailoverModel) => update({ ...settings, ttsFailoverModel, ttsFailover: 'Manual' })}
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-secondary">
          Persona <span className="text-chip-danger-text">*</span>
        </label>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setFailoverDrawerOpen(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-sm rounded-md border border-border-input bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary"
          >
            <span
              className={`min-w-0 flex-1 truncate text-left text-body ${
                settings.failoverVoice ? 'text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {settings.failoverVoice || 'Select'}
            </span>
            <Icon name="chevron_right" size={20} className="shrink-0 text-text-icon" />
          </button>
          <VoicePreviewButton
            voiceLabel={settings.failoverVoice}
            speed={settings.failoverVoiceSpeed}
            disabled={!settings.failoverVoice}
          />
        </div>
        <DefaultVoiceDrawer
          open={failoverDrawerOpen}
          voice={settings.failoverVoice}
          speed={settings.failoverVoiceSpeed}
          onClose={() => setFailoverDrawerOpen(false)}
          onSave={handleFailoverVoiceSave}
          terminology="persona"
        />
      </div>

      <div className="flex flex-col gap-xs">
        {settings.failoverAdditionalVoiceConfigs.length > 0 && (
          <label className="text-small text-text-secondary">Additional persona</label>
        )}
        {settings.failoverAdditionalVoiceConfigs.length > 0 ? (
          <div className="flex flex-col gap-lg rounded-sm border border-border-input bg-surface px-[10px] py-sm">
            <div className="flex flex-wrap gap-sm">
              {settings.failoverAdditionalVoiceConfigs.map((cfg) => {
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
            Add additional persona
          </button>
        )}
        <AdditionalVoiceDrawer
          open={failoverAdditionalDrawerOpen}
          initialConfig={editingFailoverAdditionalVoice}
          defaultLanguage="en"
          defaultSpeed={settings.failoverVoiceSpeed}
          defaultVoice={settings.failoverVoice}
          onClose={closeFailoverAdditionalDrawer}
          onSave={handleSaveFailoverAdditionalVoice}
          terminology="persona"
        />
      </div>
    </div>
  )
}

/** STT heading + Primary model/Failover + Enable interruptions — shown last, before Greeting message. */
export function VoiceCallEngineSettings({
  value,
  onChange,
  /** Suppresses the built-in heading + top padding when rendered inside a sub-panel. */
  hideHeading = false,
}: {
  value?: SttSettingsValue
  onChange?: (next: SttSettingsValue) => void
  hideHeading?: boolean
} = {}) {
  const [internal, setInternal] = useState(DEFAULT_STT_SETTINGS)
  const settings = value ?? internal
  const update = onChange ?? setInternal

  return (
    <div className={`flex flex-col ${hideHeading ? "" : "pt-lg"}`}>
      <div className="flex flex-col gap-md">
        {!hideHeading && <h3 className="text-body text-text-primary">Speech-to-text (STT)</h3>}
        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Primary model <span className="text-chip-danger-text">*</span>
          </label>
          <SettingsSelect
            value={settings.sttModel}
            options={STT_MODELS}
            onChange={(sttModel) => update({ ...settings, sttModel })}
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Failover model <span className="text-chip-danger-text">*</span>
          </label>
          <SettingsSelect
            value={settings.sttFailoverModel}
            options={STT_FAILOVER_MODELS}
            onChange={(sttFailoverModel) =>
              update({ ...settings, sttFailoverModel, sttFailover: 'Manual' })
            }
          />
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
        <Toggle
          checked={settings.interruptions}
          onChange={(interruptions) => update({ ...settings, interruptions })}
        />
      </div>
    </div>
  )
}
