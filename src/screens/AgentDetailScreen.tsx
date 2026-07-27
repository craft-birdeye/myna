import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Chip,
  ComposerAttachPopover,
  CustomizeColumnsDrawer,
  DataTable,
  FilterPanel,
  HeaderSearchField,
  Icon,
  INFO_CARD_LAYOUT,
  InfoCard,
  InfoCardListItem,
  MetricTiles,
  RefChip,
  Tabs,
  Toast,
  TopNav,
  type AttachItem,
  type ChipVariant,
  type Column,
  type ColumnOption,
  type FilterField,
  type Metric,
  type Tab,
} from '../components'
import PreviewPanel from '../workflow/Molecules/PreviewPanel/PreviewPanel'
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import { AgentInstanceScreen } from './AgentInstanceScreen'
import { NewFrontdeskAgentSetupScreen } from './NewFrontdeskAgentSetupScreen'
import type { WizardAgentDraft } from '../data/wizardAgentConfig.types'
import type { Procedure, RefKind, Token } from '../data/procedureData'
import { HC_PROCEDURES } from '../data/procedureData'
import sendArrowIcon from '../assets/icon-send-arrow.svg'

interface AgentDetailScreenProps {
  agentName: string
  onEditAgent?: (agentName: string, draft?: WizardAgentDraft) => void
  onAgentSetupActiveChange?: (active: boolean) => void
  onNavigateToInbox?: (conversationId?: string) => void
  product?: string
}

interface AgentInstance {
  name: string
  status: string
  channels: string
  locations: string
  interactions?: string
  fcr?: string
  aht?: string
  escalation?: string
  bookings?: string
  confirmed?: string
  confirmRate?: string
  outreachSent?: string
  slotsFilled?: string
  fillRate?: string
  timeSaved?: string
  patientsContacted?: string
  recallConversionRate?: string
  avgTouchesToBook?: string
  staffHoursSaved?: string
  revenueRecovered?: string
  balancesContacted?: string
  amountCollected?: string
  arDaysReduced?: string
  clickToPayRate?: string
  plansFollowedUp?: string
  acceptanceRate?: string
  revenueUnlocked?: string
  avgTouchesToAccept?: string
  callToBookingConversion?: string
  warmTransferRate?: string
  statusUpdated?: string
  conversationsAssigned?: string
  conversationsManaged?: string
  [key: string]: string | undefined
}

const TABS: Tab[] = [
  { id: 'agents', label: 'Agents' },
  { id: 'library', label: 'Library' },
]

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Running: 'success',
  Paused:  'warning',
  Draft:   'neutral',
}

interface RegionRow {
  region: string
  status: string
  channels: string
  locations: string
  interactions?: string
  fcr?: string
  aht?: string
  escalation?: string
  bookings?: string
  confirmed?: string
  confirmRate?: string
  outreachSent?: string
  slotsFilled?: string
  fillRate?: string
  timeSaved?: string
  patientsContacted?: string
  recallConversionRate?: string
  avgTouchesToBook?: string
  staffHoursSaved?: string
  revenueRecovered?: string
  balancesContacted?: string
  amountCollected?: string
  arDaysReduced?: string
  clickToPayRate?: string
  plansFollowedUp?: string
  acceptanceRate?: string
  revenueUnlocked?: string
  avgTouchesToAccept?: string
  callToBookingConversion?: string
  warmTransferRate?: string
  statusUpdated?: string
  conversationsAssigned?: string
  conversationsManaged?: string
}

const REGIONS_BY_AGENT: Record<string, RegionRow[]> = {
  'Front desk agent': [
    { region: 'North region', status: 'Running', channels: 'Voice call',        interactions: '8,200', fcr: '7,380', aht: '90%', escalation: '18h', locations: '358' },
    { region: 'East region',  status: 'Running', channels: 'Web chat, Text',    interactions: '5,600', fcr: '4,928', aht: '88%', escalation: '12h', locations: '212' },
    { region: 'South region', status: 'Paused',  channels: 'Text, Facebook',    interactions: '2,900', fcr: '2,494', aht: '86%', escalation: '6h',  locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call',        interactions: '1,720', fcr: '1,428', aht: '83%', escalation: '4h',  locations: '140' },
  ],
  'Reminder agent': [
    { region: 'North region', status: 'Running', channels: 'Text, Email',       interactions: '1,680', fcr: '78%', aht: '1m 12s', escalation: '10%', locations: '358', bookings: '180', confirmed: '42', confirmRate: '23.3%', timeSaved: '8 min' },
    { region: 'East region',  status: 'Running', channels: 'Text',              interactions: '1,120', fcr: '75%', aht: '1m 25s', escalation: '12%', locations: '212', bookings: '120', confirmed: '28', confirmRate: '23.3%', timeSaved: '8 min' },
    { region: 'South region', status: 'Paused',  channels: 'Email',             interactions: '640',  fcr: '73%', aht: '1m 38s', escalation: '14%', locations: '180', bookings: '90',  confirmed: '20', confirmRate: '22.2%', timeSaved: '7 min' },
    { region: 'West region',  status: 'Draft',   channels: 'Text, Email',       interactions: '407',  fcr: '68%', aht: '1m 55s', escalation: '15%', locations: '140', bookings: '60',  confirmed: '10', confirmRate: '16.7%', timeSaved: '6 min' },
  ],
  'Outreach agent': [
    { region: 'North region', status: 'Running', channels: 'Voice call',        interactions: '920', fcr: '42%', aht: '2m 45s', escalation: '9%',  locations: '358' },
    { region: 'East region',  status: 'Running', channels: 'Text, Email',       interactions: '610', fcr: '37%', aht: '3m 10s', escalation: '12%', locations: '212' },
    { region: 'South region', status: 'Paused',  channels: 'Email',             interactions: '360', fcr: '35%', aht: '3m 30s', escalation: '14%', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call, Text',  interactions: '213', fcr: '30%', aht: '3m 55s', escalation: '17%', locations: '140' },
  ],
  'Waitlist agent': [
    { region: 'North region', status: 'Running', channels: 'Text, Email',       outreachSent: '800',  slotsFilled: '780',  fillRate: '34%', timeSaved: '1.8 hrs', locations: '500' },
    { region: 'East region',  status: 'Running', channels: 'Voice call',        outreachSent: '500',  slotsFilled: '400',  fillRate: '29%', timeSaved: '2.2 hrs', locations: '250' },
    { region: 'South region', status: 'Paused',  channels: 'Text',              outreachSent: '500',  slotsFilled: '490',  fillRate: '26%', timeSaved: '2.8 hrs', locations: '200' },
    { region: 'West region',  status: 'Draft',   channels: 'Email',             outreachSent: '1050', slotsFilled: '1000', fillRate: '22%', timeSaved: '3.4 hrs', locations: '100' },
  ],
  'Pre-visit agent': [
    { region: 'North region', status: 'Running', channels: 'Text, Email',       interactions: '1,040', fcr: '962',   aht: '93%', escalation: '37h', locations: '358' },
    { region: 'East region',  status: 'Running', channels: 'Voice call',        interactions: '880',   fcr: '810',   aht: '92%', escalation: '31h', locations: '212' },
    { region: 'South region', status: 'Paused',  channels: 'Web chat',          interactions: '760',   fcr: '694',   aht: '91%', escalation: '27h', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Text',              interactions: '620',   fcr: '556',   aht: '90%', escalation: '22h', locations: '140' },
  ],
  'Recall agent': [
    { region: 'North region', status: 'Running', channels: 'Voice call, Text',  patientsContacted: '1,120', recallConversionRate: '71%', avgTouchesToBook: '2.2', staffHoursSaved: '94h', revenueRecovered: '$44K', locations: '358' },
    { region: 'East region',  status: 'Running', channels: 'Text, Email',       patientsContacted: '890',   recallConversionRate: '69%', avgTouchesToBook: '2.4', staffHoursSaved: '74h', revenueRecovered: '$32K', locations: '212' },
    { region: 'South region', status: 'Paused',  channels: 'Email',             patientsContacted: '820',   recallConversionRate: '66%', avgTouchesToBook: '2.6', staffHoursSaved: '62h', revenueRecovered: '$28K', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call',        patientsContacted: '580',   recallConversionRate: '62%', avgTouchesToBook: '2.8', staffHoursSaved: '44h', revenueRecovered: '$20K', locations: '140' },
  ],
  'Revenue agent': [
    { region: 'North region', status: 'Running', channels: 'Text, Email',       balancesContacted: '590', amountCollected: '$48K', arDaysReduced: '-31%', clickToPayRate: '76%', staffHoursSaved: '62h', locations: '358' },
    { region: 'East region',  status: 'Running', channels: 'Email',             balancesContacted: '440', amountCollected: '$38K', arDaysReduced: '-28%', clickToPayRate: '74%', staffHoursSaved: '46h', locations: '212' },
    { region: 'South region', status: 'Paused',  channels: 'Text',              balancesContacted: '490', amountCollected: '$34K', arDaysReduced: '-26%', clickToPayRate: '72%', staffHoursSaved: '40h', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Text, Email',       balancesContacted: '300', amountCollected: '$22K', arDaysReduced: '-23%', clickToPayRate: '70%', staffHoursSaved: '28h', locations: '140' },
  ],
  'Treatment plan agent': [
    { region: 'North region', status: 'Running', channels: 'Voice call',        plansFollowedUp: '680', acceptanceRate: '63%', revenueUnlocked: '$288K', callToBookingConversion: '48%', warmTransferRate: '9%', avgTouchesToAccept: '2.0', staffHoursSaved: '88h', locations: '358' },
    { region: 'East region',  status: 'Running', channels: 'Voice call, Text',  plansFollowedUp: '530', acceptanceRate: '61%', revenueUnlocked: '$224K', callToBookingConversion: '44%', warmTransferRate: '11%', avgTouchesToAccept: '2.1', staffHoursSaved: '68h', locations: '212' },
    { region: 'South region', status: 'Paused',  channels: 'Text, Email',       plansFollowedUp: '490', acceptanceRate: '59%', revenueUnlocked: '$204K', callToBookingConversion: '41%', warmTransferRate: '12%', avgTouchesToAccept: '2.2', staffHoursSaved: '58h', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Email',             plansFollowedUp: '440', acceptanceRate: '57%', revenueUnlocked: '$176K', callToBookingConversion: '38%', warmTransferRate: '14%', avgTouchesToAccept: '2.4', staffHoursSaved: '48h', locations: '140' },
  ],
  'Tagging & routing agent': [
    { region: 'North region', status: 'Running', channels: 'Voice call, Text, Chat', statusUpdated: '1000', conversationsAssigned: '900', conversationsManaged: '950', timeSaved: '20m', locations: '500' },
    { region: 'East Region',  status: 'Running', channels: 'Text, Chat',             statusUpdated: '1000', conversationsAssigned: '800', conversationsManaged: '900', timeSaved: '15m', locations: '250' },
    { region: 'South Region', status: 'Paused',  channels: 'Voice call, Text',       statusUpdated: '450',  conversationsAssigned: '400', conversationsManaged: '400', timeSaved: '3m',  locations: '200' },
    { region: 'West Region',  status: 'Draft',   channels: 'Chat',                   statusUpdated: '400',  conversationsAssigned: '350', conversationsManaged: '380', timeSaved: '2m',  locations: '100' },
  ],
}

const DEFAULT_REGIONS: RegionRow[] = REGIONS_BY_AGENT['Front desk agent']

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

type LibraryView = 'grid' | 'list'

// ── Library template cards for the create-agent empty state ───────────────
const LIBRARY_TEMPLATES = [
  {
    id: 'routing',
    title: 'Routing and triage',
    description: 'Handles inbound calls, identifies intent, routes urgent symptoms, and transfers to the right team with context',
  },
  {
    id: 'new-patient',
    title: 'New patient intake',
    description: 'Guides new patients through intake, verifies their insurance, and books the right appointment',
  },
  {
    id: 'established',
    title: 'Established patient scheduling',
    description: 'Validates existing records, checks coverage, and books or reschedules follow-up visits with preferred providers',
  },
  {
    id: 'urgent',
    title: 'Urgent escalations',
    description: 'Detects high-risk symptoms, follows escalation policy, and hands off immediately to clinical staff or emergency guidance',
  },
]

// ── Healthcare-only "Front desk agents" create screen: library cards ───────
const HEALTHCARE_FRONTDESK_CREATE_CARDS = [
  {
    id: 'routing',
    title: 'Routing and triage',
    description: 'Handles inbound calls, identifies intent, routes urgent symptoms, and transfers to the right team with context',
  },
  {
    id: 'new-patient',
    title: 'New patient intake',
    description: 'Guides new patients through intake, verifies their insurance, and books the right appointment',
  },
  {
    id: 'patient-scheduling',
    title: 'Patient scheduling',
    description: 'Finds returning patient records, confirms coverage, and books or reschedules visits',
  },
]

// ── Per-agent library cards ──────────────────────────────────────────────────
const DENTAL_AGENT_LIBRARY: Record<string, { id: string; title: string; description: string }[]> = {
  'Front desk agent': [
    {
      id: 'frontdesk-routing-triage',
      title: 'Front desk agent routing and triage',
      description: 'Handles inbound calls, texts, and web chats to identify patient needs, answer questions from the knowledge base, manage appointments & verify insurance',
    },
  ],
  'Recall agent': [
    {
      id: 'recall-hygiene-outreach',
      title: 'Hygiene recall outreach',
      description: 'Pre-built outbound flow that identifies overdue patients, reaches out across voice and SMS, and books them into hygiene appointments — with HIPAA-safe voicemail fallback.',
    },
    {
      id: 'recall-reactivation-campaign',
      title: 'Lapsed patient reactivation',
      description: 'Multi-touch sequence combining email, SMS nudge, and a live voice call to re-engage patients who have gone 12+ months without a visit and get them back on the schedule.',
    },
  ],
  'Revenue agent': [
    {
      id: 'revenue-balance-collection',
      title: 'Balance collection call flow',
      description: 'Structured outbound voice flow that verifies identity, presents the outstanding balance, offers a secure pay-by-link or payment plan, and routes disputes to the billing team.',
    },
    {
      id: 'revenue-payment-plan',
      title: 'Payment plan enrollment',
      description: 'Guided conversation that offers flexible installment options to patients with larger balances, confirms terms over the call, and sends a written summary via text.',
    },
  ],
  'Treatment plan agent': [
    {
      id: 'tp-v1-scheduled',
      title: 'Treatment plan agent — Schedule based',
      description: 'Runs on a fixed 2-week cadence and batch-pulls every unscheduled plan matching the filters, then escalates email → text → wait → voice call.',
    },
    {
      id: 'tp-v2-event',
      title: 'Treatment plan agent — Event trigger based',
      description: 'Fires per plan the moment a qualifying unscheduled plan is added, giving the patient time to self-schedule before each nudge.',
    },
  ],
  'Waitlist agent': [
    {
      id: 'waitlist-agent',
      title: 'Waitlist agent',
      description: 'Manages waitlist requests by reviewing availability, offering open slots, and confirming appointments with patients.',
    },
  ],
  'Pre-visit agent': [
    {
      id: 'previsit-checkin-outreach',
      title: 'Pre-visit agent',
      description: 'The Pre-Visit Agent automates pre-appointment check-in form outreach.',
    },
  ],
  'Tagging & routing agent': [
    {
      id: 'tagging-routing',
      title: 'Tagging & routing',
      description: 'Analyze conversations to assign the right contact status, route messages to the appropriate team or user, and manage when conversations stay open or closed.',
    },
  ],
}

// ── Illustration for the create-agent empty state ──────────────────────────
function CreateAgentEmptyState({
  onCreateFromScratch,
  onSelectFromLibrary,
}: {
  onCreateFromScratch: () => void
  onSelectFromLibrary: (templateId: string) => void
}) {
  return (
    <div className="flex w-full max-w-[980px] flex-col items-center gap-[24px] py-lg">
      {/* Mini workflow illustration */}
      <div className="relative shrink-0">
        <div
          style={{
            width: 168,
            background: '#fff',
            borderRadius: 6,
            padding: '20px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 12px rgba(33,33,33,0.08)',
          }}
        >
          <div style={{ background: '#ebeff6', borderRadius: 4, height: 23, width: 76, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <div style={{ background: '#afbcdf', height: 4, borderRadius: 100, width: 51 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ width: 36, height: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg width="36" height="31" viewBox="0 0 36 31" fill="none" style={{ position: 'absolute' }}>
                  <path d="M18 0 L18 12 M18 12 L6 24 M18 12 L30 24" stroke="#afbcdf" strokeWidth="1" fill="none" />
                </svg>
                <div style={{ background: '#f4f6f7', borderRadius: 40, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#555', lineHeight: 1 }}>add</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 1, width: '100%' }}>
            <div style={{ background: '#ebeff6', border: '1px dashed #2b3650', borderRadius: 4, height: 23, width: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#555', lineHeight: 1 }}>add</span>
            </div>
            <div style={{ background: '#ebeff6', borderRadius: 4, height: 23, flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
              <div style={{ background: '#afbcdf', height: 4, borderRadius: 100, width: '80%' }} />
            </div>
          </div>
        </div>
        {/* AI overlay chip */}
        <div style={{ position: 'absolute', top: -23, right: -62, background: '#ecf5fd', border: '1px solid #6834b7', borderRadius: 4, padding: '11px 7px', display: 'flex', alignItems: 'flex-end', gap: 5, width: 116 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#6834b7', lineHeight: 1 }}>auto_awesome</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ background: '#3790e7', height: 4, borderRadius: 100, width: '100%' }} />
            <div style={{ background: '#9aceff', height: 4, borderRadius: 100, width: '60%' }} />
          </div>
        </div>
      </div>

      {/* Copy + CTAs */}
      <div className="flex flex-col items-center gap-sm text-center">
        <p style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '-0.28px', color: '#212121', margin: 0 }}>
          Build your agent.{' '}
          <button
            type="button"
            onClick={onCreateFromScratch}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1976d2', fontSize: 14, fontFamily: 'inherit', letterSpacing: '-0.28px', lineHeight: '20px' }}
          >
            Set up a new agent
          </button>
        </p>
        <p style={{ fontSize: 14, color: '#212121', margin: 0, letterSpacing: '-0.28px', lineHeight: '20px' }}>or</p>
        <p style={{ fontSize: 14, color: '#212121', margin: 0, letterSpacing: '-0.28px', lineHeight: '20px' }}>
          Select from <span style={{ color: '#1976d2' }}>library</span>
        </p>
      </div>

      {/* Library template cards — same InfoCard component as the Library tab */}
      <div className="grid w-full grid-cols-4 gap-md">
        {LIBRARY_TEMPLATES.map((tpl) => (
          <InfoCard
            key={tpl.id}
            title={tpl.title}
            description={tpl.description}
            actionLabel="Use agent"
            onAction={() => onSelectFromLibrary(tpl.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Loader statuses shown while the agent draft is being "built" after submit.
const AGENT_BUILD_LOADER_STEPS = [
  'Building procedures',
  'Configuring tools',
  'Checking for integrations',
  'Checking attached call transcripts',
  'Building on procedures',
  'Working on procedures',
]


// Real Healthcare Frontdesk procedures (see src/data/procedureData.ts) offered
// as the recommended starting set — unselected until the user picks them.
const RECOMMENDED_PROCEDURES = [
  {
    name: 'General inquiry',
    description: 'Answers informational questions about hours, location, insurance, services, and directions.',
  },
  {
    name: 'Handle emergency or urgent concern',
    description: 'Detects urgent symptoms or safety issues and routes the caller fast, for caller safety.',
  },
  {
    name: 'Book, cancel, reschedule appointment',
    description: 'Verifies patient identity, confirms insurance, matches services, and secures a slot.',
  },
  {
    name: 'Verify insurance',
    description: 'Runs an eligibility check so the patient knows their copay and coverage before booking.',
  },
  {
    name: 'Appointment confirmation',
    description: 'Runs the reminder journey that confirms a scheduled appointment.',
  },
  {
    name: 'Talk to human',
    description: 'Hands off to a live agent when the caller asks for a person or shows frustration.',
  },
]







// Call-analysis insights shown after documents are reviewed (demo stats).
const ANALYSIS_INSIGHTS = [
  { id: 'calls', icon: 'check_circle', label: '847 calls analyzed', tone: 'success' as const },
  { id: 'avg', icon: 'schedule', label: 'Avg call: 4.2 min', tone: 'info' as const },
  { id: 'escalations', icon: 'warning', label: '134 escalations detected', tone: 'info' as const },
]

// Use cases / jobs-to-be-done offered after analysis (multi-select).
interface JobOption {
  id: string
  title: string
  description: string
  pct?: string
}

const JOB_OPTIONS: JobOption[] = [
  { id: 'usd', pct: '31', title: 'Urgent symptom detection', description: 'Callers describing pain, swelling, or bleeding that needs same-day triage.' },
  { id: 'esc', pct: '27', title: 'Escalate to on-call staff', description: 'Calls that ended in warm transfer to a dentist or nurse on duty.' },
  { id: 'dfc', pct: '18', title: 'Distressed or frustrated caller', description: 'Emotional escalation — caller upset about wait times, billing, or outcomes.' },
  { id: 'rcu', pct: '14', title: 'Repeat caller — unresolved issue', description: 'Patient calling back within 48 hrs for the same unresolved concern.' },
  { id: 'slc', pct: '6', title: 'Safety or liability concern', description: 'Mentions of allergic reactions, medication errors, or post-procedure complications.' },
  { id: 'mau', pct: '4', title: 'Missed appointment — urgent follow-up', description: 'No-show for a critical procedure requiring immediate rebooking.' },
]

// Map selected use cases → recommended procedures shown on the build summary.
const JOB_TO_PROCEDURE: Record<string, string> = {
  usd: 'Handle emergency or urgent concern',
  esc: 'Talk to human',
  dfc: 'Talk to human',
  rcu: 'General inquiry',
  slc: 'Handle emergency or urgent concern',
  mau: 'Book, cancel, reschedule appointment',
}


// Bobbing ghost mascot — bluish-gray only, no color — shown for the final
// "building the agent" step (see the showProgress gate below).
function GhostLoader() {
  return (
    <div className="flex flex-col items-start" aria-hidden>
      <div className="ghost-float text-[#e2e5e9]">
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 4C18 4 8 14 8 28v20c0 1.5 1.7 2.4 3 1.5l4-3 4 3c1 .8 2.4.8 3.4 0l4-3 4 3c1 .8 2.4.8 3.4 0l4-3 4 3c1.3.9 3-.1 3-1.5V28C56 14 46 4 32 4z"
            fill="currentColor"
          />
          <circle cx="24" cy="27" r="3" fill="#9ca3af" />
          <circle cx="40" cy="27" r="3" fill="#9ca3af" />
        </svg>
      </div>
      <div className="ghost-shadow-pulse mt-xs h-[6px] w-8 rounded-full bg-[#d1d5db]" />
    </div>
  )
}

function AgentBuildLoaderRow({
  label,
  animKey,
  showProgress = false,
}: {
  label: string
  animKey?: number | string
  showProgress?: boolean
}) {
  return (
    <div className="agent-build-fade mt-lg flex flex-col gap-sm" key={animKey}>
      {showProgress && <GhostLoader />}
      <div className="flex items-center gap-xs text-small text-text-secondary">
        {!showProgress && (
          <Icon name="progress_activity" size={16} className="animate-spin text-text-icon" />
        )}
        <span>{label}</span>
        <span className="inline-flex items-center gap-px" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="animate-pulse size-1 rounded-full bg-text-secondary"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[36px] flex justify-end">
      <span className="max-w-[80%] rounded-lg bg-[#f0f0f0] px-md py-sm text-body leading-[1.5] text-text-primary">{children}</span>
    </div>
  )
}

const CREATE_PHASE_ORDER = [
  'ask-docs',
  'ask-jobs',
  'ask-confirm-create',
  'building',
  'summary',
] as const


type CreatePhase = (typeof CREATE_PHASE_ORDER)[number]

// Rotating status labels shown for ~2.4s before each agent response lands.
// Two labels per step, 1.2s each (mirrors the location-thinking cadence).
const STEP_THINKING_LABELS: Partial<Record<CreatePhase, string[]>> = {
  'ask-jobs': [
    'Building the use case cards...',
    'Rendering the agent analysis message...',
    'Wiring up the confirmation flow...',
  ],
}

function phaseAtLeast(current: CreatePhase, target: CreatePhase) {
  return CREATE_PHASE_ORDER.indexOf(current) >= CREATE_PHASE_ORDER.indexOf(target)
}

function isRefToken(token: Token): token is { kind: RefKind; label: string } {
  return typeof token === 'object' && token !== null && 'kind' in token
}

function ProcedureStepTokens({ tokens }: { tokens: Token[] }) {
  return (
    <span className="text-body leading-6 text-text-primary">
      {tokens.map((token, i) =>
        isRefToken(token) ? (
          <RefChip key={`${token.kind}-${token.label}-${i}`} kind={token.kind} label={token.label} className="mx-xs" />
        ) : (
          <span key={i}>{token}</span>
        ),
      )}
    </span>
  )
}

function ProcedurePreviewPanel({
  procedure,
  onClose,
}: {
  procedure: Procedure
  onClose: () => void
}) {
  const visibleContext = procedure.context.slice(0, 4)
  const moreContext = Math.max(0, procedure.context.length - visibleContext.length)

  return (
    <div className="flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border bg-surface px-lg py-md">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="shrink-0 text-text-icon hover:text-text-primary"
          >
            <Icon name="arrow_back" size={18} />
          </button>
          <h3 className="truncate text-body text-text-primary">{procedure.name}</h3>
        </div>
        <button
          type="button"
          aria-label="Close procedure"
          onClick={onClose}
          className="shrink-0 text-text-icon hover:text-text-primary"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto p-lg">
        <div className="flex flex-col gap-sm">
          <p className="text-small text-text-secondary">
            When to use this procedure? <span className="text-chip-danger-text">*</span>
          </p>
          <p className="text-body leading-6 text-text-primary">{procedure.whenToUse}</p>
        </div>

        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-small text-text-secondary">
            Context
            <Icon name="info" size={14} className="text-text-icon" />
          </div>
          <div className="flex flex-col gap-sm rounded-md border border-border bg-surface-l2 p-md">
            <div className="flex flex-wrap gap-sm">
              {visibleContext.map((item) => (
                <RefChip key={`${item.kind}-${item.label}`} kind={item.kind} label={item.label} />
              ))}
            </div>
            {moreContext > 0 && (
              <span className="text-body text-text-action">+ {moreContext} more</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-small text-text-secondary">
            Steps
            <Icon name="info" size={14} className="text-text-icon" />
          </div>
          <div className="flex flex-col gap-md rounded-md border border-border p-md">
            {procedure.steps.map((step, stepIndex) => (
              <div key={step.title} className="flex flex-col gap-sm">
                <p className="text-body text-text-primary">
                  {stepIndex + 1}. {step.title}
                </p>
                <ul className="flex list-disc flex-col gap-sm pl-lg">
                  {step.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="marker:text-text-secondary">
                      <ProcedureStepTokens tokens={bullet.tokens} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Healthcare-only "Front desk agents" create screen ──────────────────────
// Matches the Figma "What would you like to build today?" prompt-box layout.
// Scoped to Front desk agent + Healthcare product only — every other agent
// keeps the CreateAgentEmptyState illustration above.
function HealthcareFrontdeskCreateAgentScreen({
  onCreateFromScratch,
  onSelectFromLibrary,
  onCreateAgent,
}: {
  onCreateFromScratch: () => void
  onSelectFromLibrary: (templateId: string) => void
  onCreateAgent?: (options?: { publish?: boolean }) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [phase, setPhase] = useState<CreatePhase>('ask-docs')
  const [docsAnswer, setDocsAnswer] = useState('')
  const [docsProvided, setDocsProvided] = useState(false)
  const [docsAttachments, setDocsAttachments] = useState<AttachItem[]>([])
  const [confirmCreateAnswer, setConfirmCreateAnswer] = useState('')
  const [agentName, setAgentName] = useState('')
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [jobsAnswer, setJobsAnswer] = useState('')
  const [jobsAnswerPills, setJobsAnswerPills] = useState<string[]>([])
  const [showAllJobs, setShowAllJobs] = useState(false)
  const [introThinking, setIntroThinking] = useState(false)
  const [stepThinkingPhase, setStepThinkingPhase] = useState<CreatePhase | null>(null)
  const [stepThinkingIndex, setStepThinkingIndex] = useState(0)
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([])
  const [openProcedureName, setOpenProcedureName] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [showTestFollowUp, setShowTestFollowUp] = useState(false)
  const hadPreviewSessionRef = useRef(false)
  const previewActiveRef = useRef(false)
  const [loaderIndex, setLoaderIndex] = useState<number | null>(null)
  const [followUp, setFollowUp] = useState('')
  const [attachments, setAttachments] = useState<AttachItem[]>([])
  const threadRef = useRef<HTMLDivElement | null>(null)
  const [threadOverflowing, setThreadOverflowing] = useState(false)

  const building = loaderIndex !== null
  const stepThinking = stepThinkingPhase !== null
  const composerLocked = building || stepThinking || previewActive

  const handlePreviewActiveChange = (active: boolean) => {
    const wasActive = previewActiveRef.current
    previewActiveRef.current = active
    setPreviewActive(active)
    if (active) {
      hadPreviewSessionRef.current = true
      return
    }
    // Only when a live session ends (active → inactive), not on panel mount.
    if (wasActive && hadPreviewSessionRef.current) {
      setShowTestFollowUp(true)
    }
  }

  const handlePreviewClose = () => {
    const wasActive = previewActiveRef.current
    previewActiveRef.current = false
    setPreviewOpen(false)
    setPreviewActive(false)
    if ((wasActive || hadPreviewSessionRef.current) && hadPreviewSessionRef.current) {
      setShowTestFollowUp(true)
    }
  }

  const resetCreateFlow = () => {
    setSubmitted(false)
    setPhase('ask-docs')
    setDocsAnswer('')
    setDocsProvided(false)
    setDocsAttachments([])
    setConfirmCreateAnswer('')
    setAgentName('')
    setSelectedProcedures([])
    setSelectedJobs([])
    setJobsAnswer('')
    setJobsAnswerPills([])
    setShowAllJobs(false)
    setStepThinkingPhase(null)
    setOpenProcedureName(null)
    setPreviewOpen(false)
    setPreviewActive(false)
    setShowTestFollowUp(false)
    hadPreviewSessionRef.current = false
    previewActiveRef.current = false
    setFollowUp('')
  }

  // Advance to the next question behind a short "analyzing / building /
  // getting context" loader; the new agent response stays hidden until done.
  const advanceWithThinking = (next: CreatePhase) => {
    setPhase(next)
    if (STEP_THINKING_LABELS[next]) {
      setStepThinkingPhase(next)
      setStepThinkingIndex(0)
    }
  }

  // Reveal a step's block only once its thinking delay has finished.
  const showStep = (target: CreatePhase) => phaseAtLeast(phase, target) && stepThinkingPhase !== target

  // Show the "Scroll to latest" chevron only when the conversation actually
  // overflows its scroll container.
  useEffect(() => {
    const thread = threadRef.current
    const scrollEl = thread?.parentElement
    if (!thread || !scrollEl) return
    const measure = () => setThreadOverflowing(scrollEl.scrollHeight > scrollEl.clientHeight + 4)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(thread)
    observer.observe(scrollEl)
    return () => observer.disconnect()
  }, [submitted])

  useEffect(() => {
    if (!introThinking) return
    const timer = setTimeout(() => setIntroThinking(false), 1500)
    return () => clearTimeout(timer)
  }, [introThinking])


  useEffect(() => {
    if (stepThinkingPhase === null) return
    const labels = STEP_THINKING_LABELS[stepThinkingPhase] ?? []
    const timer = setTimeout(() => {
      if (stepThinkingIndex < labels.length - 1) {
        setStepThinkingIndex(stepThinkingIndex + 1)
      } else {
        setStepThinkingPhase(null)
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [stepThinkingPhase, stepThinkingIndex])

  useEffect(() => {
    if (loaderIndex === null) return
    const timer = setTimeout(() => {
      if (loaderIndex < AGENT_BUILD_LOADER_STEPS.length - 1) {
        setLoaderIndex(loaderIndex + 1)
      } else {
        setLoaderIndex(null)
        setPhase('summary')
      }
    }, 2600)
    return () => clearTimeout(timer)
  }, [loaderIndex])

  // Keep the latest agent response in view: scroll the conversation to the
  // bottom whenever a new message, loader row, or answer is rendered.
  useEffect(() => {
    if (!submitted) return
    const scrollEl = threadRef.current?.parentElement
    if (!scrollEl) return
    const raf = requestAnimationFrame(() => {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(raf)
  }, [
    submitted,
    phase,
    introThinking,
    stepThinkingPhase,
    stepThinkingIndex,
    loaderIndex,
    agentName,
    docsAnswer,
    confirmCreateAnswer,
    jobsAnswer,
    showTestFollowUp,
  ])

  const handleSend = () => {
    if (!prompt.trim()) return
    setSubmitted(true)
    setPhase('ask-docs')
    setIntroThinking(true)
  }

  const startBuilding = () => {
    setPhase('building')
    setLoaderIndex(0)
  }

  const submitDocs = (answer: string, provided: boolean, items: AttachItem[] = []) => {
    setDocsAnswer(answer)
    setDocsProvided(provided || items.length > 0)
    setDocsAttachments(items)
    setSelectedJobs([])
    setJobsAnswer('')
    setJobsAnswerPills([])
    if (items.length > 0) setAttachments([])
    advanceWithThinking('ask-jobs')
  }

  const confirmCreateAgent = (answer: string) => {
    setConfirmCreateAnswer(answer)
    setAgentName((prev) => prev || 'Front desk agent')
    const fromJobs = selectedJobs.map((id) => JOB_TO_PROCEDURE[id]).filter(Boolean)
    const unique = [...new Set(fromJobs)]
    setSelectedProcedures(
      unique.length > 0
        ? unique
        : RECOMMENDED_PROCEDURES.slice(0, 4).map((p) => p.name),
    )
    startBuilding()
  }

  const toggleJob = (id: string) => {
    setSelectedJobs((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]))
  }

  const confirmSelectedJobs = () => {
    if (selectedJobs.length === 0) return
    const titles = JOB_OPTIONS.filter((job) => selectedJobs.includes(job.id)).map((job) => job.title)
    setJobsAnswerPills(titles)
    setJobsAnswer(titles.join(', '))
    setAgentName((prev) => prev || 'Front desk agent')
    const fromJobs = selectedJobs.map((id) => JOB_TO_PROCEDURE[id]).filter(Boolean)
    const unique = [...new Set(fromJobs)]
    setSelectedProcedures(
      unique.length > 0
        ? unique
        : RECOMMENDED_PROCEDURES.slice(0, 4).map((p) => p.name),
    )
    startBuilding()
  }

  const handleAttachSelect = (item: AttachItem) => {
    // "+ Add file" stands in for a real file picker in this prototype.
    const resolved: AttachItem =
      item.id === 'add-file'
        ? { id: `file-${Date.now()}`, kind: 'file', label: 'Front-desk-call-transcripts.pdf' }
        : item
    setAttachments((prev) => (prev.some((a) => a.id === resolved.id) ? prev : [...prev, resolved]))
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handlePaperclipAttach = () => {
    const labels = [
      'Call transcripts. April to July 2026.',
      'Escalation matrix / triage protocol',
      'On-call staff directory / routing contacts',
    ]
    setAttachments((prev) => {
      const next = [...prev]
      labels.forEach((label) => {
        if (!next.some((a) => a.label === label)) {
          next.push({ id: `paperclip-${Date.now()}-${label}`, kind: 'file', label })
        }
      })
      return next
    })
  }

  const canSendFollowUp =
    phase === 'ask-docs'
      ? Boolean(followUp.trim() || attachments.length > 0)
      : Boolean(followUp.trim())

  const handleFollowUpSend = () => {
    if (!canSendFollowUp || building || introThinking || stepThinking || previewActive) return
    if (phase === 'ask-docs') {
      const items = [...attachments]
      const provided = items.length > 0 || Boolean(followUp.trim())
      const label =
        followUp.trim() ||
        (items.length > 0 ? items.map((a) => a.label).join(', ') : 'No documents added')
      submitDocs(label, provided, items)
    } else if (phase === 'ask-jobs') {
      if (followUp.trim()) {
        setJobsAnswerPills([])
        setJobsAnswer(followUp.trim())
        setAgentName((prev) => prev || 'Front desk agent')
        setSelectedProcedures(RECOMMENDED_PROCEDURES.slice(0, 4).map((p) => p.name))
        startBuilding()
      }
    } else if (phase === 'ask-confirm-create') {
      confirmCreateAgent(followUp.trim() || 'Yes, go ahead')
    }
    // Clear any leftover attachment tray items after send.
    if (attachments.length > 0 && phase !== 'ask-docs') setAttachments([])
    setFollowUp('')
  }

  if (submitted) {
    return (
      <div
        ref={threadRef}
        className="relative flex min-h-full w-full max-w-[1600px] flex-1 justify-center gap-xl self-start pb-lg pr-sm"
      >
        <style>{`
          .agent-build-fade { animation: agent-build-fade-in 0.25s ease-out; }
          @keyframes agent-build-fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
        `}</style>

        {/* Spacer mirrors the right panel's width so the chat stays centered on
            wide screens, but collapses first (shrink-[999]) on narrow ones so the
            chat keeps its width and the panel stays pinned to the right edge. */}
        {(openProcedureName || previewOpen) && (
          <div className="hidden w-[480px] min-w-0 shrink-[999] lg:block" aria-hidden />
        )}

        <div className="flex w-full min-w-0 max-w-[720px] flex-col">
        <div className="flex justify-end">
          <span className="max-w-[80%] rounded-lg bg-[#f0f0f0] px-md py-sm text-body leading-[1.5] text-text-primary">{prompt.trim()}</span>
        </div>

        {introThinking ? (
          <AgentBuildLoaderRow label="Thinking" />
        ) : (
          <>
            <div className="agent-build-fade mt-2xl flex flex-col gap-sm">
              <p className="text-body leading-6 text-text-primary">Welcome! 👋 I'll help you build your agent step by step.</p>
              <p className="mt-md text-body leading-6 text-text-primary">
                To get started, add any docs, call transcripts, or other materials that will help me create your agent.
              </p>
              <p className="text-body text-text-tertiary">
                Tip: Call recordings, FAQs, SOPs, and knowledge-base links all work well. Use the + or paperclip below to attach them.
              </p>
              {phase === 'ask-docs' && (
                <div className="mt-sm">
                  <button
                    type="button"
                    onClick={() => submitDocs('No documents added', false)}
                    className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>

            {docsAttachments.length > 0 ? (
              <div className="mt-[36px] flex justify-end">
                <div className="flex max-w-[80%] flex-wrap justify-end gap-sm">
                  {docsAttachments.map((item) => (
                    <RefChip key={item.id} kind={item.kind} label={item.label} />
                  ))}
                </div>
              </div>
            ) : (
              docsAnswer && <UserBubble>{docsAnswer}</UserBubble>
            )}

            {stepThinkingPhase === 'ask-jobs' && (
              <AgentBuildLoaderRow
                label={(STEP_THINKING_LABELS['ask-jobs'] ?? [])[stepThinkingIndex] ?? 'Building the use case cards...'}
                animKey={`ask-jobs-${stepThinkingIndex}`}
              />
            )}

            {showStep('ask-jobs') && (
              <>
                <div className="agent-build-fade mt-2xl flex flex-col gap-sm">
                  <p className="text-body leading-6 text-text-primary">
                    {docsProvided
                      ? "I've analyzed the call transcripts you uploaded. Here's what I found across 847 calls from the last 3 months:"
                      : "Here's a sample of what analysis looks like across 847 calls from the last 3 months:"}
                  </p>
                  <div className="mt-sm flex flex-wrap items-center gap-sm">
                    {ANALYSIS_INSIGHTS.map((insight) => (
                      <span
                        key={insight.id}
                        className={`inline-flex h-8 items-center gap-xs rounded-full px-md text-small ${
                          insight.tone === 'success'
                            ? 'bg-chip-success-bg text-chip-success-text'
                            : 'bg-[#e8f1fb] text-primary'
                        }`}
                      >
                        <Icon name={insight.icon} size={16} fill={insight.id === 'calls'} />
                        {insight.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="agent-build-fade mt-2xl flex flex-col gap-sm">
                  <p className="text-body leading-6 text-text-primary">
                    Based on this analysis, here are a few use cases / jobs to be done that stood out — select the ones that are relevant for your agent.
                  </p>
                  {phase === 'ask-jobs' && (
                    <>
                      <div className="mt-xs flex flex-col gap-sm">
                        {(showAllJobs ? JOB_OPTIONS : JOB_OPTIONS.slice(0, 4)).map((job) => {
                          const isSelected = selectedJobs.includes(job.id)
                          return (
                            <button
                              key={job.id}
                              type="button"
                              onClick={() => toggleJob(job.id)}
                              aria-pressed={isSelected}
                              className={`flex items-start gap-md rounded-lg border bg-surface px-lg py-md text-left transition-colors ${
                                isSelected ? 'border-primary' : 'border-border hover:bg-surface-hover'
                              }`}
                            >
                              <span
                                className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                                  isSelected ? 'border-primary bg-primary text-white' : 'border-border-strong bg-surface text-transparent'
                                }`}
                              >
                                {isSelected && <Icon name="check" size={14} />}
                              </span>
                              <span className="flex flex-col gap-xs">
                                <span className="flex items-baseline gap-sm">
                                  <span className="text-body text-text-primary">{job.title}</span>
                                  {job.pct && <span className="text-small text-text-tertiary">{job.pct}% of calls</span>}
                                </span>
                                <span className="text-small text-text-secondary">{job.description}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      {JOB_OPTIONS.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setShowAllJobs((prev) => !prev)}
                          className="mt-xs self-start text-body text-text-action hover:underline"
                        >
                          {showAllJobs ? 'View less' : `View more (${JOB_OPTIONS.length - 4})`}
                        </button>
                      )}
                      <div className="mt-sm">
                        <button
                          type="button"
                          onClick={confirmSelectedJobs}
                          disabled={selectedJobs.length === 0}
                          className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                            selectedJobs.length > 0
                              ? 'bg-primary text-white hover:bg-primary-hover'
                              : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                          }`}
                        >
                          Continue
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {jobsAnswerPills.length > 0 ? (
                  <div className="mt-[36px] flex justify-end">
                    <div className="flex max-w-[80%] flex-wrap justify-end gap-sm">
                      {jobsAnswerPills.map((title) => (
                        <span
                          key={title}
                          className="inline-flex h-8 items-center rounded-full border border-border bg-surface-selected px-md text-small text-text-primary"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  jobsAnswer && <UserBubble>{jobsAnswer}</UserBubble>
                )}
              </>
            )}

            {phaseAtLeast(phase, 'ask-confirm-create') && (phase === 'ask-confirm-create' || confirmCreateAnswer) && (
              <>
                <div className="agent-build-fade mt-2xl flex flex-col gap-sm">
                  <p className="text-body leading-6 text-text-primary">
                    Can I go ahead and create an agent based on these use cases?
                  </p>
                  {phase === 'ask-confirm-create' && (
                    <div className="mt-xs flex flex-wrap items-center gap-sm">
                      <button
                        type="button"
                        onClick={() => confirmCreateAgent('Yes, go ahead')}
                        className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white hover:bg-primary-hover"
                      >
                        Yes, go ahead
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmCreateAnswer('')
                          setJobsAnswer('')
                          setJobsAnswerPills([])
                          setSelectedJobs([])
                          setPhase('ask-jobs')
                        }}
                        className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                      >
                        Not yet
                      </button>
                    </div>
                  )}
                </div>
                {confirmCreateAnswer && <UserBubble>{confirmCreateAnswer}</UserBubble>}
              </>
            )}

            {stepThinking && stepThinkingPhase && stepThinkingPhase !== 'ask-jobs' && (
              <AgentBuildLoaderRow
                label={(STEP_THINKING_LABELS[stepThinkingPhase] ?? [])[stepThinkingIndex] ?? 'Thinking'}
                animKey={`${stepThinkingPhase}-${stepThinkingIndex}`}
              />
            )}

            {building && (
              <AgentBuildLoaderRow
                label={AGENT_BUILD_LOADER_STEPS[loaderIndex ?? 0]}
                animKey={loaderIndex ?? 0}
                showProgress
              />
            )}

            {phase === 'summary' && (
              <div className="agent-build-fade mt-2xl flex flex-col gap-md">
                {selectedProcedures.length > 0 && (
                  <div className="flex flex-col gap-sm">
                    <p className="text-body leading-6 text-text-primary">
                      I have built procedures based on your use cases:
                    </p>
                    {selectedProcedures.slice(0, 4).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setOpenProcedureName(name)}
                        className="flex w-full items-center gap-md rounded-xl border border-primary bg-surface px-lg py-md text-left hover:bg-surface-hover"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-hover">
                          <Icon name="menu_book" size={20} className="text-text-icon" />
                        </span>
                        <span className="flex-1 text-body text-text-primary">{name} updated</span>
                        <Icon name="chevron_right" size={18} className="shrink-0 text-text-icon" />
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-body leading-6 text-text-secondary">
                  {agentName} is ready to go. I've set up the basics based on what you described.
                </p>

                <p className="mt-md text-body leading-6 text-text-primary">Here's how I'm going to work for you:</p>
                <ul className="flex list-disc flex-col gap-xs pl-lg text-body leading-6 text-text-secondary">
                  <li>I'll respond to inbound calls, texts, and web chats from patients</li>
                  <li>I can look up answers from your knowledge base and FAQs</li>
                  <li>I can check availability, book, confirm, and reschedule appointments</li>
                  <li>I'll escalate urgent symptoms straight to your front desk team</li>
                </ul>

                <div className="mt-sm flex items-center gap-sm">
                  <button
                    type="button"
                    onClick={onCreateFromScratch}
                    className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                  >
                    Yes, that's right
                  </button>
                  <button
                    type="button"
                    onClick={resetCreateFlow}
                    className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                  >
                    Make changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenProcedureName(null)
                      setShowTestFollowUp(false)
                      hadPreviewSessionRef.current = false
                      previewActiveRef.current = false
                      setPreviewActive(false)
                      setPreviewOpen(true)
                    }}
                    className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                  >
                    Test agent
                  </button>
                </div>

                <div className="mt-sm flex items-center gap-md text-text-icon">
                  <button type="button" aria-label="Copy" className="hover:text-text-primary">
                    <Icon name="content_copy" size={18} />
                  </button>
                  <button type="button" aria-label="Read aloud" className="hover:text-text-primary">
                    <Icon name="volume_up" size={18} />
                  </button>
                  <button type="button" aria-label="Good response" className="hover:text-text-primary">
                    <Icon name="thumb_up" size={18} />
                  </button>
                  <button type="button" aria-label="Bad response" className="hover:text-text-primary">
                    <Icon name="thumb_down" size={18} />
                  </button>
                </div>
              </div>
            )}

            {showTestFollowUp && (
              <div className="agent-build-fade mt-2xl flex flex-col gap-sm">
                <p className="text-body leading-6 text-text-primary">
                  How did the agent perform? Would you like to make any changes, or create this agent?
                </p>
                <div className="mt-sm flex items-center gap-sm">
                  <button
                    type="button"
                    onClick={resetCreateFlow}
                    className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                  >
                    Make changes
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateAgent?.()}
                    className="flex h-9 items-center rounded-full border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                  >
                    Create this agent
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateAgent?.({ publish: true })}
                    className="flex h-9 items-center rounded-full bg-primary px-md text-body text-white hover:bg-primary-hover"
                  >
                    Create and publish the agent
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="sticky -bottom-lg z-10 mt-auto flex flex-col gap-md bg-surface pb-lg pt-2xl">
          {threadOverflowing && (
            <div className="flex justify-center">
              <button
                type="button"
                aria-label="Scroll to latest"
                onClick={() => threadRef.current?.parentElement?.scrollTo({ top: threadRef.current.parentElement.scrollHeight, behavior: 'smooth' })}
                className="flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-icon hover:bg-surface-hover"
              >
                <Icon name="expand_more" size={18} />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-md rounded-xl border border-border bg-surface px-lg py-md shadow-card">
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-sm">
                {attachments.map((item) => (
                  <RefChip key={item.id} kind={item.kind} label={item.label} onRemove={() => removeAttachment(item.id)} />
                ))}
              </div>
            )}
            <textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleFollowUpSend()
                }
              }}
              rows={2}
              disabled={composerLocked}
              placeholder={
                previewActive
                  ? 'Test in progress...'
                  : phase === 'ask-docs'
                  ? 'Paste a link, describe what you have, or attach files below...'
                  : phase === 'ask-jobs'
                    ? 'Or describe the use cases in your own words...'
                    : phase === 'ask-confirm-create'
                      ? 'Or type yes to continue...'
                      : 'Message your agent...'
              }
              className="min-h-9 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm text-text-icon">
                <ComposerAttachPopover onSelect={handleAttachSelect} disabled={composerLocked} />
                <button
                  type="button"
                  aria-label="Attach file"
                  onClick={handlePaperclipAttach}
                  disabled={composerLocked}
                  className="hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="attach_file" size={18} />
                </button>
                <button type="button" aria-label="Voice input" className="hover:text-text-primary" disabled={composerLocked}>
                  <Icon name="mic" size={18} />
                </button>
              </div>
              <button
                type="button"
                aria-label="Send"
                onClick={handleFollowUpSend}
                disabled={!canSendFollowUp || composerLocked}
                className={`flex size-9 items-center justify-center rounded-sm transition-colors ${
                  canSendFollowUp && !composerLocked
                    ? 'hover:bg-surface-hover'
                    : 'cursor-not-allowed opacity-40'
                }`}
              >
                <img src={sendArrowIcon} alt="" className="size-6" />
              </button>
            </div>
          </div>
        </div>
        </div>

        {(openProcedureName || previewOpen) && (
          <div className="sticky top-0 hidden w-[480px] shrink-0 self-start lg:block">
            {previewOpen ? (
              <div className="h-[calc(100vh-140px)]">
                <div className="preview-panel-float-wrap !h-full !w-full !p-0 [&_.preview-panel]:!w-full">
                  <PreviewPanel
                    onClose={handlePreviewClose}
                    onPreviewActiveChange={handlePreviewActiveChange}
                    agentName={agentName || 'Front desk agent'}
                    showViewDetails={false}
                  />
                </div>
              </div>
            ) : (
              (() => {
                const procedure = HC_PROCEDURES.find((p) => p.name === openProcedureName)
                if (!procedure) return null
                return <ProcedurePreviewPanel procedure={procedure} onClose={() => setOpenProcedureName(null)} />
              })()
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-[1000px] flex-col items-center gap-2xl self-start py-lg mt-3xl">
      <div className="flex flex-col items-center gap-sm text-center">
        <p className="text-[20px] leading-[28px] tracking-[-0.4px] text-text-primary">
          Build your <span className="ai-gradient-text">agent</span>
        </p>
        <p className="text-[16px] leading-6 tracking-[-0.32px] text-text-secondary">Hey John, add an AI co-worker that gets the work done for you</p>
      </div>

      <div className="ai-gradient-border w-full max-w-[640px] rounded-xl p-[2px]">
        <div className="flex flex-col gap-md rounded-[14px] bg-surface px-lg py-md shadow-card">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the agent you want to build..."
            className="min-h-16 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <button
                type="button"
                className="flex h-8 items-center gap-xs rounded-sm px-sm text-body text-text-primary transition-colors hover:bg-surface-hover"
              >
                <Icon name="add" size={18} />
                Add context
              </button>
              <button
                type="button"
                aria-label="Attach file"
                className="flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <Icon name="attach_file" size={18} />
              </button>
            </div>
            <button
              type="button"
              aria-label="Send"
              onClick={handleSend}
              className="flex size-9 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover"
            >
              <img src={sendArrowIcon} alt="" className="size-6" />
            </button>
          </div>
        </div>
      </div>

      <p className="m-0 mt-3xl text-center text-body text-text-secondary">
        <button
          type="button"
          onClick={onCreateFromScratch}
          className="text-body text-text-action hover:underline"
        >
          Setup manually
        </button>
        <span className="text-text-primary">{' or select from '}</span>
        <button type="button" className="text-body text-text-action hover:underline">
          library
        </button>
      </p>

      <div className="grid w-full grid-cols-3 gap-md">
        {HEALTHCARE_FRONTDESK_CREATE_CARDS.map((tpl) => (
          <div
            key={tpl.id}
            role="button"
            tabIndex={0}
            aria-label={`Use agent: ${tpl.title}`}
            onClick={() => onSelectFromLibrary(tpl.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectFromLibrary(tpl.id) }}
            className={`${INFO_CARD_LAYOUT.root} cursor-pointer`}
          >
            <h3 className="line-clamp-2 shrink-0 text-body text-text-primary">{tpl.title}</h3>
            <p className={INFO_CARD_LAYOUT.description}>{tpl.description}</p>
            <div className={INFO_CARD_LAYOUT.ctaWrap}>
              <span className="inline-flex h-9 w-fit items-center rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary opacity-0 transition-opacity hover:bg-surface-l2 group-hover:opacity-100">
                Use agent
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AgentDetailScreen({ agentName, onEditAgent, onAgentSetupActiveChange, onNavigateToInbox, product }: AgentDetailScreenProps) {
  const [activeTab, setActiveTab] = useState('agents')
  const [libraryView, setLibraryView] = useState<LibraryView>('grid')
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleCreateAgentSuccess = (options?: { publish?: boolean }) => {
    setShowCreateFlow(false)
    setShowSetupWizard(false)
    setSelectedInstance('Front desk agent - North region')
    setToastMessage(
      options?.publish ? 'Agent created and published successfully' : 'Agent created successfully',
    )
    setToastVisible(true)
  }

  const METRICS_BY_AGENT: Record<string, Metric[]> = {
    'Front desk agent': [
      { id: 'responded', value: '18,420', label: 'Conversations responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total inbound conversations handled by the agent across all channels in the selected period.' },
      { id: 'resolved', value: '16,230', label: 'Conversations resolved', delta: '2.1%', trend: 'up', info: true, tooltip: 'Conversations closed without requiring human escalation.' },
      { id: 'resolutionRate', value: '88%', label: 'Resolution rate', delta: '1.8%', trend: 'up', info: true, tooltip: 'Percentage of conversations fully resolved by the agent. Calculated as resolved ÷ responded.' },
      { id: 'timeSaved', value: '40h', label: 'Time saved', delta: '12%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved based on average handle time for equivalent human-handled conversations.' },
    ],
    'Reminder agent': [
      { id: 'bookings', value: '450', label: 'Total bookings', delta: '20%', trend: 'up', info: true, tooltip: 'Total appointments booked across all locations in the selected period.' },
      { id: 'confirmed', value: '100', label: 'Appointments confirmed', delta: '36.6%', trend: 'up', info: true, tooltip: 'Number of upcoming appointments confirmed by the patient via automated reminder outreach, reducing the likelihood of a no-show.' },
      { id: 'confirmRate', value: '23.7%', label: 'Confirmation rate', delta: '20%', trend: 'up', info: true, tooltip: 'Percentage of total bookings where the patient confirmed attendance. Calculated as appointments confirmed ÷ total bookings.' },
      { id: 'timeSaved', value: '8 min', label: 'Time saved', delta: '5.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved per confirmed appointment by automating reminder outreach and follow-up.' },
    ],
    'Waitlist agent': [
      { id: 'outreachSent', value: '5.5K', label: 'Outreach sent', delta: '12%', trend: 'up', info: true, tooltip: 'Total waitlist outreach messages sent by the agent to fill cancelled or open slots.' },
      { id: 'slotsFilled', value: '7.9K', label: 'Slots filled', delta: '36.6%', trend: 'up', info: true, tooltip: 'Number of open or cancelled slots successfully filled via waitlist outreach.' },
      { id: 'fillRate', value: '23.7%', label: 'Fill rate', delta: '20%', trend: 'up', info: true, tooltip: 'Percentage of waitlisted patients who booked after receiving outreach. Calculated as slots filled ÷ outreach sent.' },
      { id: 'timeSaved', value: '2.5 hrs', label: 'Time saved', delta: '20%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved by automating waitlist outreach instead of manually calling through the list.' },
    ],
    'Pre-visit agent': [
      { id: 'outreach',   value: '463',   label: 'Outreach sent',    delta: '1.3%', trend: 'up' as const, info: true, tooltip: 'Total intake reminder outreach sent by the agent across all channels in the selected period.' },
      { id: 'intakes',    value: '2,700', label: 'Intakes completed', delta: '1.3%', trend: 'up' as const, info: true, tooltip: 'Number of patient intake forms fully completed following agent outreach.' },
      { id: 'completion', value: '90%',   label: 'Completion rate',   delta: '1.3%', trend: 'up' as const, info: true, tooltip: 'Percentage of outreach that resulted in a completed intake. Calculated as intakes completed ÷ outreach sent.' },
      { id: 'timeSaved',  value: '1h',    label: 'Time saved',        delta: '1.3%', trend: 'up' as const, info: true, tooltip: 'Estimated staff hours saved by automating intake collection instead of manual follow-up calls.' },
    ],
    'Outreach agent': [
      { id: 'leads', value: '2,103', label: 'Leads contacted', info: true, tooltip: 'Total leads the agent reached out to via call or message in the selected period.' },
      { id: 'response', value: '38%', label: 'Response rate', info: true, tooltip: 'Percentage of contacted leads that replied to the outreach.' },
      { id: 'appointments', value: '641', label: 'Appointments scheduled', info: true, tooltip: 'Leads that confirmed a visit or test drive after being contacted.' },
      { id: 'conversion', value: '11%', label: 'Conversion rate', info: true, tooltip: 'Percentage of contacted leads that resulted in a scheduled appointment. Calculated as appointments ÷ leads contacted.' },
    ],
    'Recall agent': [
      { id: 'patientsContacted', value: '3,410', label: 'Patients contacted', delta: '4.2%', trend: 'up', info: true, tooltip: 'Distinct patients who received at least one successfully delivered agent touch in the period. Base population = patients flagged recall-due (hygiene, dormant, or unscheduled treatment).' },
      { id: 'recallConversion', value: '68%', label: 'Recall conversion rate', delta: '2.1%', trend: 'up', info: true, tooltip: 'Share of contacted patients who booked a recare/recall appointment attributable to the agent within the attribution window.' },
      { id: 'staffHoursSaved', value: '274h', label: 'Staff hours saved', delta: '8.2%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved by automating recall outreach — based on average time-per-manual-contact across converted patients.' },
      { id: 'revenueRecovered', value: '$124K', label: 'Revenue recovered', delta: '5.8%', trend: 'up', info: true, tooltip: 'Production value of attributed recare appointments, recognized on completion.' },
    ],
    'Revenue agent': [
      { id: 'balancesContacted', value: '1,820', label: 'Balances contacted', delta: '3.1%', trend: 'up', info: true, tooltip: 'Distinct A/R accounts that received ≥1 delivered agent touch about a balance. Base = balance ≥ threshold and aging ≥ threshold days, excluded (active plan / in collections / disputed).' },
      { id: 'amountCollected', value: '$142K', label: 'Amount collected', delta: '5.4%', trend: 'up', info: true, tooltip: 'Total payments completed that are attributable to the agent within the window (via agent-sent link or call).' },
      { id: 'arDaysReduced', value: '-28%', label: 'A/R days reduced', delta: '2.3%', trend: 'up', positiveDown: true, info: true, tooltip: 'Reduction in the balance-weighted average age of outstanding A/R versus baseline. Lower is better.' },
      { id: 'staffHoursSaved', value: '176h', label: 'Staff hours saved', delta: '6.4%', trend: 'up', info: true, tooltip: 'Staff time avoided by automating outreach touches.' },
    ],
    'Treatment plan agent': [
      { id: 'plansFollowedUp', value: '2,140', label: 'Plans followed up', delta: '6.0%', trend: 'up', info: true, tooltip: 'Distinct treatment plans that received ≥1 delivered agent touch. Base = presented, unscheduled plans aged ≥ T+3 days, not opted out / suppressed.' },
      { id: 'acceptanceRate', value: '61%', label: 'Acceptance rate', delta: '3.2%', trend: 'up', info: true, tooltip: 'Share of followed-up plans accepted (agreed + booked, or marked accepted) attributable to the agent within the window.' },
      { id: 'revenueUnlocked', value: '$892K', label: 'Revenue unlocked', delta: '7.1%', trend: 'up', info: true, tooltip: 'Estimated value of accepted + booked plans attributable to the agent.' },
      { id: 'staffHoursSaved', value: '262h', label: 'Staff hours saved', delta: '7.8%', trend: 'up', info: true, tooltip: 'Staff follow-up time avoided by automating outreach.' },
    ],
    'Tagging & routing agent': [
      { id: 'statusUpdated', value: '2,850', label: 'Statuses updated', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total conversations that received an updated contact status in the selected period.' },
      { id: 'conversationsAssigned', value: '2000', label: 'Conversations assigned', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total conversations assigned to a team or user by the agent.' },
      { id: 'conversationsManaged', value: '2500', label: 'Conversations managed', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total conversations tagged and routed end-to-end by the agent.' },
      { id: 'timeSaved', value: '40m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating conversation tagging and routing.' },
    ],
  }

  const DEFAULT_METRICS: Metric[] = [
    { id: 'interactions', value: '2,850', label: 'Interactions handled', info: true, tooltip: 'Total customer interactions managed by the agent in the selected period.' },
    { id: 'fcr', value: '92%', label: 'First contact resolution rate', info: true, tooltip: 'Percentage of interactions resolved on the first contact without follow-up.' },
    { id: 'aht', value: '2m 34s', label: 'Average handle time', info: true, tooltip: 'Average duration of a single interaction from start to resolution.' },
    { id: 'escalation', value: '11%', label: 'Escalation rate', info: true, tooltip: 'Percentage of interactions escalated to a human agent. Lower is generally better.' },
  ]

  const metrics: Metric[] = METRICS_BY_AGENT[agentName] ?? DEFAULT_METRICS

  const regions = REGIONS_BY_AGENT[agentName] ?? DEFAULT_REGIONS
  const data: AgentInstance[] = regions.map((r) => ({
    name: `${agentName} - ${r.region}`,
    status: r.status,
    channels: r.channels,
    interactions: r.interactions,
    fcr: r.fcr,
    aht: r.aht,
    escalation: r.escalation,
    locations: r.locations,
    bookings: r.bookings,
    confirmed: r.confirmed,
    confirmRate: r.confirmRate,
    outreachSent: r.outreachSent,
    slotsFilled: r.slotsFilled,
    fillRate: r.fillRate,
    timeSaved: r.timeSaved,
    patientsContacted: r.patientsContacted,
    recallConversionRate: r.recallConversionRate,
    avgTouchesToBook: r.avgTouchesToBook,
    staffHoursSaved: r.staffHoursSaved,
    revenueRecovered: r.revenueRecovered,
    balancesContacted: r.balancesContacted,
    amountCollected: r.amountCollected,
    arDaysReduced: r.arDaysReduced,
    clickToPayRate: r.clickToPayRate,
    plansFollowedUp: r.plansFollowedUp,
    acceptanceRate: r.acceptanceRate,
    revenueUnlocked: r.revenueUnlocked,
    callToBookingConversion: r.callToBookingConversion,
    warmTransferRate: r.warmTransferRate,
    avgTouchesToAccept: r.avgTouchesToAccept,
    statusUpdated: r.statusUpdated,
    conversationsAssigned: r.conversationsAssigned,
    conversationsManaged: r.conversationsManaged,
  }))

  const isReminder        = agentName === 'Reminder agent'
  const isFrontdesk       = agentName === 'Front desk agent'
  const isWaitlist        = agentName === 'Waitlist agent'
  const isPreVisit        = agentName === 'Pre-visit agent'
  const isRecall          = agentName === 'Recall agent'
  const isRevenue         = agentName === 'Revenue agent'
  const isTreatmentPlan   = agentName === 'Treatment plan agent'
  const isTaggingRouting  = agentName === 'Tagging & routing agent'

  useEffect(() => {
    const isAgentSetupActive = isFrontdesk && (showCreateFlow || showSetupWizard)
    onAgentSetupActiveChange?.(isAgentSetupActive)
    return () => onAgentSetupActiveChange?.(false)
  }, [isFrontdesk, showCreateFlow, showSetupWizard, onAgentSetupActiveChange])
  const COLUMN_DEFS: Array<Column<AgentInstance> & { locked?: boolean }> = [
    { key: 'name', label: 'Agent name', width: 230, sortable: true, locked: true },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      sortable: true,
      render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />,
    },
    ...(isTaggingRouting ? [] : [{ key: 'channels' as keyof AgentInstance, label: 'Channels', width: 140, sortable: true }]),
    ...(isReminder ? [
      { key: 'bookings' as keyof AgentInstance, label: 'Total bookings', width: 110, sortable: true },
      { key: 'confirmed' as keyof AgentInstance, label: 'Appointments confirmed', width: 145, sortable: true },
      { key: 'confirmRate' as keyof AgentInstance, label: 'Confirmation rate', width: 135, sortable: true },
      { key: 'timeSaved' as keyof AgentInstance, label: 'Time saved', width: 90, sortable: true },
    ] : isWaitlist ? [
      { key: 'outreachSent' as keyof AgentInstance, label: 'Outreach sent', width: 120, sortable: true },
      { key: 'slotsFilled' as keyof AgentInstance, label: 'Slots filled', width: 110, sortable: true },
      { key: 'fillRate' as keyof AgentInstance, label: 'Fill rate', width: 90, sortable: true },
      { key: 'timeSaved' as keyof AgentInstance, label: 'Time saved', width: 90, sortable: true },
    ] : isPreVisit ? [
      { key: 'interactions' as keyof AgentInstance, label: 'Outreach sent',     width: 115, sortable: true },
      { key: 'fcr' as keyof AgentInstance,          label: 'Intakes completed',  width: 135, sortable: true },
      { key: 'aht' as keyof AgentInstance,          label: 'Completion rate',    width: 110, sortable: true },
      { key: 'escalation' as keyof AgentInstance,   label: 'Time saved',         width: 90, sortable: true },
    ] : isFrontdesk ? [
      { key: 'interactions' as keyof AgentInstance, label: 'Conversations responded', width: 145, sortable: true },
      { key: 'fcr' as keyof AgentInstance, label: 'Conversations resolved', width: 145, sortable: true },
      { key: 'aht' as keyof AgentInstance, label: 'Resolution rate', width: 105, sortable: true },
      { key: 'escalation' as keyof AgentInstance, label: 'Time saved', width: 90, sortable: true },
    ] : isRecall ? [
      { key: 'patientsContacted' as keyof AgentInstance, label: 'Patients contacted', width: 180, sortable: true },
      { key: 'recallConversionRate' as keyof AgentInstance, label: 'Recall conversion rate', width: 200, sortable: true },
      { key: 'avgTouchesToBook' as keyof AgentInstance, label: 'Avg touches to book', width: 180, sortable: true },
      { key: 'staffHoursSaved' as keyof AgentInstance, label: 'Staff hours saved', width: 170, sortable: true },
      { key: 'revenueRecovered' as keyof AgentInstance, label: 'Revenue recovered', width: 170, sortable: true },
    ] : isRevenue ? [
      { key: 'balancesContacted' as keyof AgentInstance, label: 'Balances contacted', width: 190, sortable: true },
      { key: 'amountCollected' as keyof AgentInstance, label: 'Amount collected', width: 180, sortable: true },
      { key: 'arDaysReduced' as keyof AgentInstance, label: 'A/R days reduced', width: 170, sortable: true },
      { key: 'clickToPayRate' as keyof AgentInstance, label: 'Click-to-pay rate', width: 170, sortable: true },
      { key: 'staffHoursSaved' as keyof AgentInstance, label: 'Staff hours saved', width: 170, sortable: true },
    ] : isTreatmentPlan ? [
      { key: 'plansFollowedUp' as keyof AgentInstance, label: 'Plans followed up', width: 170, sortable: true },
      { key: 'acceptanceRate' as keyof AgentInstance, label: 'Acceptance rate', width: 160, sortable: true },
      { key: 'revenueUnlocked' as keyof AgentInstance, label: 'Revenue unlocked', width: 160, sortable: true },
      { key: 'callToBookingConversion' as keyof AgentInstance, label: 'Call-to-booking conversion', width: 210, sortable: true },
      { key: 'avgTouchesToAccept' as keyof AgentInstance, label: 'Avg touches to accept', width: 185, sortable: true },
      { key: 'staffHoursSaved' as keyof AgentInstance, label: 'Staff hours saved', width: 160, sortable: true },
    ] : isTaggingRouting ? [
      { key: 'statusUpdated' as keyof AgentInstance, label: 'Statuses updated', width: 140, sortable: true },
      { key: 'conversationsAssigned' as keyof AgentInstance, label: 'Conversations assigned', width: 180, sortable: true },
      { key: 'conversationsManaged' as keyof AgentInstance, label: 'Conversations managed', width: 180, sortable: true },
      { key: 'timeSaved' as keyof AgentInstance, label: 'Time saved', width: 110, sortable: true },
    ] : [
      { key: 'interactions' as keyof AgentInstance, label: 'Interactions handled', width: 200, sortable: true },
      { key: 'fcr' as keyof AgentInstance, label: 'First contact resolution rate', width: 220, sortable: true },
      { key: 'aht' as keyof AgentInstance, label: 'Average handle time', width: 180, sortable: true },
      { key: 'escalation' as keyof AgentInstance, label: 'Escalation rate', width: 150, sortable: true },
    ]),
    { key: 'locations', label: 'Locations', width: 120, sortable: true },
  ]

  const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))
  const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
  // Front desk, Pre-visit, Waitlist, and Reminder each report exactly 4 metrics, so all 4
  // are shown by default. Agents with more metrics (Recall, Revenue, Treatment plan, etc.)
  // still default to the first two, with the rest available via Customize columns.
  const metricKeys = COLUMN_DEFS.slice(isTaggingRouting ? 2 : 3, -1).map((c) => String(c.key))
  const showAllMetrics = isFrontdesk || isPreVisit || isWaitlist || isReminder || isTaggingRouting
  const DEFAULT_VISIBLE = ['name', 'status', ...(isTaggingRouting ? [] : ['channels']), ...(showAllMetrics ? metricKeys : metricKeys.slice(0, 2)), 'locations']
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)

  const columns = useMemo<Column<AgentInstance>[]>(
    () => order.filter((k) => visible.includes(k)).map((k) => DEF_BY_KEY.get(k)!).filter(Boolean),
    [order, visible],
  )
  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  const FILTER_FIELDS: FilterField[] = [
    { id: 'status', label: 'Status', options: opts('Running', 'Paused', 'Draft') },
    { id: 'channels', label: 'Channels', options: opts('Voice call', 'Web chat', 'Text', 'Email', 'Facebook'), multi: true },
    { id: 'region', label: 'Region', options: opts('North region', 'East region', 'South region', 'West region') },
    { id: 'location', label: 'Location', options: opts('Mountain View', 'Palo Alto', 'San Jose', 'Sunnyvale') },
  ]

  const librarySource = DENTAL_AGENT_LIBRARY[agentName] ?? LIBRARY_TEMPLATES
  const libraryCards = librarySource.map((tpl) => ({
    title: tpl.title,
    description: tpl.description,
    actionLabel: 'Use agent' as const,
    onAction: () => onEditAgent?.(tpl.title),
  }))

  const searchQ = searchQuery.trim().toLowerCase()
  const visibleData = searchQ ? data.filter((row) => row.name.toLowerCase().includes(searchQ)) : data
  const visibleLibraryCards = searchQ
    ? libraryCards.filter(
        (card) => card.title.toLowerCase().includes(searchQ) || card.description.toLowerCase().includes(searchQ),
      )
    : libraryCards

  if (showSetupWizard && isFrontdesk) {
    return (
      <NewFrontdeskAgentSetupScreen
        onBack={() => setShowSetupWizard(false)}
        onCancel={() => {
          setShowSetupWizard(false)
          setShowCreateFlow(false)
        }}
        onComplete={(draft) => {
          setShowSetupWizard(false)
          setShowCreateFlow(false)
          onEditAgent?.(draft.agentName, draft)
        }}
      />
    )
  }


  if (showCreateFlow && isFrontdesk) {
    const isHealthcareFrontdesk = product === 'healthcare'
    return (
      <div className="flex h-full flex-col">
        <TopNav initials="S" />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex h-16 items-center justify-between bg-surface px-2xl">
            <div className="flex items-center gap-sm">
              <button
                type="button"
                onClick={() => setShowCreateFlow(false)}
                className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                aria-label="Back"
              >
                <Icon name="arrow_back" size={20} />
              </button>
              <h1 className="text-h3 text-text-primary">New front desk agent</h1>
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto px-lg pb-lg pt-0">
            {isHealthcareFrontdesk ? (
              <HealthcareFrontdeskCreateAgentScreen
                onCreateFromScratch={() => setShowSetupWizard(true)}
                onSelectFromLibrary={(_templateId) => { setShowCreateFlow(false); onEditAgent?.('') }}
                onCreateAgent={handleCreateAgentSuccess}
              />
            ) : (
              <CreateAgentEmptyState
                onCreateFromScratch={() => setShowSetupWizard(true)}
                onSelectFromLibrary={(_templateId) => { setShowCreateFlow(false); onEditAgent?.('') }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (selectedInstance) {
    return (
      <>
        <AgentInstanceScreen
          instanceName={selectedInstance}
          onBack={() => setSelectedInstance(null)}
          onEditAgent={onEditAgent}
          onNavigateToInbox={onNavigateToInbox}
          product={product}
        />
        <Toast
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          {/* Header */}
          <div className="flex h-16 items-center justify-between bg-surface px-2xl">
            <h1 className="text-h3 text-text-primary">{agentName}</h1>
            <div className="flex items-center gap-sm">
              <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
              {activeTab === 'agents' ? (
                <>
                  <button
                    type="button"
                    onClick={() => isFrontdesk ? setShowCreateFlow(true) : onEditAgent?.('')}
                    className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                  >
                    Create agent
                  </button>
                  <button type="button" aria-label="Customize columns" onClick={() => setCustomizeOpen(true)} className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                    <Icon name="view_column" size={20} />
                  </button>
                  <button type="button" aria-label="Filters" onClick={() => setFilterOpen((o) => !o)} className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                    <Icon name="filter_list" size={20} />
                  </button>
                </>
              ) : (
                <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm">
                  <button
                    type="button"
                    aria-label="Grid view"
                    onClick={() => setLibraryView('grid')}
                    className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
                      libraryView === 'grid' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
                    }`}
                  >
                    <Icon name="grid_view" size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="List view"
                    onClick={() => setLibraryView('list')}
                    className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
                      libraryView === 'list' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
                    }`}
                  >
                    <Icon name="table_rows" size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-2xl">
            <Tabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={(tabId) => {
                setActiveTab(tabId)
                if (tabId === 'library') setLibraryView('grid')
              }}
            />
          </div>

          {activeTab === 'agents' ? (
            <>
              <div className="px-2xl pt-lg">
                <MetricTiles metrics={metrics} />
              </div>
              <div className="px-lg py-lg">
                <DataTable
                  columns={columns}
                  data={visibleData}
                  scrollOnHover
                  onRowClick={(row) => setSelectedInstance(row.name)}
                  rowMenuItems={[
                    { label: 'Edit', onClick: (row) => onEditAgent?.(row.name) },
                    {
                      label: 'Pause',
                      onClick: () => {},
                      visible: (row) => row.status === 'Running',
                    },
                    { label: 'Duplicate', onClick: () => {} },
                    { label: 'View details', onClick: (row) => setSelectedInstance(row.name) },
                    { label: 'Reports', onClick: () => {} },
                    { label: 'Delete', onClick: () => {}, variant: 'danger' },
                  ]}
                />
              </div>
            </>
          ) : libraryView === 'grid' ? (
            <div className="grid grid-cols-1 gap-lg px-2xl py-lg md:grid-cols-2 xl:grid-cols-4">
              {visibleLibraryCards.map((card) => (
                <InfoCard key={card.title} {...card} />
              ))}
            </div>
          ) : (
            <div className="px-2xl py-lg">
              {visibleLibraryCards.map((card, i) => (
                <InfoCardListItem key={card.title} first={i === 0} {...card} />
              ))}
            </div>
          )}
        </div>

        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>

      <CustomizeColumnsDrawer
        open={customizeOpen}
        options={columnOptions}
        visibleKeys={visible}
        onClose={() => setCustomizeOpen(false)}
        onSave={(orderedKeys, visibleKeys) => {
          setOrder(orderedKeys)
          setVisible(visibleKeys)
        }}
        onRestoreDefault={() => {
          setOrder(DEFAULT_ORDER)
          setVisible(DEFAULT_VISIBLE)
        }}
      />

    </div>
  )
}
