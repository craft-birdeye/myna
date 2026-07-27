import { useEffect, useState, useRef, type MouseEvent } from 'react'
import {
  Icon,
  IntegrationsPickerDrawer,
  LanguageFlag,
  LanguageSelectMenu,
  RefChip,
} from '../components'
import {
  AGENT_LANGUAGES,
  getAgentLanguage,
  type AgentLanguageId,
} from '../data/agentLanguages'
import {
  DEFAULT_AUTO_ACCOUNT_CONNECTED_INTEGRATION_IDS,
  DEFAULT_AUTO_AGENT_SELECTED_INTEGRATION_ID,
  getAutomotiveIntegration,
  AUTOMOTIVE_INTEGRATION_CATALOG,
} from '../data/automotiveIntegrations'
import {
  BuildIcon,
  VariableIcon,
} from '../workflow/Molecules/Inputs/PromptToolbarIcons.jsx'
import FieldPickerModal from '../workflow/Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx'

interface AgentSettingsTabProps {
  product?: string
  agentName?: string
  onOpenIntegrationSettings?: (integrationId: string) => void
}

const FRONTDESK_SYSTEM_PROMPT = `# Personality
You are Myna, the elegant and attentive reservations specialist at the Grand Hotel. You make every caller feel like a VIP — refined, warm, and effortlessly capable. You handle reservation requests with the calm efficiency of someone who has booked thousands of stays.

# Environment
You handle inbound calls for hotel reservations: new bookings, modifications, cancellations, and general questions about the property. Callers may be planning a special trip, calling on behalf of a guest, or checking on a stay they've already booked. Booking system, room types, and rate plans are managed by the workspace owner — only quote details that are explicitly available to you in this conversation.

# Tone
- Warm and refined hospitality — never stuffy.
- Attentive to details: dates, room preferences, special requests (anniversary, accessibility, dietary).`

const FRONTDESK_GREETING =
  'Thank you for calling Rock Dental Brands — my name is Myna, your virtual assistant. How can I help you today?'

const FRONTDESK_CONSENT =
  'This call may be recorded for quality and training purposes.'

interface AdditionalVoiceChip {
  label: string
  language: AgentLanguageId
}

const DEFAULT_ADDITIONAL_VOICES: AdditionalVoiceChip[] = [
  { label: 'Andrea_Spanish', language: 'es' },
  { label: 'Andrea_Italian', language: 'it' },
  { label: 'Andrea_Korean', language: 'ko' },
]

function isFrontDeskAgent(agentName?: string): boolean {
  return (agentName ?? '').startsWith('Front desk agent')
}

// ── Toggle ──────────────────────────────────────────────────────
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

// ── Field borders (shared focus ring via primary border) ─────────
const FIELD_BORDER_CLASS =
  'rounded-sm border border-border-input transition-colors focus:border-primary focus:outline-none focus-visible:border-primary'

const INPUT_CLASS = `w-full bg-surface px-md text-body text-text-primary ${FIELD_BORDER_CLASS}`

// ── Fallback message field (textarea + variable chip + toolbar) ──
interface FallbackFieldProps {
  prefix: string
  chipLabel: string
  suffix?: string
}

function FallbackField({ prefix, chipLabel, suffix }: FallbackFieldProps) {
  const [showChip, setShowChip] = useState(true)
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`overflow-hidden bg-surface ${FIELD_BORDER_CLASS} focus-within:border-primary`}>
      {/* Rich text body */}
      <div
        ref={bodyRef}
        tabIndex={0}
        role="textbox"
        aria-multiline="true"
        onMouseDown={() => bodyRef.current?.focus()}
        className="min-h-[80px] cursor-text px-md pt-sm pb-xs text-body text-text-primary leading-[1.7] outline-none"
      >
        <span>{prefix}</span>
        {showChip && (
          <>
            {' '}
            <RefChip kind="context" label={chipLabel} onRemove={() => setShowChip(false)} />
          </>
        )}
        {suffix && <span>{suffix}</span>}
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-[2px] bg-surface px-sm py-[6px]">
        {/* AI icon */}
        <button
          type="button"
          title="AI personalize"
          className="flex h-7 items-center gap-[3px] rounded-sm px-[6px] text-text-icon hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.25"/>
            <text x="8" y="11.5" textAnchor="middle" fontSize="7.5" fontWeight="500" fill="currentColor" fontFamily="sans-serif">Ai</text>
            <path d="M12 1.5 L13 3 L14 1.5 L13 0 Z" fill="#7C3AED" />
          </svg>
          <span className="sr-only">AI</span>
        </button>
        {/* Emoji */}
        <button
          type="button"
          title="Emoji"
          className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <Icon name="sentiment_satisfied" size={18} />
        </button>
        {/* Personalize */}
        <button
          type="button"
          className="flex items-center gap-[3px] rounded-sm px-[6px] py-[3px] text-body text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          Personalize
          <Icon name="expand_more" size={16} className="text-primary" />
        </button>
      </div>
    </div>
  )
}

// ── Title + description (tight 2px gap) ─────────────────────────
function SettingSubtext({
  children,
  tone = 'secondary',
}: {
  children: React.ReactNode
  tone?: 'secondary' | 'tertiary'
}) {
  return (
    <p
      className={`mt-[2px] text-small ${
        tone === 'tertiary' ? 'text-text-tertiary' : 'text-text-secondary'
      }`}
    >
      {children}
    </p>
  )
}

// ── Settings checkbox (matches SelectMenu / StatusFilterDropdown) ─
function SettingsCheckboxBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && (
        <Icon
          name="check"
          size={11}
          fill
          weight={600}
          className="text-white"
        />
      )}
    </span>
  )
}

const CHECKBOX_ROW_GAP = 'gap-sm'
const CHECKBOX_ROW_INDENT = (
  <span className="size-4 shrink-0" aria-hidden />
)

// ── Checkbox row (checkbox before label + optional description) ─
interface CheckboxRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}

function CheckboxRow({ label, description, checked, onChange }: CheckboxRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start rounded-sm text-left ${CHECKBOX_ROW_GAP}`}
    >
      <span className="mt-[3px] shrink-0"><SettingsCheckboxBox checked={checked} /></span>
      <div className="flex-1">
        <p className="text-body text-text-primary">{label}</p>
        {description && <SettingSubtext>{description}</SettingSubtext>}
      </div>
    </button>
  )
}

// ── Checkbox label row (checkbox before a single-line label) ────
interface CheckboxLabelRowProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

function CheckboxLabelRow({ label, checked, onChange }: CheckboxLabelRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center rounded-sm text-left ${CHECKBOX_ROW_GAP}`}
    >
      <SettingsCheckboxBox checked={checked} />
      <span className="text-small text-text-secondary">{label}</span>
    </button>
  )
}

// ── Indented field aligned with checkbox row label text ───────────
function CheckboxRowField({ children }: { children: React.ReactNode }) {
  return (
    <div className={`flex items-start ${CHECKBOX_ROW_GAP}`}>
      {CHECKBOX_ROW_INDENT}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// ── Voice option type ───────────────────────────────────────────
interface VoiceOption {
  label: string
  preview: string
}

// ── VoiceSelect ─────────────────────────────────────────────────
interface VoiceSelectProps {
  value: string
  options: VoiceOption[]
  onChange: (value: string) => void
  /** `right` opens like a drawer trigger (Front desk settings). */
  chevron?: 'down' | 'right'
}

function VoiceSelect({ value, options, onChange, chevron = 'down' }: VoiceSelectProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const openMenu = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen(true)
  }

  const stopPlaying = () => {
    window.speechSynthesis.cancel()
    setPlaying(null)
  }

  const togglePreview = (opt: VoiceOption, e: MouseEvent) => {
    e.stopPropagation()
    if (playing === opt.label) {
      stopPlaying()
      return
    }
    stopPlaying()
    const utter = new SpeechSynthesisUtterance(opt.preview)
    utter.onend = () => setPlaying(null)
    utteranceRef.current = utter
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
        <span className={`min-w-0 flex-1 truncate text-left text-body ${value ? 'text-text-primary' : 'text-text-tertiary'}`}>
          {value || 'Select voice'}
        </span>
        <Icon
          name={chevron === 'right' ? 'chevron_right' : 'expand_more'}
          size={20}
          className="shrink-0 text-text-icon"
        />
      </button>
      {open && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => { stopPlaying(); setOpen(false) }} aria-hidden />
          <div
            className="fixed z-[110] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
            style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
          >
            {options.map((opt) => {
              const isSelected = opt.label === value
              const isPlaying = playing === opt.label
              return (
                <div
                  key={opt.label}
                  onClick={() => select(opt.label)}
                  className={`flex cursor-pointer items-center gap-sm px-md py-sm hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                >
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => togglePreview(opt, e)}
                    title={isPlaying ? 'Stop preview' : 'Preview voice'}
                    className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2 hover:text-primary"
                  >
                    <Icon name={isPlaying ? 'stop' : 'volume_up'} size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

// ── Web chat content ────────────────────────────────────────────
function WebChatSettings() {
  const [resolvedEnabled, setResolvedEnabled] = useState(true)
  const [resolvedName, setResolvedName] = useState('👍 That helped')
  const [escalationEnabled, setEscalationEnabled] = useState(true)
  const [escalationName, setEscalationName] = useState('Talk to human')
  const [duringEnabled, setDuringEnabled] = useState(true)
  const [afterEnabled, setAfterEnabled] = useState(true)

  return (
    <div className="flex flex-col gap-[40px]">
      {/* Resolve button */}
      <div className="flex flex-col gap-sm">
        <CheckboxRow
          label="Resolve button"
          description="A quick reply button customers can tap when their question is answered"
          checked={resolvedEnabled}
          onChange={setResolvedEnabled}
        />
        {resolvedEnabled && (
          <CheckboxRowField>
            <label className="mb-xs block text-small text-text-secondary">Button name</label>
            <input
              type="text"
              value={resolvedName}
              onChange={(e) => setResolvedName(e.target.value)}
              className={`${INPUT_CLASS} h-9`}
            />
          </CheckboxRowField>
        )}
      </div>

      {/* Escalation button */}
      <div className="flex flex-col gap-sm">
        <CheckboxRow
          label="Escalation button"
          description="A quick reply button customers can tap to reach a team member"
          checked={escalationEnabled}
          onChange={setEscalationEnabled}
        />
        {escalationEnabled && (
          <CheckboxRowField>
            <label className="mb-xs block text-small text-text-secondary">Button name</label>
            <input
              type="text"
              value={escalationName}
              onChange={(e) => setEscalationName(e.target.value)}
              className={`${INPUT_CLASS} h-9`}
            />
          </CheckboxRowField>
        )}
      </div>

      {/* Fallback message */}
      <div className="flex flex-col gap-md">
        <p className="text-body text-text-primary">Fallback message</p>

        {/* During business hours */}
        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="During business hours"
            checked={duringEnabled}
            onChange={setDuringEnabled}
          />
          {duringEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="We're not available right now. Our team will follow up during business hours. You can also reach us at"
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>

        {/* After business hours */}
        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="After business hours"
            checked={afterEnabled}
            onChange={setAfterEnabled}
          />
          {afterEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="Our team is offline right now. Leave a message and we'll follow up during business hours. You can also call us at"
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Text settings content ────────────────────────────────────────
function TextSettings() {
  const [unsubscribeEnabled, setUnsubscribeEnabled] = useState(false)
  const [beforeEnabled, setBeforeEnabled] = useState(true)
  const [afterEnabled, setAfterEnabled] = useState(false)

  return (
    <div className="flex flex-col gap-lg">
      {/* Unsubscribe text */}
      <CheckboxRow
        label="Unsubscribe text"
        description="Enabling this will allow customers to opt out of text communications"
        checked={unsubscribeEnabled}
        onChange={setUnsubscribeEnabled}
      />

      {/* Fallback message */}
      <div className="flex flex-col gap-sm">
        <p className="text-body text-text-primary">Fallback message</p>

        {/* Before business hours */}
        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="Before business hours"
            checked={beforeEnabled}
            onChange={setBeforeEnabled}
          />
          {beforeEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="We're not available right now. Our team will follow up during business hours. You can also reach us at"
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>

        {/* After business hours */}
        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="After business hours"
            checked={afterEnabled}
            onChange={setAfterEnabled}
          />
          {afterEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="Our team is offline right now. Leave a message and we'll follow up during business hours."
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Channel accordion ────────────────────────────────────────────
interface ChannelAccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

function ChannelAccordion({
  title,
  children,
  defaultOpen = false,
  enabled,
  onEnabledChange,
}: ChannelAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-l2">
      <div className="flex h-14 items-center justify-between px-lg hover:bg-surface-l2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center text-left"
        >
          <span className="text-body font-medium text-text-primary">{title}</span>
        </button>
        <div className="flex items-center gap-md">
          <Toggle checked={enabled} onChange={onEnabledChange} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center text-text-icon"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <Icon
              name={open ? 'expand_less' : 'expand_more'}
              size={20}
            />
          </button>
        </div>
      </div>
      {open && (
        <div className="px-lg pb-lg pt-md">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Settings section header with add action ─────────────────────
function SettingsSectionHeader({
  title,
  addAriaLabel,
  onAdd,
  addDisabled,
}: {
  title: string
  addAriaLabel: string
  onAdd: (e: MouseEvent<HTMLButtonElement>) => void
  addDisabled?: boolean
}) {
  return (
    <div className="mb-md flex items-center gap-xs">
      <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{title}</h2>
      <button
        type="button"
        onClick={onAdd}
        disabled={addDisabled}
        aria-label={addAriaLabel}
        className="flex size-6 shrink-0 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-primary focus:outline-none disabled:cursor-not-allowed disabled:text-text-tertiary"
      >
        <Icon name="edit" size={16} />
      </button>
    </div>
  )
}

// ── Card 3-dot menu (edit / delete) ───────────────────────────
interface CardMenuProps {
  itemLabel: string
  onEdit?: () => void
  onDelete?: () => void
  /** When true, skip absolute positioning (for use inside a positioned parent). */
  inline?: boolean
}

function CardMenu({ itemLabel, onEdit, onDelete, inline = false }: CardMenuProps) {
  const [open, setOpen] = useState(false)

  if (!onEdit && !onDelete) return null

  return (
    <div className={`z-10 ${inline ? 'relative' : 'absolute right-md top-md'}`}>
      <button
        type="button"
        aria-label={`${itemLabel} actions`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
      >
        <Icon name="more_vert" size={20} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {onEdit && (
              <button
                type="button"
                className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                  setOpen(false)
                }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setOpen(false)
                }}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Integration card ─────────────────────────────────────────────
interface IntegrationCardProps {
  iconBg: string
  iconLabel: string
  name: string
  description: string
  connected?: boolean
  onEdit?: () => void
  onRemove?: () => void
}

function IntegrationCard({
  iconBg,
  iconLabel,
  name,
  description,
  connected,
  onEdit,
  onRemove,
}: IntegrationCardProps) {
  return (
    <div className="group relative flex min-h-[148px] flex-col rounded-sm border border-border-selected bg-surface p-xl transition-colors hover:bg-surface-selected">
      <div className="absolute right-md top-md z-10 flex items-center gap-sm">
        {connected && (
          <div className="flex items-center gap-xs text-small text-text-secondary">
            <span className="size-2 rounded-full bg-accent-positive" />
            Connected
          </div>
        )}
        <CardMenu itemLabel={name} onEdit={onEdit} onDelete={onRemove} inline />
      </div>
      <div className="mb-md">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface p-[2px]">
          <div
            className="flex size-full items-center justify-center rounded-full text-[10px] leading-none text-white"
            style={{ backgroundColor: iconBg }}
          >
            {iconLabel}
          </div>
        </div>
      </div>
      <h3 className="mb-xs truncate text-body text-text-primary">{name}</h3>
      <p className="line-clamp-2 text-body text-text-secondary">{description}</p>
    </div>
  )
}

type RecordingMode = 'off' | 'announced'

const VOICE_OPTIONS: VoiceOption[] = [
  {
    label: 'Andrea (warm, clear, reassuring)',
    preview: "Hi, I'm Andrea — warm, clear, and reassuring. How can I help you today?",
  },
  {
    label: 'Jordan (professional, calm)',
    preview: "Hello, this is Jordan. I'm here to assist you professionally and calmly.",
  },
  {
    label: 'Sam (friendly, upbeat)',
    preview: "Hey there! Sam here — friendly and upbeat. What can I do for you?",
  },
  {
    label: 'Morgan (neutral, clear)',
    preview: "Hi, I'm Morgan. Clear and neutral, ready to assist you.",
  },
]

/** Flat Front desk settings (system prompt → language → voice → greeting → recording). */
function FrontDeskSettings() {
  const [systemPrompt, setSystemPrompt] = useState(FRONTDESK_SYSTEM_PROMPT)
  const [language, setLanguage] = useState<AgentLanguageId>('en')
  const [additionalLanguages, setAdditionalLanguages] = useState<AgentLanguageId[]>([])
  const [additionalFieldVisible, setAdditionalFieldVisible] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [additionalMenuOpen, setAdditionalMenuOpen] = useState(false)
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false)
  const [voice, setVoice] = useState('Andrea (warm, clear, reassuring)')
  const [additionalVoices, setAdditionalVoices] =
    useState<AdditionalVoiceChip[]>(DEFAULT_ADDITIONAL_VOICES)
  const [greeting, setGreeting] = useState(FRONTDESK_GREETING)
  const [recording, setRecording] = useState<RecordingMode>('announced')
  const [consent, setConsent] = useState(FRONTDESK_CONSENT)

  const promptRef = useRef<HTMLTextAreaElement>(null)
  const fieldsBtnRef = useRef<HTMLButtonElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const additionalRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null)

  const selectedLang = getAgentLanguage(language)
  const additionalOptions = AGENT_LANGUAGES.filter((l) => l.id !== language)
  const selectedAdditional = additionalLanguages
    .map((id) => getAgentLanguage(id))
    .filter((l) => l.id !== language)

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

  function savePromptSelection() {
    const el = promptRef.current
    if (!el) return
    savedSelectionRef.current = { start: el.selectionStart, end: el.selectionEnd }
  }

  function insertFieldIntoPrompt(fieldValue: string) {
    const el = promptRef.current
    if (!el) {
      setSystemPrompt(`${systemPrompt}{{${fieldValue}}}`)
      return
    }
    const token = `{{${fieldValue}}}`
    const start = savedSelectionRef.current?.start ?? el.selectionStart
    const end = savedSelectionRef.current?.end ?? el.selectionEnd
    const next = `${systemPrompt.slice(0, start)}${token}${systemPrompt.slice(end)}`
    setSystemPrompt(next)
    const caret = start + token.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
    savedSelectionRef.current = null
  }

  function handlePrimaryLanguageChange(id: string) {
    setLanguage(id as AgentLanguageId)
    if (additionalLanguages.includes(id as AgentLanguageId)) {
      setAdditionalLanguages(additionalLanguages.filter((x) => x !== id))
    }
    setLangMenuOpen(false)
  }

  function revealAdditionalLanguage() {
    setAdditionalFieldVisible(true)
    setLangMenuOpen(false)
    setAdditionalMenuOpen(true)
  }

  function handleRemoveAdditionalVoice(label: string) {
    setAdditionalVoices(additionalVoices.filter((v) => v.label !== label))
  }

  function handleAddAdditionalVoice() {
    const used = new Set(additionalVoices.map((v) => v.language))
    const nextLang = AGENT_LANGUAGES.find(
      (l) => l.id !== language && !used.has(l.id as AgentLanguageId),
    )
    if (!nextLang) return
    const baseName = voice.split(' (')[0] || 'Andrea'
    setAdditionalVoices([
      ...additionalVoices,
      { label: `${baseName}_${nextLang.label}`, language: nextLang.id as AgentLanguageId },
    ])
  }

  return (
    <div className="flex w-full flex-col gap-md">
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
            onChange={(e) => setSystemPrompt(e.target.value)}
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
              title="Add tool"
              aria-label="Add tool"
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <BuildIcon />
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
      <div className="flex flex-col gap-md">
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
              className={`flex h-9 w-full items-center gap-sm bg-surface px-md text-left ${FIELD_BORDER_CLASS}`}
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
                  onChange={(ids) => setAdditionalLanguages(ids as AgentLanguageId[])}
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

      {/* Voice call settings */}
      <div className="flex flex-col gap-md pt-3xl">
        <h2 className="text-[16px] font-medium leading-6 tracking-[-0.32px] text-text-primary">
          Voice call settings
        </h2>

        <div className="flex flex-col gap-xs">
          <label className="text-small text-text-secondary">
            Default voice <span className="text-chip-danger-text">*</span>
          </label>
          <VoiceSelect
            value={voice}
            options={VOICE_OPTIONS}
            onChange={setVoice}
            chevron="right"
          />
        </div>

        <div className="flex flex-col gap-xs">
          {additionalVoices.length > 0 && (
            <label className="text-small text-text-secondary">Additional voice</label>
          )}
          {additionalVoices.length > 0 ? (
            <div className="flex flex-col gap-lg rounded-sm border border-border-input bg-surface px-[10px] py-sm">
              <div className="flex flex-wrap gap-sm">
                {additionalVoices.map((cfg) => {
                  const lang = getAgentLanguage(cfg.language)
                  return (
                    <span
                      key={cfg.label}
                      className="flex h-7 max-w-full items-center gap-xs rounded-sm bg-chip-neutral-bg px-sm text-body text-text-primary"
                    >
                      <LanguageFlag countryCode={lang.countryCode} label={lang.label} size="sm" />
                      <span className="truncate">{cfg.label}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${cfg.label}`}
                        onClick={() => handleRemoveAdditionalVoice(cfg.label)}
                        className="flex size-4 shrink-0 items-center justify-center text-text-icon hover:text-text-primary"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </span>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={handleAddAdditionalVoice}
                className="flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover"
              >
                <Icon name="add_circle" size={18} className="text-primary" />
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddAdditionalVoice}
              className="flex items-center gap-sm self-start text-body text-text-action hover:text-primary-hover"
            >
              <Icon name="add_circle" size={18} className="text-primary" />
              Add additional voice
            </button>
          )}
        </div>
      </div>

      {/* Greeting message */}
      <div className="flex flex-col gap-xs">
        <label className="text-body text-text-primary">Greeting message</label>
        <textarea
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          rows={4}
          className={`${INPUT_CLASS} resize-none py-sm`}
        />
      </div>

      {/* Recording */}
      <div>
        <p className="text-body text-text-primary">Recording</p>
        <div className="mt-sm flex flex-col gap-sm">
          <label className="flex cursor-pointer items-center gap-sm">
            <input
              type="radio"
              name="frontdesk-recording"
              checked={recording === 'off'}
              onChange={() => setRecording('off')}
              className="accent-primary"
            />
            <span className="text-body text-text-primary">Off</span>
          </label>
          <div>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="frontdesk-recording"
                checked={recording === 'announced'}
                onChange={() => setRecording('announced')}
                className="accent-primary"
              />
              <span className="text-body text-text-primary">Record with announced consent</span>
            </label>
            {recording === 'announced' && (
              <div className="mt-sm pl-2xl">
                <label className="mb-xs block text-small text-text-secondary">Consent message</label>
                <textarea
                  value={consent}
                  onChange={(e) => setConsent(e.target.value)}
                  rows={3}
                  className={`${INPUT_CLASS} resize-none py-sm`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentSettingsTab({
  agentName,
  onOpenIntegrationSettings,
}: AgentSettingsTabProps) {
  const [voice, setVoice] = useState('Andrea (warm, clear, reassuring)')
  const [greeting, setGreeting] = useState(
    'Thank you for calling — my name is Myna, your virtual assistant. How can I help you today?'
  )
  const [recording, setRecording] = useState<RecordingMode>('announced')
  const [consent, setConsent] = useState(
    'This call may be recorded for quality and training purposes.'
  )
  const [accountConnectedIntegrationIds, setAccountConnectedIntegrationIds] = useState<string[]>(
    DEFAULT_AUTO_ACCOUNT_CONNECTED_INTEGRATION_IDS,
  )
  const [agentSelectedIntegrationId, setAgentSelectedIntegrationId] = useState<string | null>(
    DEFAULT_AUTO_AGENT_SELECTED_INTEGRATION_ID,
  )
  const [voiceCallEnabled, setVoiceCallEnabled] = useState(true)
  const [webChatEnabled, setWebChatEnabled] = useState(true)
  const [textEnabled, setTextEnabled] = useState(true)
  const [integrationDrawerOpen, setIntegrationDrawerOpen] = useState(false)

  const agentIntegration = agentSelectedIntegrationId
    ? getAutomotiveIntegration(agentSelectedIntegrationId)
    : undefined

  const removeAgentIntegration = () => {
    setAgentSelectedIntegrationId(null)
  }

  const navigateToIntegrationSettings = (integrationId: string) => {
    setIntegrationDrawerOpen(false)
    onOpenIntegrationSettings?.(integrationId)
  }

  if (isFrontDeskAgent(agentName)) {
    return (
      <div className="flex gap-2xl px-2xl pt-lg pb-2xl">
        <div className="flex min-w-0 flex-1 flex-col">
          <FrontDeskSettings />
        </div>
        {/* Same right-column width as ProcedureDetailScreen Context panel */}
        <div className="w-[400px] shrink-0" aria-hidden />
      </div>
    )
  }

  return (
    <div className="flex gap-2xl px-2xl pt-lg pb-2xl">
      <div className="min-w-0 flex-1 space-y-xl">

        {/* Channel settings */}
        <section>
          <h2 className="mb-md text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Channel settings</h2>
          <div className="space-y-8">

            {/* Voice call */}
            <ChannelAccordion
              title="Voice call"
              defaultOpen
              enabled={voiceCallEnabled}
              onEnabledChange={setVoiceCallEnabled}
            >
              <div className="flex flex-col gap-lg">
                <div>
                  <label className="block text-small text-text-secondary">Voice</label>
                  <VoiceSelect value={voice} options={VOICE_OPTIONS} onChange={setVoice} />
                </div>

                <div>
                  <label className="mb-xs block text-small text-text-secondary">
                    Greeting message <span className="text-chip-danger-text">*</span>
                  </label>
                  <textarea
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    rows={4}
                    className={`${INPUT_CLASS} resize-none py-sm`}
                  />
                </div>

                <div>
                  <p className="text-small text-text-secondary">Recording</p>
                  <SettingSubtext tone="tertiary">
                    Applies to voice calls only
                  </SettingSubtext>
                  <div className="mt-sm flex flex-col gap-sm">
                    <label className="flex cursor-pointer items-center gap-sm">
                      <input
                        type="radio"
                        name="recording"
                        value="off"
                        checked={recording === 'off'}
                        onChange={() => setRecording('off')}
                        className="accent-primary"
                      />
                      <span className="text-body text-text-primary">Off</span>
                    </label>
                    <div>
                      <label className="flex cursor-pointer items-center gap-sm">
                        <input
                          type="radio"
                          name="recording"
                          value="announced"
                          checked={recording === 'announced'}
                          onChange={() => setRecording('announced')}
                          className="accent-primary"
                        />
                        <span className="text-body text-text-primary">Record with announced consent</span>
                      </label>
                      {recording === 'announced' && (
                        <div className="mt-sm pl-2xl">
                          <label className="mb-xs block text-small text-text-secondary">
                            Consent message
                          </label>
                          <textarea
                            value={consent}
                            onChange={(e) => setConsent(e.target.value)}
                            rows={3}
                            className={`${INPUT_CLASS} resize-none py-sm`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ChannelAccordion>

            {/* Web chat */}
            <ChannelAccordion
              title="Web chat"
              enabled={webChatEnabled}
              onEnabledChange={setWebChatEnabled}
            >
              <WebChatSettings />
            </ChannelAccordion>

            {/* Text */}
            <ChannelAccordion
              title="Text"
              enabled={textEnabled}
              onEnabledChange={setTextEnabled}
            >
              <TextSettings />
            </ChannelAccordion>

          </div>
        </section>

        {/* Integrations */}
        <section>
          <SettingsSectionHeader
            title="Integrations"
            addAriaLabel="Edit integrations"
            onAdd={() => setIntegrationDrawerOpen(true)}
          />
          <p className="mb-lg text-body text-text-secondary">
            Integration connected to this front desk agent.
          </p>
          {!agentIntegration ? (
            <div className="flex h-32 items-center justify-center rounded-sm border border-border-selected bg-surface text-body text-text-tertiary">
              No integration selected. Use Edit integrations to connect one.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-lg">
              <IntegrationCard
                iconBg={agentIntegration.iconBg}
                iconLabel={agentIntegration.iconLabel}
                name={agentIntegration.name}
                description={agentIntegration.description}
                connected
                onEdit={() => navigateToIntegrationSettings(agentIntegration.id)}
                onRemove={removeAgentIntegration}
              />
            </div>
          )}
          <IntegrationsPickerDrawer
            open={integrationDrawerOpen}
            integrations={AUTOMOTIVE_INTEGRATION_CATALOG}
            connectedIds={accountConnectedIntegrationIds}
            selectedId={agentSelectedIntegrationId}
            onClose={() => setIntegrationDrawerOpen(false)}
            onSave={({ selectedId, connectedIds }) => {
              setAccountConnectedIntegrationIds(connectedIds)
              setAgentSelectedIntegrationId(selectedId)
              setIntegrationDrawerOpen(false)
            }}
            onOpenIntegrationSettings={navigateToIntegrationSettings}
          />
        </section>

      </div>
      {/* Same right-column width as ProcedureDetailScreen Context panel */}
      <div className="w-[400px] shrink-0" aria-hidden />
    </div>
  )
}
