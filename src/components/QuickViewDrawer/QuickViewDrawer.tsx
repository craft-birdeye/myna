import { Icon } from '../Icon/Icon'
import { Link } from '../Link/Link'
import { Chip } from '../Chip/Chip'
import { Tooltip } from '../Tooltip/Tooltip'
import type { QuickViewDrawerProps, QuickViewDrawerIntakeProps } from './QuickViewDrawer.types'
import type { ChipVariant } from '../Chip/Chip.types'
import aiIcon from '../../assets/ai-icon.svg'
import {
  AccordionSection,
  AppointmentInfoSection,
  BasicDetailsSection,
  InsuranceSection,
  ConsentSection,
  MedicalHistorySection,
  SocialHistorySection,
} from './patientSections'

function isIntakeProps(props: QuickViewDrawerProps): props is QuickViewDrawerIntakeProps {
  return 'patient' in props
}

const STATUS_CHIP: Record<string, ChipVariant> = {
  Unconfirmed: 'warning',
  Cancelled:   'danger',
  'No-show':   'danger',
  Confirmed:   'success',
  Rescheduled: 'neutral',
  Waitlisted:  'warning',
  'Slot offered': 'neutral',
  'Slot filled':  'success',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-small text-text-secondary">{label}</span>
      <div className="text-body text-text-primary">{children}</div>
    </div>
  )
}

function DrawerShell({ patient, status, onClose, onViewDetails, onQuickSend, onMessage, onEmail, aiSummary, children }: {
  patient: string
  status: string
  onClose: () => void
  onViewDetails?: () => void
  onQuickSend?: () => void
  onMessage?: () => void
  onEmail?: () => void
  aiSummary: string[]
  children: React.ReactNode
}) {
  const initials = getInitials(patient)

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[160] flex h-full w-[650px] flex-col bg-white shadow-modal">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="arrow_back" size={18} />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Quick view</h2>
          </div>
          <Link
            as="button"
            onClick={onViewDetails}
            className="text-body"
          >
            View details
          </Link>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-lg overflow-y-auto px-2xl py-xl">
          {/* Avatar + name + actions */}
          <div className="flex flex-col items-center gap-md">
            <div className="flex size-[72px] items-center justify-center rounded-full bg-[#c8e6c9]">
              <span className="text-xl text-[#2e7d32]">{initials}</span>
            </div>
            <span className="text-lg text-text-primary">{patient}</span>
            <div className="flex items-center gap-md">
              <Tooltip content="Quick send" variant="brief">
                <button
                  type="button"
                  aria-label="Quick send"
                  onClick={onQuickSend}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                >
                  <Icon name="send" size={18} />
                </button>
              </Tooltip>
              <Tooltip content="Message" variant="brief">
                <button
                  type="button"
                  aria-label="Message"
                  onClick={onMessage}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                >
                  <Icon name="sms" size={18} />
                </button>
              </Tooltip>
              <Tooltip content="Email" variant="brief">
                <button
                  type="button"
                  aria-label="Email"
                  onClick={onEmail}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                >
                  <Icon name="mail" size={18} />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* AI Summary card */}
          <div className="rounded-sm border border-[#c5b3f5] bg-[#faf8ff] px-md py-md">
            <div className="mb-sm flex items-center gap-xs">
              <img src={aiIcon} alt="AI" className="size-5 shrink-0" />
              <span className="text-body text-text-primary">Summary</span>
            </div>
            <ul className="flex flex-col gap-xs">
              {aiSummary.map((item) => (
                <li key={item} className="flex items-start gap-sm text-small text-text-primary">
                  <span className="mt-[6px] size-[5px] shrink-0 rounded-full bg-text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Detail fields */}
          <div className="flex flex-col gap-lg">
            {children}
            <Field label="Status">
              <Chip label={status} variant={STATUS_CHIP[status] ?? 'neutral'} />
            </Field>
          </div>
        </div>
      </div>
    </>
  )
}

export function QuickViewDrawer(props: QuickViewDrawerProps) {
  const { open, onClose } = props
  if (!open) return null

  // Intake mode (patient detail)
  if (isIntakeProps(props)) {
    const { patient } = props
    if (!patient) return null
    const name = patient.patient || 'Unknown patient'
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    const summaryBullets = patient.aiSummary
    return (
      <div className="fixed inset-0 z-[150]">
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />
        <aside className="absolute right-0 top-0 flex h-full w-[650px] flex-col bg-white shadow-modal">
          <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
            <div className="flex items-center gap-sm">
              <button
                type="button"
                aria-label="Back"
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="arrow_back" size={18} />
              </button>
              <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Quick view</h2>
            </div>
            <Link as="button" onClick={props.onViewDetails} className="text-body">
              View details
            </Link>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col items-center gap-sm px-2xl pb-lg pt-xl">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-100 text-[18px] text-green-700">{initials}</div>
              <p className="text-[18px] text-text-primary">{name}</p>
              <div className="flex items-center gap-sm">
                <Tooltip content="Quick send" variant="brief">
                  <button type="button" aria-label="Quick send" onClick={props.onQuickSend} className="flex size-9 items-center justify-center rounded-sm border border-border text-text-icon hover:bg-surface-l2"><Icon name="send" size={18} /></button>
                </Tooltip>
                <Tooltip content="Message" variant="brief">
                  <button type="button" aria-label="Message" onClick={props.onMessage} className="flex size-9 items-center justify-center rounded-sm border border-border text-text-icon hover:bg-surface-l2"><Icon name="sms" size={18} /></button>
                </Tooltip>
                <Tooltip content="Email" variant="brief">
                  <button type="button" aria-label="Email" onClick={props.onEmail} className="flex size-9 items-center justify-center rounded-sm border border-border text-text-icon hover:bg-surface-l2"><Icon name="mail" size={18} /></button>
                </Tooltip>
              </div>
            </div>
            {summaryBullets ? (
              <div className="mx-2xl mb-lg rounded-lg border border-violet-200 bg-violet-50 p-lg">
                <div className="mb-sm flex items-center gap-xs">
                  <img src={aiIcon} alt="AI" className="size-5" />
                  <span className="text-body text-text-primary">Summary</span>
                </div>
                <ul className="space-y-xs">
                  {summaryBullets.map((bullet, i) => (
                    <li key={i} className="flex gap-xs text-body text-text-secondary">
                      <span className="mt-[6px] size-1 shrink-0 rounded-full bg-text-secondary" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mx-2xl mb-lg rounded-lg border border-border bg-surface-subtle p-lg">
                <div className="mb-md flex items-center gap-xs">
                  <img src={aiIcon} alt="AI" className="size-5 opacity-50" />
                  <p className="text-body text-text-secondary">Get insights and actions for {name}</p>
                </div>
                <button type="button" className="flex h-9 items-center rounded-sm bg-[#6834B7] px-lg text-body text-white hover:bg-[#5a2c9e]">Generate summary</button>
              </div>
            )}
            <div className="mx-2xl mb-xl">
              <AccordionSection title="Appointment information" defaultOpen isFirst>
                <AppointmentInfoSection p={patient} />
              </AccordionSection>
              <AccordionSection title="Basic details">
                <BasicDetailsSection p={patient} />
              </AccordionSection>
              <AccordionSection title="Insurance">
                <InsuranceSection p={patient} />
              </AccordionSection>
              <AccordionSection title="Consent">
                <ConsentSection p={patient} />
              </AccordionSection>
              <AccordionSection title="Medical history">
                <MedicalHistorySection p={patient} />
              </AccordionSection>
              <AccordionSection title="Social history">
                <SocialHistorySection p={patient} />
              </AccordionSection>
            </div>
          </div>
        </aside>
      </div>
    )
  }

  // Appointment/waitlist mode
  const { appointment, waitlist, onViewDetails, onQuickSend, onMessage, onEmail } = props
  if (waitlist) {
    const aiSummary = [
      `Patient has been waiting since ${waitlist.waitingSince}`,
      `Preferred slot is ${waitlist.slotPreference.toLowerCase()} — no confirmed appointment yet`,
      `Outreach to be initiated via primary channel`,
    ]
    return (
      <DrawerShell patient={waitlist.patient} status={waitlist.status} onClose={onClose} onViewDetails={onViewDetails} onQuickSend={onQuickSend} onMessage={onMessage} onEmail={onEmail} aiSummary={aiSummary}>
        <Field label="Preferred provider">{waitlist.provider}</Field>
        <Field label="Location">{waitlist.location}</Field>
        <Field label="Appointments type">{waitlist.apptType}</Field>
        <Field label="Slot preference">{waitlist.slotPreference}</Field>
        <Field label="Waiting since">{waitlist.waitingSince}</Field>
        <Field label="Booked by">{waitlist.bookedBy ?? 'Agent'}</Field>
      </DrawerShell>
    )
  }

  if (!appointment) return null

  const aiSummary = [
    `Appointment for Jun 11, 2026 booked on May 21, 2026`,
    `Insurance verification is in progress`,
    `Intake form will be sent on Jun 08, 2026`,
  ]

  return (
    <DrawerShell patient={appointment.patient} status={appointment.status} onClose={onClose} onViewDetails={onViewDetails} onQuickSend={onQuickSend} onMessage={onMessage} onEmail={onEmail} aiSummary={aiSummary}>
      <Field label="Provider">{appointment.provider}</Field>
      <Field label="Appointments type">{appointment.apptType}</Field>
      <Field label="Appointment type">{appointment.dateTime}</Field>
      <Field label="Booked by">{appointment.bookedBy ?? 'Agent'}</Field>
      <Field label="Internal note">
        <span className="text-text-secondary">{appointment.internalNote ?? 'Patient prefers morning appointments. Confirm insurance prior to visit and send reminder 24h before.'}</span>
      </Field>
    </DrawerShell>
  )
}
