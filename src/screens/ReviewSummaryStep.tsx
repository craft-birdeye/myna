import { type ReactNode } from 'react'
import { Icon, LanguageFlag } from '../components'
import type { HealthcareProcedureCatalogItem } from '../data/healthcareProcedureCatalog'
import type { WizardLocation } from '../data/wizardLocations'
import {
  TEXT_FALLBACK_AFTER,
  TEXT_FALLBACK_BEFORE,
  WEBCHAT_FALLBACK_AFTER,
  WEBCHAT_FALLBACK_DURING,
  type TextChannelSettings,
  type WebChatChannelSettings,
} from './channelSetupSettings.types'
import { getAgentLanguage } from '../data/agentLanguages'
import type { AgentLanguageId } from '../data/agentLanguages'

type ChannelId = 'voice' | 'webchat' | 'text' | 'email' | 'facebook' | 'instagram'
type RecordingMode = 'off' | 'announced' | 'silent'

interface AdditionalVoiceConfig {
  label: string
  voice: string
  language: AgentLanguageId
  whenToUse: string
  speed: number
}

/**
 * Arrow (Elemental) non-editable field:
 * read-only / disabled fill = L2 BG `#FAFAFA` (`bg-surface-l2`), primary text,
 * input border — not Selected (`#e5e9f0`) which is for inactive CTAs.
 * Source: workflow/elemental-stubs TextField (readOnly → #FAFAFA).
 */
const READONLY_SHELL =
  'w-full rounded-sm border border-border-input bg-surface-l2 text-body text-text-primary'

function SectionHeader({
  title,
  onEdit,
  editAriaLabel,
  className,
}: {
  title: string
  onEdit: () => void
  editAriaLabel: string
  className?: string
}) {
  return (
    <div className={['mb-md flex items-center gap-xs', className].filter(Boolean).join(' ')}>
      <h3 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{title}</h3>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editAriaLabel}
        className="flex size-7 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-primary"
      >
        <Icon name="edit" size={16} />
      </button>
    </div>
  )
}

function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-md">{children}</div>
}

function ReadField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex h-[18px] items-center gap-xs">
        <span className="text-small text-text-primary">{label}</span>
        {required && (
          <span className="text-small text-chip-danger-text" aria-hidden>
            *
          </span>
        )}
      </div>
      {hint && <p className="text-small text-text-secondary">{hint}</p>}
      {children}
    </div>
  )
}

function TextBox({ value, multiline = false, minHeight }: { value: string; multiline?: boolean; minHeight?: string }) {
  if (multiline) {
    return (
      <div
        className={`${READONLY_SHELL} whitespace-pre-wrap px-md py-sm leading-relaxed ${minHeight ?? 'min-h-[120px]'}`}
      >
        {value || '—'}
      </div>
    )
  }
  return (
    <div className={`${READONLY_SHELL} flex h-9 items-center px-md`}>
      {value || '—'}
    </div>
  )
}

function ChipBox({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={`${READONLY_SHELL} flex min-h-9 items-center gap-sm px-md py-sm`}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-sm">{children}</div>
      {trailing}
    </div>
  )
}

function LocationPill({ label }: { label: string }) {
  return (
    <span className="flex h-7 items-center rounded-sm bg-chip-neutral-bg px-md text-body text-text-primary">
      {label}
    </span>
  )
}

function LanguageChip({ id }: { id: string }) {
  const lang = getAgentLanguage(id as AgentLanguageId)
  return (
    <span className="flex h-7 items-center gap-xs rounded-sm bg-chip-neutral-bg px-sm text-body text-text-primary">
      <LanguageFlag countryCode={lang.countryCode} label={lang.label} size="sm" />
      {lang.label}
    </span>
  )
}

export interface ReviewSummaryStepProps {
  agentName: string
  systemPrompt: string
  language: string
  additionalLanguages: string[]
  selectedChannels: Set<ChannelId>
  voice: string
  additionalVoices: string[]
  additionalVoiceConfigs?: AdditionalVoiceConfig[]
  voiceSpeed?: number
  greeting: string
  recording: RecordingMode
  consent: string
  webchatSettings: WebChatChannelSettings
  textSettings: TextChannelSettings
  locations: WizardLocation[]
  selectedLocationIds: string[]
  procedures: HealthcareProcedureCatalogItem[]
  selectedProcedureIds: string[]
  onEditStep: (step: number) => void
  onViewProcedure: (id: string) => void
}

export function ReviewSummaryStep({
  agentName,
  systemPrompt,
  language,
  additionalLanguages,
  selectedChannels,
  voice,
  additionalVoiceConfigs = [],
  greeting,
  recording,
  consent,
  webchatSettings,
  textSettings,
  locations,
  selectedLocationIds,
  procedures,
  selectedProcedureIds,
  onEditStep,
  onViewProcedure,
}: ReviewSummaryStepProps) {
  const selectedLocations = locations.filter((l) => selectedLocationIds.includes(l.id))
  const selectedProcedures = procedures.filter((p) => selectedProcedureIds.includes(p.id))
  const primaryLang = getAgentLanguage(language as AgentLanguageId)
  const hasVoice = selectedChannels.has('voice')
  const hasWebchat = selectedChannels.has('webchat')
  const hasText = selectedChannels.has('text')

  return (
    <div className="flex w-full flex-col">
      <div className="w-full max-w-[978px]">
        <h2 className="text-h3 text-text-primary">Review summary</h2>
        <p className="mt-xs text-small text-text-secondary">
          Review your configurations before creating the agent.
        </p>
      </div>

      {/* Getting started */}
      <section className="w-full max-w-[978px] pt-3xl">
        <SectionHeader
          title="Getting started"
          editAriaLabel="Edit getting started"
          onEdit={() => onEditStep(1)}
        />
        <FieldGroup>
          <ReadField label="Name">
            <TextBox value={agentName} />
          </ReadField>

          <ReadField label="Locations">
            {selectedLocations.length === 0 ? (
              <ChipBox>
                <span className="text-body text-text-tertiary">No locations selected</span>
              </ChipBox>
            ) : (
              <ChipBox>
                {selectedLocations.map((loc) => (
                  <LocationPill key={loc.id} label={loc.name} />
                ))}
              </ChipBox>
            )}
          </ReadField>
        </FieldGroup>
      </section>

      {/* Configure agent */}
      <section className="w-full max-w-[978px] pt-3xl">
        <SectionHeader
          title="Configure agent"
          editAriaLabel="Edit configure agent"
          onEdit={() => onEditStep(2)}
        />
        <FieldGroup>
          <ReadField label="System prompt" required>
            <TextBox value={systemPrompt} multiline minHeight="min-h-[200px]" />
          </ReadField>

          <ReadField
            label="Language"
            hint="Choose the default and additional languages the agent will communicate in."
          >
            <div className={`${READONLY_SHELL} flex h-9 items-center gap-sm px-md`}>
              <LanguageFlag countryCode={primaryLang.countryCode} label={primaryLang.label} />
              <span className="min-w-0 flex-1 truncate">{primaryLang.label}</span>
              <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
            </div>
          </ReadField>

          {additionalLanguages.length > 0 && (
            <ReadField label="Additional language">
              <ChipBox
                trailing={
                  <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
                }
              >
                {additionalLanguages.map((id) => (
                  <LanguageChip key={id} id={id} />
                ))}
              </ChipBox>
            </ReadField>
          )}
        </FieldGroup>
      </section>

      {/* Channel configuration */}
      <section className="w-full max-w-[978px] pt-3xl">
        <SectionHeader
          title="Channel configuration"
          editAriaLabel="Edit channel configuration"
          onEdit={() => onEditStep(3)}
        />

        {selectedChannels.size === 0 ? (
          <div className={`${READONLY_SHELL} flex h-16 items-center justify-center px-md text-text-tertiary`}>
            No channels selected.
          </div>
        ) : (
          <div className="flex flex-col gap-3xl">
            {hasVoice && (
              <div className="flex flex-col gap-md">
                <h4 className="text-body text-text-primary">Voice call settings</h4>

                <ReadField label="Default voice" required>
                  <div className={`${READONLY_SHELL} flex h-9 items-center gap-sm px-md pr-sm`}>
                    <span className="min-w-0 flex-1 truncate">{voice || '—'}</span>
                    <Icon name="chevron_right" size={20} className="shrink-0 text-text-icon" />
                  </div>
                </ReadField>

                {additionalVoiceConfigs.length > 0 && (
                  <ReadField label="Additional voice">
                    <ChipBox>
                      {additionalVoiceConfigs.map((cfg) => {
                        const lang = getAgentLanguage(cfg.language)
                        return (
                          <span
                            key={cfg.label}
                            className="flex h-7 items-center gap-xs rounded-sm bg-chip-neutral-bg px-sm text-body text-text-primary"
                          >
                            <LanguageFlag countryCode={lang.countryCode} label={lang.label} size="sm" />
                            {cfg.label}
                          </span>
                        )
                      })}
                    </ChipBox>
                  </ReadField>
                )}

                <ReadField label="Greeting message">
                  <TextBox value={greeting} multiline minHeight="min-h-[80px]" />
                </ReadField>

                <ReadField label="Voice recording consent">
                  <TextBox
                    value={
                      recording === 'off'
                        ? 'Off'
                        : recording === 'silent'
                          ? 'Record silently'
                          : consent ||
                            'This call may be recorded for quality and training purposes.'
                    }
                    multiline={recording !== 'off'}
                    minHeight={recording !== 'off' ? 'min-h-[64px]' : undefined}
                  />
                </ReadField>
              </div>
            )}

            {hasWebchat && (
              <div className="flex flex-col gap-md">
                <h4 className="text-body text-text-primary">Web chat settings</h4>
                <ReadField label="AI agent name">
                  <TextBox value={webchatSettings.aiAgentName || '—'} />
                </ReadField>
                {webchatSettings.duringEnabled && (
                  <ReadField label="Fallback message (during business hours)">
                    <TextBox value={WEBCHAT_FALLBACK_DURING} multiline minHeight="min-h-[80px]" />
                  </ReadField>
                )}
                {webchatSettings.afterEnabled && (
                  <ReadField label="Fallback message (after business hours)">
                    <TextBox value={WEBCHAT_FALLBACK_AFTER} multiline minHeight="min-h-[80px]" />
                  </ReadField>
                )}
              </div>
            )}

            {hasText && (
              <div className="flex flex-col gap-md">
                <h4 className="text-body text-text-primary">Text settings</h4>
                <ReadField label="Unsubscribe text">
                  <TextBox value={textSettings.unsubscribeEnabled ? 'Enabled' : 'Disabled'} />
                </ReadField>
                {textSettings.beforeEnabled && (
                  <ReadField label="Fallback message (before business hours)">
                    <TextBox value={TEXT_FALLBACK_BEFORE} multiline minHeight="min-h-[80px]" />
                  </ReadField>
                )}
                {textSettings.afterEnabled && (
                  <ReadField label="Fallback message (after business hours)">
                    <TextBox value={TEXT_FALLBACK_AFTER} multiline minHeight="min-h-[80px]" />
                  </ReadField>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Procedures — full content width, 3 cards per row */}
      <section className="w-full pt-3xl">
        <SectionHeader
          title="Procedures"
          editAriaLabel="Edit procedures"
          onEdit={() => onEditStep(4)}
        />
        {selectedProcedures.length === 0 ? (
          <div className={`${READONLY_SHELL} flex h-16 w-full items-center justify-center px-md text-text-tertiary`}>
            No procedures selected.
          </div>
        ) : (
          <div className="grid w-full grid-cols-3 gap-lg">
            {selectedProcedures.map((procedure) => (
              <ProcedureCard
                key={procedure.id}
                title={procedure.title}
                description={procedure.description}
                onView={() => onViewProcedure(procedure.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ProcedureCard({
  title,
  description,
  onView,
}: {
  title: string
  description: string
  onView: () => void
}) {
  return (
    <div className="group relative flex min-h-[148px] flex-col rounded-md border border-border-selected bg-surface p-xl transition-colors hover:bg-surface-selected">
      <button
        type="button"
        onClick={onView}
        className="absolute right-xl top-xl hidden text-body text-text-action hover:text-primary-hover group-hover:block"
      >
        View
      </button>
      <Icon name="menu_book" size={20} className="mb-md shrink-0 text-text-icon" />
      <h4 className="mb-xs pr-lg text-body text-text-primary">{title}</h4>
      <p className="line-clamp-3 text-body text-text-secondary">{description}</p>
    </div>
  )
}
