import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import {
  DataTable,
  Icon,
  LanguageFlag,
  LanguageSelectMenu,
  ProcedureSelectCard,
  ProceduresPickerDrawer,
  Toast,
  TopNav,
} from '../components'
import {
  AGENT_LANGUAGES,
  getAgentLanguage,
  type AgentLanguageId,
} from '../data/agentLanguages'
import type { Column } from '../components'
import type { ProcedurePickerItem } from '../components/ProceduresPickerDrawer/ProceduresPickerDrawer.types'
import {
  DEFAULT_WIZARD_PROCEDURE_IDS,
  HEALTHCARE_PROCEDURE_CATALOG,
  type HealthcareProcedureCatalogItem,
} from '../data/healthcareProcedureCatalog'
import {
  DEFAULT_AGENT_SELECTED_INTEGRATION_ID,
  DEFAULT_WIZARD_CONNECTED_INTEGRATION_IDS,
} from '../data/healthcareIntegrations'
import { WIZARD_LOCATIONS } from '../data/wizardLocations'
import iconFacebook from '../assets/icon-facebook.svg'
import iconInstagram from '../assets/icon-instagram.svg'
import { TextSetupSettings, WebChatSetupSettings } from './channelSetupSettings'
import {
  DEFAULT_TEXT_CHANNEL_SETTINGS,
  DEFAULT_WEBCHAT_CHANNEL_SETTINGS,
  type TextChannelSettings,
  type WebChatChannelSettings,
} from './channelSetupSettings.types'
import { ReviewSummaryStep } from './ReviewSummaryStep'
import type { WizardAgentDraft } from '../data/wizardAgentConfig.types'
import {
  ExpandIcon,
  VariableIcon,
} from '../workflow/Molecules/Inputs/PromptToolbarIcons.jsx'
import FieldPickerModal from '../workflow/Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx'

interface NewFrontdeskAgentSetupScreenProps {
  onBack: () => void
  onCancel: () => void
  onComplete?: (draft: WizardAgentDraft) => void
}

const STEPS = [
  { id: 1, label: 'Getting started' },
  { id: 2, label: 'Configure agent' },
  { id: 3, label: 'Select channels' },
  { id: 4, label: 'Select procedures' },
  { id: 5, label: 'Review summary' },
] as const

const PROGRESS_BY_STEP: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
}

const DEFAULT_SYSTEM_PROMPT = `# Personality
You are Myna, the elegant and attentive reservations specialist at the Grand Hotel. You make every caller feel like a VIP — refined, warm, and effortlessly capable. You handle reservation requests with the calm efficiency of someone who has booked thousands of stays.

# Environment
You handle inbound calls for hotel reservations: new bookings, modifications, cancellations, and general questions about the property. Callers may be planning a special trip, calling on behalf of a guest, or checking on a stay they've already booked. Booking system, room types, and rate plans are managed by the workspace owner — only quote details that are explicitly available to you in this conversation.

# Tone
- Warm and refined hospitality — never stuffy.
- Attentive to details: dates, room preferences, special requests (anniversary, accessibility, dietary).`

const CHANNELS = [
  { id: 'voice', label: 'Voice call', icon: 'call' },
  { id: 'webchat', label: 'Web chat', icon: 'chat' },
  { id: 'text', label: 'Text', icon: 'sms' },
  { id: 'email', label: 'Email', icon: 'mail' },
  {
    id: 'facebook',
    label: 'Facebook',
    iconSrc: iconFacebook,
    disabled: true,
    note: 'No Facebook account is connected for the selected locations',
  },
  { id: 'instagram', label: 'Instagram', iconSrc: iconInstagram },
] as const

type ChannelId = (typeof CHANNELS)[number]['id']
type RecordingMode = 'off' | 'announced' | 'silent'

const CONVERSATION_CHANNEL_IDS: ChannelId[] = ['webchat', 'text', 'facebook', 'instagram']

function isChannelLockedOut(id: ChannelId, selectedChannels: Set<ChannelId>): boolean {
  if (selectedChannels.has(id)) return false
  if (selectedChannels.has('voice')) return true
  if (selectedChannels.has('email')) return true
  if (
    (id === 'voice' || id === 'email') &&
    CONVERSATION_CHANNEL_IDS.some((c) => selectedChannels.has(c))
  ) {
    return true
  }
  return false
}

const FIELD_BORDER_CLASS =
  'rounded-sm border border-border-input bg-surface transition-colors focus:border-primary focus:outline-none focus-visible:border-primary'

const INPUT_CLASS = `w-full px-md text-body text-text-primary ${FIELD_BORDER_CLASS}`

const VOICES = [
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

function stepMarkerClass({
  isActive,
  isComplete,
  canNavigate,
}: {
  isActive: boolean
  isComplete: boolean
  canNavigate: boolean
}) {
  const hoverClass = canNavigate
    ? isComplete
      ? 'hover:bg-primary-hover'
      : isActive
        ? 'hover:bg-surface-hover'
        : 'hover:border-primary hover:text-primary'
    : ''

  if (isComplete) {
    return `flex size-5 shrink-0 items-center justify-center rounded-full bg-primary transition-colors ${hoverClass}`
  }

  if (isActive) {
    return `flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-surface text-small text-primary transition-colors ${hoverClass}`
  }

  return `flex size-5 shrink-0 items-center justify-center rounded-full border border-border-selected bg-surface text-small text-text-tertiary transition-colors ${hoverClass}`
}

function StepIndicator({
  currentStep,
  maxStepReached,
  onStepChange,
}: {
  currentStep: number
  maxStepReached: number
  onStepChange: (step: number) => void
}) {
  return (
    <nav aria-label="Setup progress">
      <ol className="flex flex-col">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep
          // Once a later step is reached, earlier steps stay complete even when revisiting.
          const isComplete = step.id < maxStepReached
          const isLast = index === STEPS.length - 1
          const canNavigate = step.id <= maxStepReached

          return (
            <li key={step.id} className="flex gap-md">
              <div className="flex w-5 shrink-0 flex-col items-center">
                <button
                  type="button"
                  disabled={!canNavigate}
                  aria-label={step.label}
                  onClick={() => onStepChange(step.id)}
                  className={`${stepMarkerClass({ isActive, isComplete, canNavigate })} ${
                    canNavigate ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {isComplete ? (
                    <Icon name="check" size={16} fill weight={600} className="text-white" />
                  ) : (
                    step.id
                  )}
                </button>
                {!isLast && <div className="h-[32px] w-px bg-border" aria-hidden />}
              </div>
              <button
                type="button"
                disabled={!canNavigate}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onStepChange(step.id)}
                className={`flex h-7 min-w-0 flex-1 items-center text-left text-body ${
                  canNavigate ? 'cursor-pointer' : 'cursor-default'
                } ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}
              >
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function SettingsCheckboxBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={11} fill weight={600} className="text-white" />}
    </span>
  )
}

function ChannelsMultiSelect({
  selectedChannels,
  onToggleChannel,
}: {
  selectedChannels: Set<ChannelId>
  onToggleChannel: (id: ChannelId) => void
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)

  const openMenu = () => {
    const rect = fieldRef.current?.getBoundingClientRect()
    if (!rect) return
    setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen((o) => !o)
  }

  const selectedChannelDefs = CHANNELS.filter((c) => selectedChannels.has(c.id))

  return (
    <>
      <div
        ref={fieldRef}
        className={`flex min-h-9 w-full flex-wrap items-center gap-sm rounded-sm border bg-surface py-xs pr-sm transition-colors ${
          selectedChannelDefs.length === 0 ? 'pl-md' : 'pl-sm'
        } ${open ? 'border-primary' : 'border-border-input'}`}
      >
        {selectedChannelDefs.map((channel) => (
          <span
            key={channel.id}
            className="flex h-7 items-center gap-xs rounded-sm bg-chip-neutral-bg pl-sm pr-xs text-body text-text-primary"
          >
            {'iconSrc' in channel ? (
              <img src={channel.iconSrc} alt="" className="size-4 shrink-0" />
            ) : (
              <Icon name={channel.icon} size={16} className="shrink-0 text-text-icon" />
            )}
            {channel.label}
            <button
              type="button"
              aria-label={`Remove ${channel.label}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleChannel(channel.id)
              }}
              className="flex size-5 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-l2"
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={openMenu}
          className="flex h-9 flex-1 items-center justify-between gap-sm"
        >
          {selectedChannelDefs.length === 0 && (
            <span className="text-body text-text-tertiary">Select</span>
          )}
          <Icon
            name={open ? 'expand_less' : 'expand_more'}
            size={20}
            className="ml-auto shrink-0 text-text-icon"
          />
        </button>
      </div>
      {open && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="fixed z-[110] rounded-sm border border-border bg-surface shadow-dropdown"
            style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
          >
            <div className="max-h-[320px] overflow-y-auto py-xs">
              {CHANNELS.map((channel) => {
                const isSelected = selectedChannels.has(channel.id)
                const isDisabled =
                  ('disabled' in channel && channel.disabled) ||
                  isChannelLockedOut(channel.id, selectedChannels)
                return (
                  <div
                    key={channel.id}
                    onClick={() => !isDisabled && onToggleChannel(channel.id)}
                    className={`flex items-start gap-sm px-md py-sm ${
                      isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-surface-hover'
                    }`}
                  >
                    <span className="mt-[2px]">
                      <SettingsCheckboxBox checked={isSelected} />
                    </span>
                    <span className="mt-[1px] flex shrink-0 items-center px-xs">
                      {'iconSrc' in channel ? (
                        <img src={channel.iconSrc} alt="" className="size-4" />
                      ) : (
                        <Icon name={channel.icon} size={16} className="text-text-icon" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body text-text-primary">{channel.label}</p>
                      {'note' in channel && channel.note && (
                        <p className="mt-[2px] text-small text-text-tertiary">{channel.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <span className="block h-px w-full bg-border" />
            <div className="flex justify-end p-lg">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm bg-primary px-lg py-[7px] text-body text-white transition-colors hover:bg-primary-hover"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function VoiceDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const options = VOICES

  const openMenu = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen((o) => !o)
  }

  const stopPlaying = () => {
    window.speechSynthesis.cancel()
    setPlaying(null)
  }

  const togglePreview = (opt: (typeof VOICES)[number], e: MouseEvent) => {
    e.stopPropagation()
    if (playing === opt.label) {
      stopPlaying()
      return
    }
    stopPlaying()
    const utter = new SpeechSynthesisUtterance(opt.preview)
    utter.onend = () => setPlaying(null)
    setPlaying(opt.label)
    window.speechSynthesis.speak(utter)
  }

  const select = (label: string) => {
    stopPlaying()
    onChange(label)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className={`flex h-9 w-full items-center gap-sm rounded-sm border bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary ${
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

const VOICE_SPEED_MIN = 0.5
const VOICE_SPEED_MAX = 1.5
const VOICE_SPEED_STEP = 0.01

function formatVoiceSpeed(value: number): string {
  return value.toFixed(2)
}

function DefaultVoiceDrawer({
  open,
  voice,
  speed,
  onClose,
  onSave,
}: {
  open: boolean
  voice: string
  speed: number
  onClose: () => void
  onSave: (next: { voice: string; speed: number }) => void
}) {
  const [draftVoice, setDraftVoice] = useState(voice)
  const [draftSpeed, setDraftSpeed] = useState(speed)

  useEffect(() => {
    if (open) {
      const hasMatchingVoice = VOICES.some((opt) => opt.label === voice)
      setDraftVoice(hasMatchingVoice ? voice : VOICES[0]?.label || '')
      setDraftSpeed(speed)
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
            <h2 className="text-h3 text-text-primary">Default voice</h2>
          </div>
          <button
            type="button"
            onClick={() => onSave({ voice: draftVoice, speed: draftSpeed })}
            disabled={!draftVoice}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
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
            <label className="text-small text-text-secondary">Voice</label>
            <VoiceDropdown value={draftVoice} onChange={setDraftVoice} />
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
                    aria-label="Voice speed"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <div className="-mt-2 flex justify-between">
                  <span className="text-small text-text-tertiary">Slower</span>
                  <span className="text-small text-text-tertiary">Faster</span>
                </div>
              </div>
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-sm border border-border-input bg-surface text-body text-text-primary">
                {formatVoiceSpeed(draftSpeed)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

interface AdditionalVoiceConfig {
  label: string
  voice: string
  language: AgentLanguageId
  whenToUse: string
  speed: number
}

const SAME_AS_AGENT_LANGUAGE = '__same_as_agent__'

function AdditionalVoiceDrawer({
  open,
  initialConfig = null,
  defaultLanguage,
  defaultSpeed,
  defaultVoice,
  onClose,
  onSave,
}: {
  open: boolean
  initialConfig?: AdditionalVoiceConfig | null
  defaultLanguage: AgentLanguageId
  defaultSpeed: number
  defaultVoice: string
  onClose: () => void
  onSave: (config: AdditionalVoiceConfig) => void
}) {
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

  useEffect(() => {
    if (!open) return
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
              {isEditing ? 'Additional voice' : 'Add additional voice'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
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
            <label className="text-small text-text-secondary">Voice label</label>
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="e.g. Andrea_Spanish"
              className={`h-9 ${INPUT_CLASS} placeholder:text-text-tertiary`}
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Voice</label>
            <VoiceDropdown value={draftVoice} onChange={setDraftVoice} />
          </div>

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
                  <div className="flex h-9 shrink-0 items-center gap-sm rounded-sm border border-border-selected bg-surface px-md">
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

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">
              When should the agent use this voice?
            </label>
            <textarea
              value={whenToUse}
              onChange={(e) => setWhenToUse(e.target.value)}
              rows={4}
              placeholder="E.g. use this voice when the caller speaks Spanish or starts the conversation in Spanish"
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
                    aria-label="Voice speed"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <div className="-mt-2 flex justify-between">
                  <span className="text-small text-text-tertiary">Slower</span>
                  <span className="text-small text-text-tertiary">Faster</span>
                </div>
              </div>
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-sm border border-border-input bg-surface text-body text-text-primary">
                {formatVoiceSpeed(draftSpeed)}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function VoiceChannelSettings({
  language,
  voice,
  onVoiceChange,
  voiceSpeed,
  onVoiceSpeedChange,
  additionalVoices,
  onAdditionalVoicesChange,
  additionalVoiceConfigs,
  onAdditionalVoiceConfigsChange,
  greeting,
  onGreetingChange,
  recording,
  onRecordingChange,
  consent,
  onConsentChange,
}: {
  language: AgentLanguageId
  voice: string
  onVoiceChange: (value: string) => void
  voiceSpeed: number
  onVoiceSpeedChange: (value: number) => void
  additionalVoices: string[]
  onAdditionalVoicesChange: (values: string[]) => void
  additionalVoiceConfigs: AdditionalVoiceConfig[]
  onAdditionalVoiceConfigsChange: (configs: AdditionalVoiceConfig[]) => void
  greeting: string
  onGreetingChange: (value: string) => void
  recording: RecordingMode
  onRecordingChange: (value: RecordingMode) => void
  consent: string
  onConsentChange: (value: string) => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [additionalDrawerOpen, setAdditionalDrawerOpen] = useState(false)
  const [editingAdditionalVoice, setEditingAdditionalVoice] = useState<AdditionalVoiceConfig | null>(
    null,
  )

  function handleDefaultVoiceSave(next: { voice: string; speed: number }) {
    onVoiceChange(next.voice)
    onVoiceSpeedChange(next.speed)
    if (additionalVoices.includes(next.voice)) {
      onAdditionalVoicesChange(additionalVoices.filter((v) => v !== next.voice))
      onAdditionalVoiceConfigsChange(additionalVoiceConfigs.filter((cfg) => cfg.label !== next.voice))
    }
    setDrawerOpen(false)
  }

  function openAddAdditionalVoice() {
    setEditingAdditionalVoice(null)
    setAdditionalDrawerOpen(true)
  }

  function openEditAdditionalVoice(config: AdditionalVoiceConfig) {
    setEditingAdditionalVoice(config)
    setAdditionalDrawerOpen(true)
  }

  function closeAdditionalDrawer() {
    setAdditionalDrawerOpen(false)
    setEditingAdditionalVoice(null)
  }

  function handleSaveAdditionalVoice(config: AdditionalVoiceConfig) {
    if (editingAdditionalVoice) {
      const nextConfigs = additionalVoiceConfigs.map((cfg) =>
        cfg.label === editingAdditionalVoice.label ? config : cfg,
      )
      onAdditionalVoiceConfigsChange(nextConfigs)
      onAdditionalVoicesChange(nextConfigs.map((cfg) => cfg.label))
    } else {
      onAdditionalVoiceConfigsChange([...additionalVoiceConfigs, config])
      onAdditionalVoicesChange([...additionalVoices, config.label])
    }
    closeAdditionalDrawer()
  }

  function handleRemoveAdditionalVoice(label: string) {
    onAdditionalVoiceConfigsChange(additionalVoiceConfigs.filter((cfg) => cfg.label !== label))
    onAdditionalVoicesChange(additionalVoices.filter((v) => v !== label))
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-secondary">
          Default voice <span className="text-chip-danger-text">*</span>
        </label>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-full items-center gap-sm rounded-sm border border-border-input bg-surface pl-md pr-sm transition-colors hover:bg-surface-l2 focus:border-primary focus:outline-none focus-visible:border-primary"
        >
          <span
            className={`min-w-0 flex-1 truncate text-left text-body ${
              voice ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            {voice || 'Select'}
          </span>
          <Icon name="chevron_right" size={20} className="shrink-0 text-text-icon" />
        </button>
        <DefaultVoiceDrawer
          open={drawerOpen}
          voice={voice}
          speed={voiceSpeed}
          onClose={() => setDrawerOpen(false)}
          onSave={handleDefaultVoiceSave}
        />
      </div>

      <div className="flex flex-col gap-xs">
        {additionalVoiceConfigs.length > 0 && (
          <label className="text-small text-text-secondary">Additional voice</label>
        )}
        {additionalVoiceConfigs.length > 0 && (
        <div className="flex flex-col gap-lg rounded-sm border border-border-input bg-surface px-[10px] py-sm">
          <div className="flex flex-wrap gap-sm">
              {additionalVoiceConfigs.map((cfg) => {
                const lang = getAgentLanguage(cfg.language)
                return (
                  <button
                    key={cfg.label}
                    type="button"
                    onClick={() => openEditAdditionalVoice(cfg)}
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
                        handleRemoveAdditionalVoice(cfg.label)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveAdditionalVoice(cfg.label)
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
            onClick={openAddAdditionalVoice}
            className="flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover"
          >
            <Icon name="add_circle" size={18} className="text-primary" />
            Add
          </button>
        </div>
        )}
        <button
          type="button"
          onClick={openAddAdditionalVoice}
          className={`flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover ${additionalVoiceConfigs.length > 0 ? 'hidden' : ''}`}
        >
          <Icon name="add_circle" size={18} className="text-primary" />
          Add additional voice
        </button>
        <AdditionalVoiceDrawer
          open={additionalDrawerOpen}
          initialConfig={editingAdditionalVoice}
          defaultLanguage={language}
          defaultSpeed={voiceSpeed}
          defaultVoice={voice}
          onClose={closeAdditionalDrawer}
          onSave={handleSaveAdditionalVoice}
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-secondary">Greeting message</label>
        <textarea
          value={greeting}
          onChange={(e) => onGreetingChange(e.target.value)}
          rows={4}
          placeholder="e.g. Thank you for calling — my name is Myna, your virtual assistant. How can I help you today?"
          className={`${INPUT_CLASS} resize-none py-sm placeholder:text-text-tertiary`}
        />
      </div>

      <div>
        <p className="text-small text-text-secondary">Recording</p>
        <div className="mt-sm flex flex-col gap-sm">
          <label className="flex cursor-pointer items-center gap-sm">
            <input
              type="radio"
              name="wizard-recording"
              checked={recording === 'off'}
              onChange={() => onRecordingChange('off')}
              className="accent-primary"
            />
            <span className="text-body text-text-primary">Off</span>
          </label>
          <div>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="wizard-recording"
                checked={recording === 'announced'}
                onChange={() => onRecordingChange('announced')}
                className="accent-primary"
              />
              <span className="text-body text-text-primary">Record with announced consent</span>
            </label>
            {recording === 'announced' && (
              <div className="mt-sm pl-2xl">
                <label className="mb-xs block text-small text-text-secondary">Consent message</label>
                <textarea
                  value={consent}
                  onChange={(e) => onConsentChange(e.target.value)}
                  rows={3}
                  placeholder="e.g. This call may be recorded for quality and training purposes."
                  className={`${INPUT_CLASS} resize-none py-sm placeholder:text-text-tertiary`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChannelAccordion({
  title,
  children,
  defaultOpen = true,
  collapsible = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = collapsible ? open : true

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-l2">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-full items-center justify-between px-lg text-left hover:bg-surface-l2"
        >
          <span className="text-body text-text-primary">{title}</span>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={20} className="shrink-0 text-text-icon" />
        </button>
      ) : (
        <div className="flex h-14 items-center px-lg">
          <span className="text-body text-text-primary">{title}</span>
        </div>
      )}
      {isOpen && <div className="px-lg pb-lg pt-md">{children}</div>}
    </div>
  )
}

function GettingStartedStep({
  agentName,
  onAgentNameChange,
  locations,
  selectedLocationIds,
  onToggleLocation,
  onToggleAllLocations,
}: {
  agentName: string
  onAgentNameChange: (value: string) => void
  locations: { id: string; name: string; address: string }[]
  selectedLocationIds: string[]
  onToggleLocation: (id: string) => void
  onToggleAllLocations: () => void
}) {
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  return (
    <div className="flex w-full flex-col gap-xl">
      <div>
        <h2 className="text-h3 text-text-primary">Getting started</h2>
      </div>

      <div className="flex w-full max-w-[978px] flex-col gap-sm">
        <label className="text-body text-text-primary">Name</label>
        <input
          ref={nameInputRef}
          type="text"
          value={agentName}
          onChange={(e) => onAgentNameChange(e.target.value)}
          placeholder="e.g. Myna, Front desk AI, Scheduling assistant"
          className={`${INPUT_CLASS} h-9 placeholder:text-text-tertiary`}
        />
      </div>

      <SelectLocationsStep
        locations={locations}
        selectedIds={selectedLocationIds}
        onToggleLocation={onToggleLocation}
        onToggleAll={onToggleAllLocations}
      />
    </div>
  )
}

function ConfigureAgentStep({
  systemPrompt,
  onSystemPromptChange,
  language,
  onLanguageChange,
  additionalLanguages,
  onAdditionalLanguagesChange,
}: {
  systemPrompt: string
  onSystemPromptChange: (value: string) => void
  language: string
  onLanguageChange: (value: string) => void
  additionalLanguages: string[]
  onAdditionalLanguagesChange: (ids: string[]) => void
}) {
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [additionalFieldVisible, setAdditionalFieldVisible] = useState(
    additionalLanguages.length > 0,
  )
  const [additionalMenuOpen, setAdditionalMenuOpen] = useState(false)
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const additionalRef = useRef<HTMLDivElement>(null)
  const fieldsBtnRef = useRef<HTMLButtonElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null)

  function savePromptSelection() {
    const el = promptRef.current
    if (!el) return
    savedSelectionRef.current = { start: el.selectionStart, end: el.selectionEnd }
  }

  function insertFieldIntoPrompt(fieldValue: string) {
    const el = promptRef.current
    if (!el) {
      onSystemPromptChange(`${systemPrompt}{{${fieldValue}}}`)
      return
    }
    const token = `{{${fieldValue}}}`
    const start = savedSelectionRef.current?.start ?? el.selectionStart
    const end = savedSelectionRef.current?.end ?? el.selectionEnd
    const next = `${systemPrompt.slice(0, start)}${token}${systemPrompt.slice(end)}`
    onSystemPromptChange(next)
    const caret = start + token.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
    savedSelectionRef.current = null
  }

  useEffect(() => {
    function handleClick(e: Event) {
      const target = e.target as Node
      if (langRef.current && !langRef.current.contains(target)) {
        setLangMenuOpen(false)
      }
      if (additionalRef.current && !additionalRef.current.contains(target)) {
        setAdditionalMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedLang = getAgentLanguage(language)
  const additionalOptions = AGENT_LANGUAGES.filter((l) => l.id !== language)
  const selectedAdditional = additionalLanguages
    .map((id) => getAgentLanguage(id))
    .filter((l) => l.id !== language)

  function handlePrimaryLanguageChange(id: string) {
    onLanguageChange(id)
    if (additionalLanguages.includes(id)) {
      onAdditionalLanguagesChange(additionalLanguages.filter((x) => x !== id))
    }
    setLangMenuOpen(false)
  }

  function revealAdditionalLanguage() {
    setAdditionalFieldVisible(true)
    setLangMenuOpen(false)
    setAdditionalMenuOpen(true)
  }

  return (
    <div className="flex w-full max-w-[978px] flex-col gap-xl">
      <div>
        <h2 className="text-h3 text-text-primary">Configure agent</h2>
      </div>

      {/* System prompt */}
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-xs">
          <label className="text-body text-text-primary">System prompt</label>
          <span className="text-body text-chip-danger-text" aria-hidden>
            *
          </span>
        </div>
        <div
          className={`flex flex-col overflow-hidden bg-surface ${FIELD_BORDER_CLASS} focus-within:border-primary`}
        >
          <textarea
            ref={promptRef}
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            onSelect={savePromptSelection}
            onBlur={savePromptSelection}
            rows={12}
            className="h-[360px] w-full resize-y bg-transparent px-md py-sm text-body leading-[1.55] text-text-primary outline-none"
            aria-required
          />
          <div className="flex items-center gap-xs px-sm py-[6px]">
            <button
              ref={fieldsBtnRef}
              type="button"
              title="Insert variable"
              aria-label="Insert variable"
              aria-expanded={fieldPickerOpen}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                savePromptSelection()
                setFieldPickerOpen(true)
              }}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <VariableIcon />
            </button>
            <button
              type="button"
              title="Expand"
              aria-label="Expand"
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <ExpandIcon />
            </button>
          </div>
        </div>
        {fieldPickerOpen && (
          <FieldPickerModal
            onClose={() => setFieldPickerOpen(false)}
            onSelectField={(value: string) => {
              insertFieldIntoPrompt(value)
              setFieldPickerOpen(false)
            }}
            anchorEl={fieldsBtnRef.current}
          />
        )}
      </div>

      {/* Language */}
      <div className="flex flex-col gap-2xl">
        <div className="flex flex-col gap-sm">
          <div>
            <label className="text-body text-text-primary">Language</label>
            <p className="mt-[2px] text-small text-text-secondary">
              Choose the default and additional languages the agent will communicate in.
            </p>
          </div>

          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen((o) => !o)
                setAdditionalMenuOpen(false)
              }}
              className={`flex h-9 w-full items-center gap-sm px-md text-left ${FIELD_BORDER_CLASS}`}
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
            >
              <LanguageFlag countryCode={selectedLang.countryCode} label={selectedLang.label} />
              <span className="flex-1 text-body text-text-primary">{selectedLang.label}</span>
              <Icon name="expand_more" size={18} className="text-text-icon" />
            </button>
            {langMenuOpen && (
              <LanguageSelectMenu
                options={AGENT_LANGUAGES}
                value={language}
                onSelect={handlePrimaryLanguageChange}
              />
            )}
          </div>
        </div>

        {additionalFieldVisible ? (
          <div className="flex flex-col gap-sm">
            <label className="text-body text-text-primary">Additional language</label>
            <div ref={additionalRef} className="relative">
              <div
                className={`flex min-h-9 w-full items-center gap-sm rounded-sm border bg-surface py-xs pr-sm transition-colors ${
                  selectedAdditional.length === 0 ? 'pl-md' : 'pl-xs'
                } ${additionalMenuOpen ? 'border-primary' : 'border-border-input'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAdditionalMenuOpen((o) => !o)
                    setLangMenuOpen(false)
                  }}
                  className="flex min-h-7 min-w-0 flex-1 flex-wrap items-center gap-sm text-left"
                  aria-haspopup="listbox"
                  aria-expanded={additionalMenuOpen}
                >
                  {selectedAdditional.length === 0 ? (
                    <span className="text-body text-text-tertiary">Select</span>
                  ) : (
                    selectedAdditional.map((lang) => (
                      <span
                        key={lang.id}
                        className="flex h-7 items-center gap-xs rounded-sm bg-chip-neutral-bg px-sm text-body text-text-primary"
                      >
                        <LanguageFlag
                          countryCode={lang.countryCode}
                          label={lang.label}
                          size="sm"
                        />
                        {lang.label}
                      </span>
                    ))
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Toggle additional languages"
                  onClick={() => {
                    setAdditionalMenuOpen((o) => !o)
                    setLangMenuOpen(false)
                  }}
                  className="flex size-7 shrink-0 items-center justify-center text-text-icon"
                >
                  <Icon name="expand_more" size={18} />
                </button>
              </div>
              {additionalMenuOpen && (
                <LanguageSelectMenu
                  multi
                  options={additionalOptions}
                  values={additionalLanguages.filter((id) => id !== language)}
                  onChange={onAdditionalLanguagesChange}
                />
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={revealAdditionalLanguage}
            className="flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover"
          >
            <Icon name="add_circle" size={18} className="text-primary" />
            Add additional language
          </button>
        )}
      </div>
    </div>
  )
}

function ConfigureChannelsStep({
  selectedChannels,
  onToggleChannel,
  language,
  voice,
  onVoiceChange,
  voiceSpeed,
  onVoiceSpeedChange,
  additionalVoices,
  onAdditionalVoicesChange,
  additionalVoiceConfigs,
  onAdditionalVoiceConfigsChange,
  greeting,
  onGreetingChange,
  recording,
  onRecordingChange,
  consent,
  onConsentChange,
  webchatSettings,
  onWebchatSettingsChange,
  textSettings,
  onTextSettingsChange,
  chatAgentNameError = false,
}: {
  selectedChannels: Set<ChannelId>
  onToggleChannel: (id: ChannelId) => void
  language: AgentLanguageId
  voice: string
  onVoiceChange: (value: string) => void
  voiceSpeed: number
  onVoiceSpeedChange: (value: number) => void
  additionalVoices: string[]
  onAdditionalVoicesChange: (values: string[]) => void
  additionalVoiceConfigs: AdditionalVoiceConfig[]
  onAdditionalVoiceConfigsChange: (configs: AdditionalVoiceConfig[]) => void
  greeting: string
  onGreetingChange: (value: string) => void
  recording: RecordingMode
  onRecordingChange: (value: RecordingMode) => void
  consent: string
  onConsentChange: (value: string) => void
  webchatSettings: WebChatChannelSettings
  onWebchatSettingsChange: (patch: Partial<WebChatChannelSettings>) => void
  textSettings: TextChannelSettings
  onTextSettingsChange: (patch: Partial<TextChannelSettings>) => void
  chatAgentNameError?: boolean
}) {
  const useAccordion = selectedChannels.size > 1

  return (
    <div className="flex w-full max-w-[978px] flex-col gap-xl">
      <div>
        <h2 className="text-h3 text-text-primary">Select channels</h2>
      </div>

      <div className="flex flex-col gap-sm">
        <div>
          <label className="text-body text-text-primary">Channels</label>
          <p className="mt-[2px] text-small text-text-secondary">
            Choose the channels this agent should handle
          </p>
        </div>
        <ChannelsMultiSelect selectedChannels={selectedChannels} onToggleChannel={onToggleChannel} />
      </div>

      <div className="flex flex-col gap-lg">
        {selectedChannels.has('voice') && (
          <ChannelAccordion title="Voice call settings" collapsible={false}>
            <VoiceChannelSettings
              language={language}
              voice={voice}
              onVoiceChange={onVoiceChange}
              voiceSpeed={voiceSpeed}
              onVoiceSpeedChange={onVoiceSpeedChange}
              additionalVoices={additionalVoices}
              onAdditionalVoicesChange={onAdditionalVoicesChange}
              additionalVoiceConfigs={additionalVoiceConfigs}
              onAdditionalVoiceConfigsChange={onAdditionalVoiceConfigsChange}
              greeting={greeting}
              onGreetingChange={onGreetingChange}
              recording={recording}
              onRecordingChange={onRecordingChange}
              consent={consent}
              onConsentChange={onConsentChange}
            />
          </ChannelAccordion>
        )}

        {selectedChannels.has('webchat') && (
          <ChannelAccordion title="Web chat settings" collapsible={useAccordion}>
            <WebChatSetupSettings
              settings={webchatSettings}
              onSettingsChange={onWebchatSettingsChange}
              chatAgentNameError={chatAgentNameError}
            />
          </ChannelAccordion>
        )}

        {selectedChannels.has('text') && (
          <ChannelAccordion title="Text settings" collapsible={useAccordion}>
            <TextSetupSettings
              settings={textSettings}
              onSettingsChange={onTextSettingsChange}
            />
          </ChannelAccordion>
        )}

        {selectedChannels.has('email') && (
          <ChannelAccordion title="Email settings" collapsible={false}>
            <p className="text-body text-text-secondary">
              No additional configuration required for this channel yet.
            </p>
          </ChannelAccordion>
        )}

        {selectedChannels.has('facebook') && (
          <ChannelAccordion title="Facebook settings" collapsible={useAccordion}>
            <p className="text-body text-text-secondary">
              No additional configuration required for this channel yet.
            </p>
          </ChannelAccordion>
        )}

        {selectedChannels.has('instagram') && (
          <ChannelAccordion title="Instagram settings" collapsible={useAccordion}>
            <p className="text-body text-text-secondary">
              No additional configuration required for this channel yet.
            </p>
          </ChannelAccordion>
        )}
      </div>
    </div>
  )
}

function LocationCheckbox({
  checked,
  indeterminate = false,
}: {
  checked: boolean
  indeterminate?: boolean
}) {
  return (
    <span
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        checked || indeterminate ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {indeterminate ? (
        <Icon name="remove" size={12} fill weight={600} className="text-white" />
      ) : (
        checked && <Icon name="check" size={12} fill weight={600} className="text-white" />
      )}
    </span>
  )
}

function SelectLocationsStep({
  locations,
  selectedIds,
  onToggleLocation,
  onToggleAll,
}: {
  locations: { id: string; name: string; address: string }[]
  selectedIds: string[]
  onToggleLocation: (id: string) => void
  onToggleAll: () => void
}) {
  const [search, setSearch] = useState('')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)

  const filteredLocations = locations.filter((location) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      location.name.toLowerCase().includes(query) ||
      location.address.toLowerCase().includes(query)
    )
  })

  const selectedCount = selectedIds.length
  const allSelected = locations.length > 0 && selectedCount === locations.length
  const someSelected = selectedCount > 0 && !allSelected

  const columns = useMemo<Column<{ id: string; name: string; address: string }>[]>(
    () => [
      {
        key: 'name',
        label: 'Location',
        width: 640,
        sortable: true,
        truncate: false,
        headerRender: ({ sorted, sortDir, onSort }) => (
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleAll()
              }}
              aria-label={allSelected ? 'Deselect all locations' : 'Select all locations'}
              className="flex shrink-0 items-center"
            >
              <LocationCheckbox checked={allSelected} indeterminate={someSelected} />
            </button>
            <button
              type="button"
              onClick={onSort}
              className="group/hdr flex min-w-0 items-center gap-xs"
            >
              <span className={`truncate text-small ${sorted ? 'text-text-primary' : 'text-text-secondary'}`}>
                {selectedCount > 0 ? `${selectedCount} selected` : 'Location'}
              </span>
              <Icon
                name={sorted && sortDir === 'asc' ? 'expand_less' : 'expand_more'}
                size={16}
                className={`shrink-0 transition-opacity ${sorted ? 'text-text-primary opacity-100' : 'text-text-icon opacity-0 group-hover/hdr:opacity-100'}`}
              />
            </button>
          </div>
        ),
        render: (value, row) => (
          <span className="flex items-start gap-md">
            <span className="mt-[3px] shrink-0">
              <LocationCheckbox checked={selectedIds.includes(row.id)} />
            </span>
            <span className="min-w-0">
              <span className="block text-body text-text-primary">{String(value)}</span>
              <span className="mt-[2px] block text-small text-text-secondary">{row.address}</span>
            </span>
          </span>
        ),
      },
    ],
    [allSelected, onToggleAll, selectedCount, selectedIds, someSelected],
  )

  return (
    <div className="mt-xl flex w-full flex-col gap-sm">
      <div className="flex items-start justify-between gap-xl">
        <div>
          <label className="text-body text-text-primary">Select locations</label>
          <p className="mt-[2px] text-small text-text-tertiary">
            Choose the locations which this agent will work for. Select by{' '}
            <span className="relative inline-block">
              <button
                type="button"
                onClick={() => setFilterMenuOpen((open) => !open)}
                className="inline-flex items-center gap-[2px] text-text-action hover:underline"
              >
                locations
                <Icon name="expand_more" size={16} />
              </button>
              {filterMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[105]"
                    onClick={() => setFilterMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute left-0 top-full z-[110] mt-xs min-w-[140px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                    <div
                      onClick={() => setFilterMenuOpen(false)}
                      className="cursor-pointer px-md py-sm text-body text-text-primary hover:bg-surface-hover"
                    >
                      Locations
                    </div>
                    <div
                      onClick={() => setFilterMenuOpen(false)}
                      className="cursor-pointer px-md py-sm text-body text-text-primary hover:bg-surface-hover"
                    >
                      Regions
                    </div>
                  </div>
                </>
              )}
            </span>
          </p>
        </div>

        <div className="relative w-[280px] shrink-0">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-text-icon"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`${INPUT_CLASS} h-9 pl-[38px] placeholder:text-text-tertiary`}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLocations}
        scrollOnHover
        rowHeight={64}
        onRowClick={(row) => onToggleLocation(row.id)}
      />
    </div>
  )
}

function SelectProceduresStep({
  procedures,
  selectedIds,
  onToggleProcedure,
  onCreate,
  onViewProcedure,
}: {
  procedures: HealthcareProcedureCatalogItem[]
  selectedIds: string[]
  onToggleProcedure: (id: string) => void
  onCreate: () => void
  onViewProcedure: (id: string) => void
}) {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-xl">
        <h2 className="text-h3 text-text-primary">Select procedures</h2>
        <p className="mt-xs text-small text-text-tertiary">
          Choose the procedures your agent will follow, or{' '}
          <button
            type="button"
            onClick={onCreate}
            className="inline text-text-action hover:underline"
          >
            create new
          </button>
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-lg">
        {procedures.map((procedure) => (
          <ProcedureSelectCard
            key={procedure.id}
            title={procedure.title}
            description={procedure.description}
            selected={selectedIds.includes(procedure.id)}
            onToggle={() => onToggleProcedure(procedure.id)}
            onView={() => onViewProcedure(procedure.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function NewFrontdeskAgentSetupScreen({
  onBack,
  onCancel,
  onComplete,
}: NewFrontdeskAgentSetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [agentName, setAgentName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [language, setLanguage] = useState<AgentLanguageId>('en')
  const [additionalLanguages, setAdditionalLanguages] = useState<AgentLanguageId[]>([])
  const [selectedChannels, setSelectedChannels] = useState<Set<ChannelId>>(
    () => new Set(),
  )
  const [voice, setVoice] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const [additionalVoices, setAdditionalVoices] = useState<string[]>([])
  const [additionalVoiceConfigs, setAdditionalVoiceConfigs] = useState<AdditionalVoiceConfig[]>([])
  const [greeting, setGreeting] = useState('')
  const [recording, setRecording] = useState<RecordingMode>('off')
  const [consent, setConsent] = useState('')
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const [procedureCatalog, setProcedureCatalog] = useState<HealthcareProcedureCatalogItem[]>(
    () => [...HEALTHCARE_PROCEDURE_CATALOG],
  )
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>(
    () => [...DEFAULT_WIZARD_PROCEDURE_IDS],
  )
  const [procedureDrawerOpen, setProcedureDrawerOpen] = useState(false)
  const [procedureDrawerDetailId, setProcedureDrawerDetailId] = useState<string | null>(null)
  const [procedureDrawerReadOnly, setProcedureDrawerReadOnly] = useState(false)
  const [procedureToastMessage, setProcedureToastMessage] = useState('')
  const [procedureToastVisible, setProcedureToastVisible] = useState(false)
  const [selectedIntegrationId] = useState<string | null>(
    DEFAULT_AGENT_SELECTED_INTEGRATION_ID,
  )
  const [connectedIntegrationIds] = useState<string[]>(
    () => [...DEFAULT_WIZARD_CONNECTED_INTEGRATION_IDS],
  )
  const [webchatSettings, setWebchatSettings] = useState<WebChatChannelSettings>(
    () => ({ ...DEFAULT_WEBCHAT_CHANNEL_SETTINGS }),
  )
  const [textSettings, setTextSettings] = useState<TextChannelSettings>(
    () => ({ ...DEFAULT_TEXT_CHANNEL_SETTINGS }),
  )
  const [webchatNameValidationAttempted, setWebchatNameValidationAttempted] = useState(false)


  const toggleChannel = (id: ChannelId) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (id === 'webchat' && !next.has('webchat')) {
        setWebchatNameValidationAttempted(false)
      }
      return next
    })
  }

  const toggleLocation = (id: string) => {
    setSelectedLocationIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const toggleAllLocations = () => {
    setSelectedLocationIds((current) =>
      current.length === WIZARD_LOCATIONS.length ? [] : WIZARD_LOCATIONS.map((l) => l.id),
    )
  }

  const toggleProcedure = (id: string) => {
    setSelectedProcedureIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const openProcedureCreate = () => {
    setProcedureDrawerReadOnly(false)
    setProcedureDrawerDetailId(null)
    setProcedureDrawerOpen(true)
  }

  const openProcedureView = (id: string, readOnly = false) => {
    setProcedureDrawerReadOnly(readOnly)
    setProcedureDrawerDetailId(id)
    setProcedureDrawerOpen(true)
  }

  const closeProcedureDrawer = () => {
    setProcedureDrawerOpen(false)
    setProcedureDrawerDetailId(null)
    setProcedureDrawerReadOnly(false)
  }

  const handleCreateProcedure = (procedure: ProcedurePickerItem) => {
    setProcedureCatalog((current) => [
      ...current,
      { ...procedure, lastEdited: 'Just now' },
    ])
  }

  const handleProcedureCreated = (title: string, addToLibrary: boolean) => {
    setProcedureToastMessage(
      addToLibrary
        ? `${title} created successfully and added to library`
        : `${title} created successfully`,
    )
    setProcedureToastVisible(true)
  }

  const goToStep = (step: number) => {
    if (step <= maxStepReached) {
      setCurrentStep(step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  const isStep1Complete = agentName.trim().length > 0 && selectedLocationIds.length > 0
  const isStep2Complete = systemPrompt.trim().length > 0
  const isWebchatNameMissing =
    selectedChannels.has('webchat') && webchatSettings.aiAgentName.trim().length === 0
  const isVoiceDefaultMissing = selectedChannels.has('voice') && voice.trim().length === 0
  const isStep3Complete =
    selectedChannels.size > 0 && !isWebchatNameMissing && !isVoiceDefaultMissing
  const isNextDisabled =
    (currentStep === 1 && !isStep1Complete) ||
    (currentStep === 2 && !isStep2Complete) ||
    (currentStep === 3 && !isStep3Complete)
  const showChatAgentNameError = webchatNameValidationAttempted && isWebchatNameMissing

  const handleNext = () => {
    if (currentStep === 3 && isWebchatNameMissing) {
      setWebchatNameValidationAttempted(true)
      return
    }

    if (isNextDisabled) return

    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1
      setMaxStepReached((max) => Math.max(max, nextStep))
      setCurrentStep(nextStep)
      return
    }
    onComplete?.({
      agentName: agentName.trim() || 'New frontdesk agent',
      systemPrompt: systemPrompt.trim(),
      language,
      additionalLanguages,
      selectedChannels: [...selectedChannels],
      voice,
      voiceSpeed,
      additionalVoices,
      greeting,
      recording,
      consent,
      webchatSettings,
      textSettings,
      selectedLocationIds,
      selectedProcedureIds,
      procedureCatalog,
      selectedIntegrationId,
      connectedIntegrationIds,
    })
  }

  const progress = PROGRESS_BY_STEP[maxStepReached] ?? 0
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === STEPS.length

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex h-16 shrink-0 items-center justify-between bg-surface px-2xl">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <h1 className="text-h3 text-text-primary">New front desk agent</h1>
        </div>
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={isFirstStep ? onCancel : handleBack}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            {isFirstStep ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              isNextDisabled
                ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {isLastStep ? 'Create' : 'Next'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-2xl overflow-hidden px-2xl pb-2xl pt-lg">
        <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-md border border-border bg-surface px-xl py-xl">
          <div className="mb-xl">
            <h2 className="text-h3 text-text-primary">Setup</h2>
            <p className="mt-[2px] text-small text-text-tertiary">
              Configure channels, locations and procedures
            </p>
          </div>

          <StepIndicator
            currentStep={currentStep}
            maxStepReached={maxStepReached}
            onStepChange={goToStep}
          />

          <div className="mt-auto pt-xl">
            <div className="mb-sm text-small text-text-secondary">
              <span>Step {maxStepReached} of {STEPS.length}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-selected">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto pt-xl pb-[160px]">
          {currentStep === 1 && (
            <GettingStartedStep
              agentName={agentName}
              onAgentNameChange={setAgentName}
              locations={WIZARD_LOCATIONS}
              selectedLocationIds={selectedLocationIds}
              onToggleLocation={toggleLocation}
              onToggleAllLocations={toggleAllLocations}
            />
          )}
          {currentStep === 2 && (
            <ConfigureAgentStep
              systemPrompt={systemPrompt}
              onSystemPromptChange={setSystemPrompt}
              language={language}
              onLanguageChange={(id) => setLanguage(id as AgentLanguageId)}
              additionalLanguages={additionalLanguages}
              onAdditionalLanguagesChange={(ids) =>
                setAdditionalLanguages(ids as AgentLanguageId[])
              }
            />
          )}
          {currentStep === 3 && (
            <ConfigureChannelsStep
              selectedChannels={selectedChannels}
              onToggleChannel={toggleChannel}
              language={language}
              voice={voice}
              onVoiceChange={setVoice}
              voiceSpeed={voiceSpeed}
              onVoiceSpeedChange={setVoiceSpeed}
              additionalVoices={additionalVoices}
              onAdditionalVoicesChange={setAdditionalVoices}
              additionalVoiceConfigs={additionalVoiceConfigs}
              onAdditionalVoiceConfigsChange={setAdditionalVoiceConfigs}
              greeting={greeting}
              onGreetingChange={setGreeting}
              recording={recording}
              onRecordingChange={setRecording}
              consent={consent}
              onConsentChange={setConsent}
              webchatSettings={webchatSettings}
              onWebchatSettingsChange={(patch) => {
                setWebchatSettings((current) => ({ ...current, ...patch }))
                if (patch.aiAgentName?.trim()) {
                  setWebchatNameValidationAttempted(false)
                }
              }}
              textSettings={textSettings}
              onTextSettingsChange={(patch) =>
                setTextSettings((current) => ({ ...current, ...patch }))
              }
              chatAgentNameError={showChatAgentNameError}
            />
          )}
          {currentStep === 4 && (
            <SelectProceduresStep
              procedures={procedureCatalog}
              selectedIds={selectedProcedureIds}
              onToggleProcedure={toggleProcedure}
              onCreate={openProcedureCreate}
              onViewProcedure={openProcedureView}
            />
          )}
          {currentStep === 5 && (
            <ReviewSummaryStep
              agentName={agentName}
              systemPrompt={systemPrompt}
              language={language}
              additionalLanguages={additionalLanguages}
              selectedChannels={selectedChannels}
              voice={voice}
              additionalVoices={additionalVoices}
              additionalVoiceConfigs={additionalVoiceConfigs}
              voiceSpeed={voiceSpeed}
              greeting={greeting}
              recording={recording}
              consent={consent}
              webchatSettings={webchatSettings}
              textSettings={textSettings}
              locations={WIZARD_LOCATIONS}
              selectedLocationIds={selectedLocationIds}
              procedures={procedureCatalog}
              selectedProcedureIds={selectedProcedureIds}
              onEditStep={goToStep}
              onViewProcedure={(id) => openProcedureView(id, true)}
            />
          )}
        </div>
      </div>

      <ProceduresPickerDrawer
        open={procedureDrawerOpen}
        procedures={procedureCatalog}
        selectedIds={selectedProcedureIds}
        initialDetailId={procedureDrawerDetailId}
        readOnly={procedureDrawerReadOnly}
        onClose={closeProcedureDrawer}
        onSave={setSelectedProcedureIds}
        onCreateProcedure={handleCreateProcedure}
        onProcedureCreated={handleProcedureCreated}
        closeOnCreateCancel
      />

      <Toast
        message={procedureToastMessage}
        visible={procedureToastVisible}
        onClose={() => setProcedureToastVisible(false)}
      />
    </div>
  )
}
