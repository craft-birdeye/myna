import type { ReactNode } from 'react'
import { Icon } from '../Icon/Icon'

export const FRONT_DESK_DRAFT_REFILL_PROCEDURE = 'Handle prescription refill request'

const DRAFT_TOOLS = [
  'Appointment scheduler',
  'Patient records (EHR)',
  'Insurance verification',
  'Human handoff',
]

const DRAFT_SETTINGS: { setting: string; value: string; confirmed: boolean; source: string }[] = [
  { setting: 'Channels', value: 'Voice + Text', confirmed: true, source: 'From your response' },
  { setting: 'Greeting', value: '"Thanks for calling [Clinic] — how can I help you today?"', confirmed: false, source: 'Default' },
  { setting: 'Consent', value: 'Standard call-recording consent notice', confirmed: false, source: 'Default' },
  { setting: 'Voice', value: 'Warm, female (US) · standard speed', confirmed: false, source: 'Default' },
  { setting: 'Language', value: 'English (primary)', confirmed: false, source: 'Default' },
  { setting: 'Locations', value: 'All 3 clinic locations', confirmed: false, source: 'Default' },
]

function DraftReviewSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <p className="text-small text-text-tertiary">{label}</p>
      {children}
    </div>
  )
}

export interface FrontDeskDraftReviewContentProps {
  refillAdded?: boolean
  openProcedureName?: string | null
  onOpenProcedure?: (name: string) => void
  /** When false, rows still show hover/chevron affordance but clicks are no-ops. */
  interactive?: boolean
}

/** Full front-desk draft recap — shared by create-flow card and Create with AI trail. */
export function FrontDeskDraftReviewContent({
  refillAdded = false,
  openProcedureName = null,
  onOpenProcedure,
  interactive = true,
}: FrontDeskDraftReviewContentProps) {
  const procedures: { label: string; note: ReactNode; open: string }[] = [
    {
      label: 'Book an appointment',
      note: 'from your transcripts + SOP · verifies insurance eligibility before confirming a new-patient visit (per your SOP)',
      open: 'Book, cancel, or reschedule appointment',
    },
    { label: 'Reschedule an appointment', note: 'from your transcripts', open: 'Reschedule appointment' },
    {
      label: 'Answer insurance questions',
      note: (
        <>
          answers from{' '}
          <span className="inline-flex items-center gap-xs text-text-primary">
            <Icon name="attach_file" size={14} className="text-text-icon" />
            insurance-faq.pdf
          </span>
        </>
      ),
      open: 'Verify insurance',
    },
    {
      label: 'Escalate billing disputes',
      note: 'from your SOP · also escalates any caller who explicitly asks for a human',
      open: 'Talk to human',
    },
  ]
  if (refillAdded) {
    procedures.push({
      label: 'Handle prescription refills',
      note: 'flagged — needs a pharmacy integration before it can go live',
      open: FRONT_DESK_DRAFT_REFILL_PROCEDURE,
    })
  }

  return (
    <div className="flex flex-col gap-lg">
      <DraftReviewSection label="What it does">
        <p className="text-body leading-6 text-text-primary">
          Answers inbound conversations on voice and text, books and reschedules appointments, answers insurance
          questions from your FAQ, and hands off billing disputes to a human.
        </p>
      </DraftReviewSection>

      <DraftReviewSection label="When it runs">
        <p className="text-body leading-6 text-text-primary">Whenever a conversation starts on voice or text.</p>
      </DraftReviewSection>

      <DraftReviewSection label="Procedures — tap to open and read the steps">
        <div className="flex flex-col gap-xs">
          {procedures.map((p) => {
            const pressed = openProcedureName === p.open
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={pressed}
                onClick={() => {
                  if (!interactive) return
                  onOpenProcedure?.(p.open)
                }}
                className={`flex w-full cursor-pointer items-start gap-sm rounded-md px-sm py-sm text-left transition-colors hover:bg-surface-hover ${
                  pressed ? 'bg-surface-hover' : ''
                }`}
              >
                <span className="flex h-6 shrink-0 items-center">
                  <Icon name="menu_book" size={16} className="text-text-icon" />
                </span>
                <span className="min-w-0 flex-1 text-body leading-6">
                  <span className="text-text-primary">{p.label}</span>
                  <span className="text-text-secondary"> — {p.note}</span>
                </span>
                <span className="flex h-6 shrink-0 items-center">
                  <Icon name="chevron_right" size={18} className="text-text-icon" />
                </span>
              </button>
            )
          })}
        </div>
      </DraftReviewSection>

      <DraftReviewSection label="Tools it can use">
        <div className="flex flex-col gap-xs">
          {DRAFT_TOOLS.map((tool) => (
            <div key={tool} className="flex w-full items-center gap-sm rounded-md px-sm py-sm">
              <Icon name="build" size={18} className="shrink-0 text-text-icon" />
              <span className="inline-flex min-w-0 items-center gap-xs text-body text-text-primary">
                {tool}
                <Icon name="check_circle" size={16} className="shrink-0 text-accent-positive" />
              </span>
            </div>
          ))}
        </div>
      </DraftReviewSection>

      <DraftReviewSection label="Settings">
        <div className="flex flex-col gap-sm">
          {DRAFT_SETTINGS.map((row) => (
            <div key={row.setting} className="flex flex-col">
              <span className="text-small leading-tight text-text-tertiary">{row.setting}</span>
              <div className="flex flex-wrap items-center gap-sm">
                <span className="text-body leading-6 text-text-primary">{row.value}</span>
                <span
                  className={`inline-flex shrink-0 items-center gap-xs text-small ${
                    row.confirmed
                      ? 'rounded-full bg-chip-success-bg px-sm py-xs text-chip-success-text'
                      : 'h-5 rounded-sm bg-surface-l2 px-sm text-text-tertiary'
                  }`}
                >
                  {row.confirmed && <Icon name="check_circle" size={14} className="shrink-0" />}
                  {row.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </DraftReviewSection>

      <DraftReviewSection label="Still needed before publish">
        <p className="text-body leading-6 text-text-primary">
          Nothing — every required setting is filled (some by default).
        </p>
      </DraftReviewSection>

      <DraftReviewSection label="What I left out">
        <p className="text-body leading-6 text-text-primary">
          {refillAdded
            ? 'Nothing — I also built the prescription refill procedure, flagged until you connect a pharmacy integration.'
            : "Prescription refills (needs a pharmacy integration you haven't connected)."}
        </p>
      </DraftReviewSection>
    </div>
  )
}
