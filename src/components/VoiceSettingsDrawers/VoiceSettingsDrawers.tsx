import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { Icon } from '../Icon/Icon'
import { LanguageFlag } from '../LanguageSelectMenu/LanguageSelectMenu'
import { Tooltip } from '../Tooltip/Tooltip'
import {
  AGENT_LANGUAGES,
  getAgentLanguage,
  type AgentLanguageId,
} from '../../data/agentLanguages'
import type {
  AdditionalVoiceDrawerProps,
  DefaultVoiceDrawerProps,
  VoiceOption,
} from './VoiceSettingsDrawers.types'

export type { AdditionalVoiceConfig, VoiceOption } from './VoiceSettingsDrawers.types'

const FIELD_BORDER_CLASS =
  'rounded-md border border-border-input transition-colors focus:border-primary focus:outline-none focus-visible:border-primary'

const INPUT_CLASS = `w-full bg-surface px-md text-body text-text-primary ${FIELD_BORDER_CLASS}`

const VOICE_SPEED_MIN = 0.5
const VOICE_SPEED_MAX = 1.5
const VOICE_SPEED_STEP = 0.01

const SAME_AS_AGENT_LANGUAGE = '__same_as_agent__'

export const AGENT_VOICE_OPTIONS: VoiceOption[] = [
  {
    label: 'Andrea (Confident, Vibrant, Empathetic)',
    preview: "Hi, I'm Andrea — confident, vibrant, and empathetic. How can I help you today?",
  },
  {
    label: 'John (steady, professional, friendly)',
    preview: "Hello, this is John. Steady, professional, and friendly — how can I help?",
  },
  {
    label: 'Roger (relaxed, conversational, deep)',
    preview: "Hi, I'm Roger. Relaxed and conversational. What can I do for you?",
  },
  {
    label: 'Alice (approachable, natural, calm)',
    preview: "Hi, I'm Alice — approachable, natural, and calm. How can I help you today?",
  },
]

export const DEFAULT_AGENT_VOICE = AGENT_VOICE_OPTIONS[0].label

function formatVoiceSpeed(value: number): string {
  return value.toFixed(2)
}

function stopVoicePreview() {
  window.speechSynthesis.cancel()
}

function playVoicePreview(text: string, speed = 1, onEnd?: () => void) {
  stopVoicePreview()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = Math.min(Math.max(speed, VOICE_SPEED_MIN), VOICE_SPEED_MAX)
  utter.onend = () => onEnd?.()
  utter.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utter)
}

export function VoicePreviewButton({
  voiceLabel,
  speed = 1,
  disabled = false,
}: {
  voiceLabel: string
  speed?: number
  disabled?: boolean
}) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    return () => stopVoicePreview()
  }, [])

  useEffect(() => {
    stopVoicePreview()
    setPlaying(false)
  }, [voiceLabel, speed])

  const previewText =
    AGENT_VOICE_OPTIONS.find((opt) => opt.label === voiceLabel)?.preview
    ?? `Hi, I'm your virtual assistant. How can I help you today?`

  const toggle = () => {
    if (disabled || !voiceLabel) return
    if (playing) {
      stopVoicePreview()
      setPlaying(false)
      return
    }
    setPlaying(true)
    playVoicePreview(previewText, speed, () => setPlaying(false))
  }

  return (
    <Tooltip content="Preview" variant="brief">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || !voiceLabel}
        aria-label="Preview"
        className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border-input bg-surface text-text-icon transition-colors hover:bg-surface-l2 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name={playing ? 'stop' : 'volume_up'} size={20} fill={playing} />
      </button>
    </Tooltip>
  )
}

function VoiceDropdown({
  value,
  onChange,
  speed = 1,
}: {
  value: string
  onChange: (value: string) => void
  speed?: number
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const options = AGENT_VOICE_OPTIONS

  const openMenu = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen((o) => !o)
  }

  const stopPlaying = () => {
    stopVoicePreview()
    setPlaying(null)
  }

  const togglePreview = (opt: VoiceOption, e: MouseEvent) => {
    e.stopPropagation()
    if (playing === opt.label) {
      stopPlaying()
      return
    }
    stopPlaying()
    setPlaying(opt.label)
    playVoicePreview(opt.preview, speed, () => setPlaying(null))
  }

  const select = (label: string) => {
    stopPlaying()
    onChange(label)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) stopPlaying()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className={`flex h-9 w-full items-center gap-sm rounded-md border bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary ${
          open ? 'border-primary' : 'border-border-input'
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate text-left text-body ${
            value ? 'text-text-primary' : 'text-text-tertiary'
          }`}
        >
          {value || 'Select'}
        </span>
        <Icon name="expand_more" size={20} className="shrink-0 text-text-icon" />
      </button>
      {open &&
        anchor &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200]"
              onClick={() => {
                stopPlaying()
                setOpen(false)
              }}
              aria-hidden
            />
            <div
              className="fixed z-[210] overflow-hidden rounded-sm border border-border bg-surface py-xs shadow-dropdown"
              style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
            >
              {options.map((opt) => {
                const isSelected = opt.label === value
                const isPlaying = playing === opt.label
                return (
                  <div
                    key={opt.label}
                    onClick={() => select(opt.label)}
                    className={`flex cursor-pointer items-center gap-sm px-md py-sm hover:bg-surface-hover ${
                      isSelected ? 'bg-surface-hover' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                      {opt.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => togglePreview(opt, e)}
                      title={isPlaying ? 'Stop preview' : 'Preview voice'}
                      className="flex shrink-0 items-center justify-center text-text-icon hover:text-text-primary"
                    >
                      <Icon name={isPlaying ? 'stop' : 'volume_up'} size={18} />
                    </button>
                  </div>
                )
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

export function DefaultVoiceDrawer({
  open,
  voice,
  speed,
  onClose,
  onSave,
  terminology = 'persona',
}: DefaultVoiceDrawerProps) {
  const [draftVoice, setDraftVoice] = useState(voice)
  const [draftSpeed, setDraftSpeed] = useState(speed)
  const isPersona = terminology === 'persona'

  useEffect(() => {
    if (open) {
      const hasMatchingVoice = AGENT_VOICE_OPTIONS.some((opt) => opt.label === voice)
      setDraftVoice(hasMatchingVoice ? voice : AGENT_VOICE_OPTIONS[0]?.label || '')
      setDraftSpeed(speed)
    } else {
      stopVoicePreview()
    }
  }, [open, voice, speed])

  const speedPct =
    ((draftSpeed - VOICE_SPEED_MIN) / (VOICE_SPEED_MAX - VOICE_SPEED_MIN)) * 100

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-[650px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-h3 text-text-primary">
              {isPersona ? 'Default persona' : 'Default voice'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSave({ voice: draftVoice, speed: draftSpeed })}
            disabled={!draftVoice}
            className={`flex h-9 items-center rounded-md px-lg text-body transition-colors ${
              draftVoice
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Save
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-xl overflow-y-auto px-2xl pb-2xl pt-md">
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              {isPersona ? 'Select persona' : 'Voice'}
            </label>
            <div className="flex items-center gap-sm">
              <div className="min-w-0 flex-1">
                <VoiceDropdown value={draftVoice} onChange={setDraftVoice} speed={draftSpeed} />
              </div>
              <VoicePreviewButton voiceLabel={draftVoice} speed={draftSpeed} disabled={!draftVoice} />
            </div>
          </div>

          <div className="h-px shrink-0 bg-border" />

          <div className="flex flex-col gap-xs">
            <label className="text-body text-text-primary">Speed</label>
            <div className="flex items-start gap-md">
              <div className="min-w-0 flex-1">
                <div className="relative flex h-10 items-center">
                  <div className="absolute inset-x-0 h-sm rounded-full bg-[#E5E5E5]" />
                  <div
                    className="absolute left-0 h-sm rounded-full bg-ai-brand"
                    style={{ width: `${speedPct}%` }}
                  />
                  <div
                    className="pointer-events-none absolute size-5 -translate-x-1/2 rounded-full border border-border bg-surface shadow-card"
                    style={{ left: `${speedPct}%` }}
                  />
                  <input
                    type="range"
                    min={VOICE_SPEED_MIN}
                    max={VOICE_SPEED_MAX}
                    step={VOICE_SPEED_STEP}
                    value={draftSpeed}
                    onChange={(e) => setDraftSpeed(Number(e.target.value))}
                    aria-label={isPersona ? 'Persona speed' : 'Voice speed'}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <div className="-mt-2 flex justify-between">
                  <span className="text-small text-text-tertiary">Slower</span>
                  <span className="text-small text-text-tertiary">Faster</span>
                </div>
              </div>
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-border-input bg-surface text-body text-text-primary">
                {formatVoiceSpeed(draftSpeed)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function AdditionalVoiceDrawer({
  open,
  initialConfig = null,
  defaultLanguage,
  defaultSpeed,
  defaultVoice,
  onClose,
  onSave,
  terminology = 'persona',
}: AdditionalVoiceDrawerProps) {
  const [draftLabel, setDraftLabel] = useState('')
  const [draftVoice, setDraftVoice] = useState('')
  const [draftLanguage, setDraftLanguage] = useState<AgentLanguageId | typeof SAME_AS_AGENT_LANGUAGE>(
    SAME_AS_AGENT_LANGUAGE,
  )
  const [whenToUse, setWhenToUse] = useState('')
  const [draftSpeed, setDraftSpeed] = useState(defaultSpeed)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [langQuery, setLangQuery] = useState('')
  const langRef = useRef<HTMLDivElement>(null)
  const isEditing = initialConfig != null
  const isPersona = terminology === 'persona'

  useEffect(() => {
    if (!open) {
      stopVoicePreview()
      return
    }
    if (initialConfig) {
      setDraftLabel(initialConfig.label)
      setDraftVoice(initialConfig.voice)
      setDraftLanguage(initialConfig.language)
      setWhenToUse(initialConfig.whenToUse)
      setDraftSpeed(initialConfig.speed)
    } else {
      setDraftVoice('')
      setDraftLanguage(SAME_AS_AGENT_LANGUAGE)
      setWhenToUse('')
      setDraftSpeed(defaultSpeed)
      setDraftLabel('')
    }
    setLangMenuOpen(false)
    setLangQuery('')
  }, [open, initialConfig, defaultLanguage, defaultSpeed])

  useEffect(() => {
    if (!open) return
    function handleClick(e: Event) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selectedLang =
    draftLanguage === SAME_AS_AGENT_LANGUAGE ? getAgentLanguage(defaultLanguage) : getAgentLanguage(draftLanguage)
  const filteredLanguageOptions = AGENT_LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(langQuery.trim().toLowerCase()),
  )
  const speedPct =
    ((draftSpeed - VOICE_SPEED_MIN) / (VOICE_SPEED_MAX - VOICE_SPEED_MIN)) * 100
  const canSave = draftLabel.trim().length > 0 && draftVoice.length > 0

  function handleSave() {
    if (!canSave) return
    onSave({
      label: draftLabel.trim(),
      voice: draftVoice,
      language: draftLanguage === SAME_AS_AGENT_LANGUAGE ? defaultLanguage : draftLanguage,
      whenToUse,
      speed: draftSpeed,
    })
  }

  const languageField = (
    <div className="flex flex-col gap-xs">
      <label className="text-small text-text-secondary">Language</label>
      <div ref={langRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setLangMenuOpen((o) => !o)
            setLangQuery('')
          }}
          className={`flex h-9 w-full items-center gap-sm px-md text-left ${FIELD_BORDER_CLASS}`}
          aria-haspopup="listbox"
          aria-expanded={langMenuOpen}
        >
          {draftLanguage !== SAME_AS_AGENT_LANGUAGE && (
            <LanguageFlag countryCode={selectedLang.countryCode} label={selectedLang.label} />
          )}
          <span className={`flex-1 text-body ${draftLanguage === SAME_AS_AGENT_LANGUAGE ? 'text-text-tertiary' : 'text-text-primary'}`}>
            {draftLanguage === SAME_AS_AGENT_LANGUAGE ? (defaultVoice ? 'Same as agent' : 'Select') : selectedLang.label}
          </span>
          <Icon name="expand_more" size={18} className="text-text-icon" />
        </button>
        {langMenuOpen && (
          <div
            className="absolute left-0 right-0 top-full z-20 mt-xs flex max-h-[320px] flex-col overflow-hidden rounded-sm border border-border bg-surface p-md shadow-dropdown"
            role="listbox"
          >
            <div className="flex h-9 shrink-0 items-center gap-sm rounded-md border border-border-selected bg-surface px-md">
              <Icon name="search" size={20} className="text-text-icon" />
              <input
                value={langQuery}
                onChange={(e) => setLangQuery(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>

            <div className="mt-sm min-h-0 flex-1 overflow-y-auto">
              {defaultVoice && (
                <button
                  type="button"
                  role="option"
                  aria-selected={draftLanguage === SAME_AS_AGENT_LANGUAGE}
                  onClick={() => {
                    setDraftLanguage(SAME_AS_AGENT_LANGUAGE)
                    setLangMenuOpen(false)
                    setLangQuery('')
                  }}
                  className={`flex w-full items-center gap-sm rounded-sm px-sm py-sm text-left hover:bg-surface-hover ${
                    draftLanguage === SAME_AS_AGENT_LANGUAGE ? 'bg-surface-selected' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                    Same as agent
                  </span>
                  {draftLanguage === SAME_AS_AGENT_LANGUAGE && (
                    <Icon name="check" size={18} className="shrink-0 text-text-primary" />
                  )}
                </button>
              )}
              {filteredLanguageOptions.map((lang) => {
                const isSelected = draftLanguage === lang.id
                return (
                  <button
                    key={lang.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setDraftLanguage(lang.id as AgentLanguageId)
                      setLangMenuOpen(false)
                      setLangQuery('')
                    }}
                    className={`flex w-full items-center gap-sm rounded-sm px-sm py-sm text-left hover:bg-surface-hover ${
                      isSelected ? 'bg-surface-selected' : ''
                    }`}
                  >
                    <LanguageFlag countryCode={lang.countryCode} label={lang.label} />
                    <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                      {lang.label}
                    </span>
                    {isSelected && (
                      <Icon name="check" size={18} className="shrink-0 text-text-primary" />
                    )}
                  </button>
                )
              })}

              {filteredLanguageOptions.length === 0 && (
                <p className="px-sm py-sm text-body text-text-tertiary">No results.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-[650px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-h3 text-text-primary">
              {isPersona
                ? isEditing
                  ? 'Additional persona'
                  : 'Add additional persona'
                : isEditing
                  ? 'Additional voice'
                  : 'Add additional voice'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`flex h-9 items-center rounded-md px-lg text-body transition-colors ${
              canSave
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            {isEditing ? 'Save' : 'Add'}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-xl overflow-y-auto px-2xl pb-2xl pt-md">
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              {isPersona ? 'Label' : 'Voice label'}
            </label>
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="e.g. Andrea_Spanish"
              className={`h-9 ${INPUT_CLASS} placeholder:text-text-tertiary`}
            />
          </div>

          {languageField}

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              {isPersona ? 'Select persona' : 'Voice'}
            </label>
            <div className="flex items-center gap-sm">
              <div className="min-w-0 flex-1">
                <VoiceDropdown value={draftVoice} onChange={setDraftVoice} speed={draftSpeed} />
              </div>
              <VoicePreviewButton voiceLabel={draftVoice} speed={draftSpeed} disabled={!draftVoice} />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              {isPersona
                ? 'When should the agent use this persona?'
                : 'When should the agent use this voice?'}
            </label>
            <textarea
              value={whenToUse}
              onChange={(e) => setWhenToUse(e.target.value)}
              rows={4}
              placeholder={
                isPersona
                  ? 'E.g. use this persona when the caller speaks Spanish or starts the conversation in Spanish'
                  : 'E.g. use this voice when the caller speaks Spanish or starts the conversation in Spanish'
              }
              className={`${INPUT_CLASS} resize-none py-sm placeholder:text-text-tertiary`}
            />
          </div>

          <div className="h-px shrink-0 bg-border" />

          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <label className="text-body text-text-primary">Speed</label>
              {draftSpeed !== defaultSpeed && (
                <button
                  type="button"
                  onClick={() => setDraftSpeed(defaultSpeed)}
                  className="text-small text-text-action hover:text-primary-hover"
                >
                  Reset to default
                </button>
              )}
            </div>
            <div className="flex items-start gap-md">
              <div className="min-w-0 flex-1">
                <div className="relative flex h-10 items-center">
                  <div className="absolute inset-x-0 h-sm rounded-full bg-[#E5E5E5]" />
                  <div
                    className="absolute left-0 h-sm rounded-full bg-ai-brand"
                    style={{ width: `${speedPct}%` }}
                  />
                  <div
                    className="pointer-events-none absolute size-5 -translate-x-1/2 rounded-full border border-border bg-surface shadow-card"
                    style={{ left: `${speedPct}%` }}
                  />
                  <input
                    type="range"
                    min={VOICE_SPEED_MIN}
                    max={VOICE_SPEED_MAX}
                    step={VOICE_SPEED_STEP}
                    value={draftSpeed}
                    onChange={(e) => setDraftSpeed(Number(e.target.value))}
                    aria-label={isPersona ? 'Persona speed' : 'Voice speed'}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <div className="-mt-2 flex justify-between">
                  <span className="text-small text-text-tertiary">Slower</span>
                  <span className="text-small text-text-tertiary">Faster</span>
                </div>
              </div>
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-border-input bg-surface text-body text-text-primary">
                {formatVoiceSpeed(draftSpeed)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
