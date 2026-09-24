import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { nextPersonalityId, speakingSpeedLabel } from '../../data/testPersonalities'
import type { PersonalityGender, TestPersonality, TestPersonalitySectionProps } from './TestPersonalitySection.types'

const VOICE_MODELS = ['Cartesia', 'ElevenLabs', 'OpenAI']
const INTERRUPTION_LEVELS = ['Off', 'Low', 'Normal', 'High']
const NOISE_OPTIONS = ['None', 'Office', 'People talking', 'Street']
const LANGUAGES = ['English', 'Spanish', 'French', 'Hindi', 'German']
const ACCENTS = ['American', 'British', 'Indian', 'N/A']
const GENDERS: PersonalityGender[] = ['Male', 'Female', 'Neutral']

const SPEED_MIN = 0.8
const SPEED_MAX = 1.2
const VOLUME_MIN = 0.01
const VOLUME_MAX = 2

interface PersonalityDraft {
  name: string
  prompt: string
  voiceModel: string
  voiceId: string
  interruption: string
  speed: number
  volume: number
  backgroundNoise: string
  language: string
  accent: string
  gender: PersonalityGender | ''
}

const EMPTY_DRAFT: PersonalityDraft = {
  name: '',
  prompt: '',
  voiceModel: '',
  voiceId: '',
  interruption: 'Off',
  speed: 1,
  volume: 1,
  backgroundNoise: 'None',
  language: '',
  accent: '',
  gender: '',
}

function draftFromPersonality(personality: TestPersonality): PersonalityDraft {
  return {
    name: personality.name,
    prompt: personality.prompt,
    voiceModel: personality.voiceModel,
    voiceId: personality.voiceId,
    interruption: INTERRUPTION_LEVELS.includes(personality.interruption) ? personality.interruption : 'Off',
    speed: personality.speed ?? 1,
    volume: personality.volume,
    backgroundNoise: personality.backgroundNoise,
    language: personality.language,
    accent: personality.accent === 'N/A' ? '' : personality.accent,
    gender: personality.gender,
  }
}

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-4 w-8 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-surface-selected'
      }`}
    >
      <span
        className={`absolute top-0.5 size-3 rounded-full bg-surface shadow-card transition-[left] ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-xs">
      <Icon name={icon} size={14} className="shrink-0 text-text-tertiary" />
      <span className="min-w-0 truncate text-small text-text-secondary">{text}</span>
    </div>
  )
}

function PersonalityCard({
  personality,
  onToggle,
  onEdit,
  onDuplicate,
}: {
  personality: TestPersonality
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onDuplicate: () => void
}) {
  const noise = personality.backgroundNoise === 'None' ? 'disabled' : 'enabled'
  return (
    <article className="flex h-full flex-col gap-sm rounded-md border border-border bg-surface p-lg">
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-xs">
            <p className="m-0 min-w-0 text-body text-text-primary">{personality.name}</p>
            {personality.featured && <Icon name="star" size={16} fill className="mt-0.5 shrink-0 text-chip-warning-text" />}
            {personality.kind === 'fork' ? (
              <Chip label="Fork" variant="neutral" className="mt-0.5" />
            ) : (
              <button
                type="button"
                aria-label={`Edit ${personality.name}`}
                onClick={onEdit}
                className="flex size-6 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="edit" size={14} />
              </button>
            )}
          </div>
          {personality.description && personality.description !== personality.name && (
            <p className="m-0 mt-2xs line-clamp-2 text-small text-text-secondary">{personality.description}</p>
          )}
        </div>
        <Switch checked={personality.enabled} label={`${personality.name} enabled`} onChange={onToggle} />
      </div>

      <div className="flex flex-col gap-2xs">
        <MetaRow icon="tag" text={`ID: ${personality.voiceId}`} />
        <MetaRow icon="speed" text={`Speaking speed: ${speakingSpeedLabel(personality.speed)}`} />
        <MetaRow icon="campaign" text={`Interruption: ${personality.interruption}`} />
        <MetaRow icon="graphic_eq" text={`Background noise: ${noise}`} />
        <MetaRow icon="translate" text={`Accent: ${personality.accent || 'N/A'}`} />
      </div>

      <div className="mt-auto flex items-center justify-between pt-xs">
        <span className="text-small text-text-tertiary">{personality.gender}</span>
        <div className="flex items-center gap-xs">
          {personality.kind === 'custom' && (
            <button
              type="button"
              aria-label={`Duplicate ${personality.name}`}
              onClick={onDuplicate}
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="content_copy" size={16} />
            </button>
          )}
          <button
            type="button"
            aria-label={`Preview ${personality.name}`}
            className="flex size-8 items-center justify-center rounded-full border border-border text-text-icon hover:bg-surface-hover"
          >
            <Icon name="mic" size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}

function FieldSelect({
  label,
  value,
  placeholder,
  options,
  required,
  info,
  open,
  onOpenChange,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  options: string[]
  required?: boolean
  info?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setMenuBox({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [open])

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center gap-xs">
        <label className="text-small text-text-primary">
          {label}
          {required && <span className="text-chip-danger-text"> *</span>}
        </label>
        {info && <InfoTooltip text={info} />}
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border-input bg-surface px-md text-left text-body"
      >
        <span className={value ? 'text-text-primary' : 'text-text-tertiary'}>{value || placeholder}</span>
        <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
      </button>
      {open &&
        menuBox &&
        createPortal(
          <div
            className="fixed z-[130] max-h-48 overflow-y-auto rounded-sm border border-border bg-surface py-xs shadow-dropdown"
            style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  onOpenChange(false)
                }}
                className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
              >
                {option}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}

function RangeField({
  label,
  hint,
  value,
  min,
  max,
  step,
  marks,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  marks: [string, string, string]
  onChange: (value: number) => void
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-small text-text-primary">{label}</label>
      {hint && <p className="m-0 text-small text-text-secondary">{hint}</p>}
      <div className="flex items-center gap-md">
        <div className="min-w-0 flex-1">
          <div className="relative flex h-9 items-center">
            <div className="absolute inset-x-0 h-1 rounded-full bg-surface-selected" />
            <div className="absolute left-0 h-1 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            <div
              className="pointer-events-none absolute size-4 -translate-x-1/2 rounded-full border border-border bg-surface shadow-card"
              style={{ left: `${pct}%` }}
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              aria-label={label}
              onChange={(e) => onChange(Number(e.target.value))}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <div className="flex justify-between">
            {marks.map((mark) => (
              <span key={mark} className="text-small text-text-tertiary">
                {mark}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-9 shrink-0 items-center gap-xs rounded-md border border-border-input bg-surface px-sm">
          <input
            aria-label={`${label} value`}
            value={value.toFixed(2)}
            onChange={(e) => {
              const next = Number(e.target.value)
              if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)))
            }}
            className="w-12 border-0 bg-transparent text-body text-text-primary outline-none"
          />
          <button type="button" aria-label={`Reset ${label.toLowerCase()}`} onClick={() => onChange(1)} className="text-text-icon">
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PersonalityDrawer({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: TestPersonality | null
  onClose: () => void
  onSave: (draft: PersonalityDraft) => void
}) {
  const [draft, setDraft] = useState<PersonalityDraft>(EMPTY_DRAFT)
  const [openField, setOpenField] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraft(editing ? draftFromPersonality(editing) : EMPTY_DRAFT)
    setOpenField(null)
    setAdvancedOpen(false)
  }, [open, editing])

  const canSave = Boolean(draft.name.trim() && draft.prompt.trim() && draft.voiceModel && draft.voiceId.trim())

  function patch(partial: Partial<PersonalityDraft>) {
    setDraft((current) => ({ ...current, ...partial }))
  }

  return createPortal(
    <div className={`fixed inset-0 z-[120] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
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
            <h2 className="text-h3 text-text-primary">{editing ? 'Edit personality' : 'Create personality'}</h2>
          </div>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => canSave && onSave(draft)}
              className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                canSave ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              {editing ? 'Save' : 'Create personality'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-lg overflow-y-auto px-2xl pb-2xl">
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-primary">
              Personality name<span className="text-chip-danger-text"> *</span>
            </label>
            <input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Enter personality name"
              className="h-9 w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-primary">
              Personality prompt<span className="text-chip-danger-text"> *</span>
            </label>
            <p className="m-0 text-small text-text-secondary">
              Detailed instructions defining how the AI agent should behave, respond, and handle conversations
            </p>
            <textarea
              value={draft.prompt}
              onChange={(e) => patch({ prompt: e.target.value })}
              rows={5}
              className="w-full resize-y rounded-md border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <FieldSelect
              label="Voice model"
              required
              info="The speech model used when this personality places a test call."
              value={draft.voiceModel}
              placeholder="Select voice model"
              options={VOICE_MODELS}
              open={openField === 'voiceModel'}
              onOpenChange={(next) => setOpenField(next ? 'voiceModel' : null)}
              onChange={(voiceModel) => patch({ voiceModel })}
            />
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-primary">
                Voice ID<span className="text-chip-danger-text"> *</span>
              </label>
              <input
                value={draft.voiceId}
                onChange={(e) => patch({ voiceId: e.target.value })}
                placeholder="Enter voice ID"
                className="h-9 w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <FieldSelect
              label="Interruption level"
              value={draft.interruption}
              placeholder="Off"
              options={INTERRUPTION_LEVELS}
              open={openField === 'interruption'}
              onOpenChange={(next) => setOpenField(next ? 'interruption' : null)}
              onChange={(interruption) => patch({ interruption })}
            />
            <RangeField
              label="Speed"
              value={draft.speed}
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={0.01}
              marks={['0.8x', '1.0x', '1.2x']}
              onChange={(speed) => patch({ speed })}
            />
          </div>

          <RangeField
            label="Volume"
            hint="How loudly the testing agent speaks. Works on every voice provider; values below 1 simulate a caller who is hard to hear."
            value={draft.volume}
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={0.01}
            marks={['0.01x', '1.0x', '2x']}
            onChange={(volume) => patch({ volume })}
          />

          <FieldSelect
            label="Background noise"
            value={draft.backgroundNoise}
            placeholder="None"
            options={NOISE_OPTIONS}
            open={openField === 'noise'}
            onOpenChange={(next) => setOpenField(next ? 'noise' : null)}
            onChange={(backgroundNoise) => patch({ backgroundNoise })}
          />

          <FieldSelect
            label="Language"
            value={draft.language}
            placeholder="Select language"
            options={LANGUAGES}
            open={openField === 'language'}
            onOpenChange={(next) => setOpenField(next ? 'language' : null)}
            onChange={(language) => patch({ language })}
          />

          <div className="rounded-md border border-border">
            <button
              type="button"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((current) => !current)}
              className="flex h-11 w-full items-center justify-between px-md text-body text-text-primary"
            >
              Advanced settings
              <Icon name={advancedOpen ? 'expand_less' : 'expand_more'} size={18} className="text-text-icon" />
            </button>
            {advancedOpen && (
              <div className="grid grid-cols-2 gap-lg border-t border-border px-md py-lg">
                <FieldSelect
                  label="Accent"
                  value={draft.accent}
                  placeholder="Select accent"
                  options={ACCENTS}
                  open={openField === 'accent'}
                  onOpenChange={(next) => setOpenField(next ? 'accent' : null)}
                  onChange={(accent) => patch({ accent })}
                />
                <FieldSelect
                  label="Gender"
                  value={draft.gender}
                  placeholder="Select gender"
                  options={GENDERS}
                  open={openField === 'gender'}
                  onOpenChange={(next) => setOpenField(next ? 'gender' : null)}
                  onChange={(gender) => patch({ gender: gender as PersonalityGender })}
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

/** Front desk (Sep 23) Test tab — Personality section. A grid of caller personalities plus a
 *  create/edit side panel for the voice, pace, and noise settings used in a test call. */
export function TestPersonalitySection({ personalities, onChange }: TestPersonalitySectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = personalities.find((personality) => personality.id === editingId) ?? null

  function update(id: string, partial: Partial<TestPersonality>) {
    onChange(personalities.map((personality) => (personality.id === id ? { ...personality, ...partial } : personality)))
  }

  function save(draft: PersonalityDraft) {
    const next: TestPersonality = {
      id: editing?.id ?? nextPersonalityId(personalities),
      name: draft.name.trim(),
      description: editing?.description && editing.description !== editing.name ? editing.description : '',
      prompt: draft.prompt.trim(),
      voiceModel: draft.voiceModel,
      voiceId: draft.voiceId.trim(),
      interruption: draft.interruption || 'Off',
      speed: draft.speed,
      volume: draft.volume,
      backgroundNoise: draft.backgroundNoise || 'None',
      language: draft.language,
      accent: draft.accent || 'N/A',
      gender: draft.gender || 'Neutral',
      kind: 'custom',
      featured: editing?.featured ?? false,
      enabled: editing?.enabled ?? true,
    }
    onChange(editing ? personalities.map((personality) => (personality.id === editing.id ? next : personality)) : [next, ...personalities])
    setDrawerOpen(false)
    setEditingId(null)
  }

  return (
    <>
      <div className="mb-lg flex items-center justify-between">
        <h1 className="m-0 text-h3 text-text-primary">Personality</h1>
        <button
          type="button"
          onClick={() => {
            setEditingId(null)
            setDrawerOpen(true)
          }}
          className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Create personality
        </button>
      </div>
      <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {personalities.map((personality) => (
          <PersonalityCard
            key={personality.id}
            personality={personality}
            onToggle={(enabled) => update(personality.id, { enabled })}
            onEdit={() => {
              setEditingId(personality.id)
              setDrawerOpen(true)
            }}
            onDuplicate={() => {
              const copy: TestPersonality = {
                ...personality,
                id: nextPersonalityId(personalities),
                voiceId: nextPersonalityId(personalities),
                name: `${personality.name} copy`,
                kind: 'custom',
                featured: false,
              }
              onChange([copy, ...personalities])
            }}
          />
        ))}
      </div>
      <PersonalityDrawer
        open={drawerOpen}
        editing={editing}
        onClose={() => {
          setDrawerOpen(false)
          setEditingId(null)
        }}
        onSave={save}
      />
    </>
  )
}
