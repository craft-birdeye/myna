import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  AgentLibraryPreviewModal,
  AttachMenuPopover,
  Chip,
  CustomizeColumnsDrawer,
  DataTable,
  EstimateSavingsModal,
  REVIEW_RESPONSE_SAVINGS_COPY,
  parseTimeSavedHours,
  FilesModal,
  FilterPanel,
  HeaderSearchField,
  Icon,
  INFO_CARD_LAYOUT,
  InfoCard,
  InfoTooltip,
  LibraryCardIcon,
  MediaLibraryModal,
  MetricTiles,
  PromptComposer,
  RefChip,
  ReviewResponseOutcomesCharts,
  Tabs,
  Toast,
  Tooltip,
  TopNav,
  type AgentLibraryPreviewData,
  type AgentLibraryPreviewStep,
  type AttachItem,
  type ChipVariant,
  type Column,
  type ColumnOption,
  type EstimateSavingsValues,
  type FilterField,
  type LibraryCardGlyph,
  type LibraryCardTone,
  type Metric,
  type RowMenuItem,
  type Tab,
} from '../components'
import { ArrowLeft, Columns3, ListFilter } from 'lucide-react'
import PreviewPanel from '../workflow/Molecules/PreviewPanel/PreviewPanel'
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import { AgentInstanceScreen } from './AgentInstanceScreen'
import { NewFrontdeskAgentSetupScreen } from './NewFrontdeskAgentSetupScreen'
import { WorkflowEditorScreen } from './WorkflowEditorScreen'
import { AGENT_INSTANCE_ISSUE_COUNTS } from '../data/agentIssues'
import { getAgentWorkflows } from '../data/agentWorkflows'
import {
  isAgentExplorationChrome,
  isExplorationHideCanvasStartNode,
  isFrontdeskExplorationChrome,
  isLlmTaskExplorationLayout,
  isResponseAgentsExplorationChrome,
} from '../data/agentNavIds'
import { instanceSlugFromName, type DeepRoute } from '../appRoutes'
import type { WizardAgentDraft } from '../data/wizardAgentConfig.types'
import type { Procedure, RefKind, Token } from '../data/procedureData'
import { HC_PROCEDURES } from '../data/procedureData'
import { SendIcon } from '../assets/SendIcon'
import { AiAvatarChatIcon } from '../assets/AiAvatarChatIcon'
import iconAgentsPurple from '../assets/icon-agents-purple.svg'
import iconAgentsTwoStarSparkle from '../assets/icon-agents-two-star-sparkle.svg'
import agentEmptyState from '../assets/agent-empty-state.svg'
import { useSubtleScrollbar } from '../hooks/useSubtleScrollbar'
import { useProcedureStore } from '../data/ProcedureStoreContext'
import {
  rememberCreateAgentChat,
  getLastSavedCreateChat,
  setCreateAiDraftTrail,
  registerBuiltinCreateAiDraft,
} from '../data/createAgentChatStore'
import type { CreateChatTurn } from '../data/createAgentChatStore'
import { FrontDeskDraftReviewContent, FRONT_DESK_DRAFT_REFILL_PROCEDURE } from '../components/AgentDraftReview/FrontDeskDraftReviewContent'
import { useAiBuilderTrail } from '../components/AiBuilderPanel/useAiBuilderTrail'
// Reuse the workflow drawer chrome so Copilot procedure previews align with canvas panels.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RHSSidePanelHeader from '../workflow/Molecules/RHS/RHSHeader/RHSHeader'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LHSDrawer from '../workflow/LHSDrawer/LHSDrawer'
import '../workflow/LHSDrawer/LHSDrawer.css'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LocationsDrawer from '../workflow/RHSDrawer/LocationsDrawer.jsx'

interface AgentDetailScreenProps {
  agentName: string
  /**
   * Side-nav item id (e.g. `response-agents-sep-1`). Used to distinguish Sep 1
   * library-only create landings from the Ghostwriter create flow that shares
   * the same display `agentName`.
   */
  navId?: string
  onEditAgent?: (
    agentName: string,
    draft?: WizardAgentDraft,
    returnTo?: { instanceName: string; tab: string },
    status?: string,
  ) => void
  onAgentSetupActiveChange?: (active: boolean) => void
  onNavigateToInbox?: (conversationId?: string) => void
  /** Automotive-only: opens the Settings > Integrations sub-screen for a given integration
   *  (threaded through to `AgentInstanceScreen` → `AgentSettingsTab`). */
  onOpenIntegrationSettings?: (integrationId: string) => void
  product?: string
  /** Set (e.g. by the canvas eye icon) to reopen a specific instance + tab after a remount. */
  pendingInstanceView?: { instanceName: string; tab: string } | null
  onPendingInstanceViewConsumed?: () => void
  /** Bubbled up from `AgentInstanceScreen` — see its own doc comment. */
  onFullBleedDetailActiveChange?: (active: boolean) => void
  /** Set by the host app when a "Track your feedback" link (Inbox) should open a specific
   *  recommendation inside a specific agent instance. */
  initialRecommendationFocus?: { instanceName: string; recommendationId: string; feedbackPrefill?: string } | null
  onInitialRecommendationFocusConsumed?: () => void
  /** Set by the host app (e.g. the Agent directory "Create agent" CTA) to land directly in
   *  the create-agent flow instead of the agent's default Agents-tab table. */
  autoOpenCreateFlow?: boolean
  onAutoOpenCreateFlowConsumed?: () => void
  /** Address-bar deep link: instance, tab, log row, panel. */
  routeDeep?: DeepRoute
  onDeepRouteChange?: (deep: DeepRoute) => void
}

/** Nav ids that open Create agent as illustration + library cards only (no Ghostwriter chat). */
const LIBRARY_ONLY_CREATE_NAV_IDS = new Set([
  'response-agents-sep-1',
  'reminder-agent-sep-1',
])

const REVIEW_RESPONSE_AGENT_NAME = 'Review response agents'
const REVIEW_RESPONSE_EXPLORATION_AGENT_NAME = 'Review response agents (exploration)'

function isReviewResponseAgentName(name: string) {
  return name === REVIEW_RESPONSE_AGENT_NAME || name === REVIEW_RESPONSE_EXPLORATION_AGENT_NAME
}

/** Review response agent (exploration) grid only — visual card variations.
 *  Default = 2-metric icon card + updated footer; R1 = 4-metric icon card;
 *  R2 = compact footer card; R3 = metric-forward (no icon) + View draft. */
const CARD_LAYOUT_OPTIONS: Array<{ value: 'default' | 'r1' | 'r2' | 'r3'; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'r1', label: 'R1' },
  { value: 'r2', label: 'R2' },
  { value: 'r3', label: 'R3' },
]

const FRONTDESK_AGENT_NAME = 'Front desk agent'
const FRONTDESK_EXPLORATION_AGENT_NAME = 'Front desk agent (exploration)'

function isFrontdeskAgentName(name: string) {
  return name === FRONTDESK_AGENT_NAME || name === FRONTDESK_EXPLORATION_AGENT_NAME
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
  reviewsResponded?: string
  responseRate?: string
  avgResponseTime?: string
  reviewsReceived?: string
  contactsReached?: string
  clickThroughRate?: string
  /** Open issues for this instance — shown next to the status chip and gating Publish in the editor. */
  issues?: number
  lastUpdated?: string
  updatedBy?: string
  /** When true, Agents table nests a Draft name under this live row (same row, no divider). */
  hasDraft?: boolean
  /** Region label from the source RegionRow — used by Agents FilterPanel. */
  region?: string
  /** City mapped from region for Location filter. */
  locationName?: string
  [key: string]: string | number | boolean | undefined
}

function AgentInstanceMoreMenu({
  row,
  items,
  compact = false,
}: {
  row: AgentInstance
  items: RowMenuItem<AgentInstance>[]
  /** Ghost icon button (no border) for dense card headers. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const visibleItems = items.filter((item) => (item.visible ? item.visible(row) : true))
  if (visibleItems.length === 0) return null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation()
          const rect = btnRef.current?.getBoundingClientRect()
          if (!rect) return
          setMenuPos({ top: rect.bottom + 4, left: rect.right - 216 })
          setOpen((current) => !current)
        }}
        className={
          compact
            ? 'flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-l2 hover:text-text-primary'
            : 'flex size-9 shrink-0 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2'
        }
      >
        <Icon name="more_vert" size={compact ? 18 : 20} />
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[110] min-w-[216px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {visibleItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick(row)
                  setOpen(false)
                }}
                className={`block w-full px-md py-sm text-left text-body hover:bg-surface-hover ${
                  item.variant === 'danger' ? 'text-chip-danger-text' : 'text-text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  )
}

const TABS: Tab[] = [
  { id: 'agents', label: 'Agents' },
  { id: 'library', label: 'Library' },
]

const EXPLORATION_DETAIL_TABS: Tab[] = [
  { id: 'agents', label: 'Agents' },
  { id: 'library', label: 'Library' },
  { id: 'outcomes', label: 'Outcomes' },
]

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Active: 'success',
  Inactive: 'warning',
  Draft:   'neutral',
}

// Default row order for the instance table — active agents first, drafts last.
const STATUS_ORDER: Record<string, number> = {
  Active: 0,
  Inactive: 1,
  Draft: 2,
}

interface RegionRow {
  region: string
  status: string
  channels: string
  locations: string
  /** Open issues for this region's workflow — shown next to the status chip and gating Publish in the editor. */
  issues?: number
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
  reviewsResponded?: string
  responseRate?: string
  avgResponseTime?: string
  reviewsReceived?: string
  contactsReached?: string
  clickThroughRate?: string
  /** Overrides the default `${agentName} - ${region}` row label. */
  instanceName?: string
  /** Live instance also has an unpublished draft — shown indented in the same Agents table row. */
  hasDraft?: boolean
  lastUpdated?: string
  updatedBy?: string
}

/** Sample dates / editors for the Agents table trailing columns. */
const LAST_UPDATED_SAMPLES = [
  'August 6',
  'August 5',
  'August 3',
  'July 29',
] as const
const UPDATED_BY_SAMPLES = ['Rupa C', 'Akhil', 'Raynil Kumar', 'Haresh'] as const

const REGIONS_BY_AGENT: Record<string, RegionRow[]> = {
  [FRONTDESK_AGENT_NAME]: [
    { region: 'North region', status: 'Active', channels: 'Voice call',        interactions: '8,200', fcr: '7,380', aht: '90%', escalation: '18h', locations: '358', issues: AGENT_INSTANCE_ISSUE_COUNTS['Front desk agent - North region'], instanceName: 'Front desk agent - North region' },
    { region: 'East region',  status: 'Active', channels: 'Web chat, Text',    interactions: '5,600', fcr: '4,928', aht: '88%', escalation: '12h', locations: '212', instanceName: 'Front desk agent - East region' },
    { region: 'South region', status: 'Inactive',  channels: 'Text, Facebook',    interactions: '2,900', fcr: '2,494', aht: '86%', escalation: '6h',  locations: '180', issues: AGENT_INSTANCE_ISSUE_COUNTS['Front desk agent - South region'], instanceName: 'Front desk agent - South region' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call',        interactions: '1,720', fcr: '1,428', aht: '83%', escalation: '4h',  locations: '140', instanceName: 'Front desk agent - West region' },
  ],
  [FRONTDESK_EXPLORATION_AGENT_NAME]: [
    { region: 'North region', status: 'Active', channels: 'Voice call',        interactions: '8,200', fcr: '7,380', aht: '90%', escalation: '18h', locations: '358', issues: AGENT_INSTANCE_ISSUE_COUNTS['Front desk agent - North region'], instanceName: 'Front desk agent - North region' },
    { region: 'East region',  status: 'Active', channels: 'Web chat, Text',    interactions: '5,600', fcr: '4,928', aht: '88%', escalation: '12h', locations: '212', instanceName: 'Front desk agent - East region' },
    { region: 'South region', status: 'Inactive',  channels: 'Text, Facebook',    interactions: '2,900', fcr: '2,494', aht: '86%', escalation: '6h',  locations: '180', issues: AGENT_INSTANCE_ISSUE_COUNTS['Front desk agent - South region'], instanceName: 'Front desk agent - South region' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call',        interactions: '1,720', fcr: '1,428', aht: '83%', escalation: '4h',  locations: '140', instanceName: 'Front desk agent - West region' },
  ],
  'Reminder agent': [
    { region: 'North region', status: 'Active', channels: 'Text, Email',       interactions: '1,680', fcr: '78%', aht: '1m 12s', escalation: '10%', locations: '358', bookings: '180', confirmed: '42', confirmRate: '23.3%', timeSaved: '8 min', issues: AGENT_INSTANCE_ISSUE_COUNTS['Reminder agent - North region'], instanceName: 'Reminder agent - North region' },
    { region: 'East region',  status: 'Active', channels: 'Text',              interactions: '1,120', fcr: '75%', aht: '1m 25s', escalation: '12%', locations: '212', bookings: '120', confirmed: '28', confirmRate: '23.3%', timeSaved: '8 min', instanceName: 'Reminder agent - East region' },
    { region: 'South region', status: 'Inactive',  channels: 'Email',             interactions: '640',  fcr: '73%', aht: '1m 38s', escalation: '14%', locations: '180', bookings: '90',  confirmed: '20', confirmRate: '22.2%', timeSaved: '7 min', instanceName: 'Reminder agent - South region' },
    { region: 'West region',  status: 'Draft',   channels: 'Text, Email',       interactions: '407',  fcr: '68%', aht: '1m 55s', escalation: '15%', locations: '140', bookings: '60',  confirmed: '10', confirmRate: '16.7%', timeSaved: '6 min', instanceName: 'Reminder agent - West region' },
  ],
  'Outreach agent': [
    { region: 'North region', status: 'Active', channels: 'Voice call',        interactions: '920', fcr: '42%', aht: '2m 45s', escalation: '9%',  locations: '358' },
    { region: 'East region',  status: 'Active', channels: 'Text, Email',       interactions: '610', fcr: '37%', aht: '3m 10s', escalation: '12%', locations: '212' },
    { region: 'South region', status: 'Inactive',  channels: 'Email',             interactions: '360', fcr: '35%', aht: '3m 30s', escalation: '14%', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call, Text',  interactions: '213', fcr: '30%', aht: '3m 55s', escalation: '17%', locations: '140' },
  ],
  'Waitlist agent': [
    { region: 'North region', status: 'Active', channels: 'Text, Email',       outreachSent: '800',  slotsFilled: '780',  fillRate: '34%', timeSaved: '1.8 hrs', locations: '500' },
    { region: 'East region',  status: 'Active', channels: 'Voice call',        outreachSent: '500',  slotsFilled: '400',  fillRate: '29%', timeSaved: '2.2 hrs', locations: '250' },
    { region: 'South region', status: 'Inactive',  channels: 'Text',              outreachSent: '500',  slotsFilled: '490',  fillRate: '26%', timeSaved: '2.8 hrs', locations: '200' },
    { region: 'West region',  status: 'Draft',   channels: 'Email',             outreachSent: '1050', slotsFilled: '1000', fillRate: '22%', timeSaved: '3.4 hrs', locations: '100' },
  ],
  'Pre-visit agent': [
    { region: 'North region', status: 'Active', channels: 'Text, Email',       interactions: '1,040', fcr: '962',   aht: '93%', escalation: '37h', locations: '358' },
    { region: 'East region',  status: 'Active', channels: 'Voice call',        interactions: '880',   fcr: '810',   aht: '92%', escalation: '31h', locations: '212' },
    { region: 'South region', status: 'Inactive',  channels: 'Web chat',          interactions: '760',   fcr: '694',   aht: '91%', escalation: '27h', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Text',              interactions: '620',   fcr: '556',   aht: '90%', escalation: '22h', locations: '140' },
  ],
  'Recall agent': [
    { region: 'North region', status: 'Active', channels: 'Voice call, Text',  patientsContacted: '1,120', recallConversionRate: '71%', avgTouchesToBook: '2.2', staffHoursSaved: '94h', revenueRecovered: '$44K', locations: '358' },
    { region: 'East region',  status: 'Active', channels: 'Text, Email',       patientsContacted: '890',   recallConversionRate: '69%', avgTouchesToBook: '2.4', staffHoursSaved: '74h', revenueRecovered: '$32K', locations: '212' },
    { region: 'South region', status: 'Inactive',  channels: 'Email',             patientsContacted: '820',   recallConversionRate: '66%', avgTouchesToBook: '2.6', staffHoursSaved: '62h', revenueRecovered: '$28K', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Voice call',        patientsContacted: '580',   recallConversionRate: '62%', avgTouchesToBook: '2.8', staffHoursSaved: '44h', revenueRecovered: '$20K', locations: '140' },
  ],
  'Revenue agent': [
    { region: 'North region', status: 'Active', channels: 'Text, Email',       balancesContacted: '590', amountCollected: '$48K', arDaysReduced: '-31%', clickToPayRate: '76%', staffHoursSaved: '62h', locations: '358' },
    { region: 'East region',  status: 'Active', channels: 'Email',             balancesContacted: '440', amountCollected: '$38K', arDaysReduced: '-28%', clickToPayRate: '74%', staffHoursSaved: '46h', locations: '212' },
    { region: 'South region', status: 'Inactive',  channels: 'Text',              balancesContacted: '490', amountCollected: '$34K', arDaysReduced: '-26%', clickToPayRate: '72%', staffHoursSaved: '40h', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Text, Email',       balancesContacted: '300', amountCollected: '$22K', arDaysReduced: '-23%', clickToPayRate: '70%', staffHoursSaved: '28h', locations: '140' },
  ],
  'Treatment plan agent': [
    { region: 'North region', status: 'Active', channels: 'Voice call',        plansFollowedUp: '680', acceptanceRate: '63%', revenueUnlocked: '$288K', callToBookingConversion: '48%', warmTransferRate: '9%', avgTouchesToAccept: '2.0', staffHoursSaved: '88h', locations: '358' },
    { region: 'East region',  status: 'Active', channels: 'Voice call, Text',  plansFollowedUp: '530', acceptanceRate: '61%', revenueUnlocked: '$224K', callToBookingConversion: '44%', warmTransferRate: '11%', avgTouchesToAccept: '2.1', staffHoursSaved: '68h', locations: '212' },
    { region: 'South region', status: 'Inactive',  channels: 'Text, Email',       plansFollowedUp: '490', acceptanceRate: '59%', revenueUnlocked: '$204K', callToBookingConversion: '41%', warmTransferRate: '12%', avgTouchesToAccept: '2.2', staffHoursSaved: '58h', locations: '180' },
    { region: 'West region',  status: 'Draft',   channels: 'Email',             plansFollowedUp: '440', acceptanceRate: '57%', revenueUnlocked: '$176K', callToBookingConversion: '38%', warmTransferRate: '14%', avgTouchesToAccept: '2.4', staffHoursSaved: '48h', locations: '140' },
  ],
  'Tagging & routing agent': [
    { region: 'North region', status: 'Active', channels: 'Voice call, Text, Chat', statusUpdated: '1000', conversationsAssigned: '900', conversationsManaged: '950', timeSaved: '20m', locations: '500' },
    { region: 'East Region',  status: 'Active', channels: 'Text, Chat',             statusUpdated: '1000', conversationsAssigned: '800', conversationsManaged: '900', timeSaved: '15m', locations: '250' },
    { region: 'South Region', status: 'Inactive',  channels: 'Voice call, Text',       statusUpdated: '450',  conversationsAssigned: '400', conversationsManaged: '400', timeSaved: '3m',  locations: '200' },
    { region: 'West Region',  status: 'Draft',   channels: 'Chat',                   statusUpdated: '400',  conversationsAssigned: '350', conversationsManaged: '380', timeSaved: '2m',  locations: '100' },
  ],
  [REVIEW_RESPONSE_AGENT_NAME]: [
    { region: 'North Region', status: 'Active', channels: 'Email', reviewsResponded: '102', responseRate: '15%', avgResponseTime: '20m', timeSaved: '4h 20m', locations: '500', instanceName: 'Review response agent - North Region' },
    { region: 'East Region',  status: 'Active', channels: 'Email', reviewsResponded: '98',  responseRate: '9%',  avgResponseTime: '5m',  timeSaved: '1h 10m', locations: '250', instanceName: 'Review response agent - East Region' },
    { region: 'South Region', status: 'Active', channels: 'Email', reviewsResponded: '53',  responseRate: '9%',  avgResponseTime: '10m', timeSaved: '45m',    locations: '200', instanceName: 'Review response agent - South Region', hasDraft: true },
    { region: 'West Region',  status: 'Inactive', channels: 'Email', reviewsResponded: '35',  responseRate: '8%',  avgResponseTime: '2m',  timeSaved: '3h 20m', locations: '100', instanceName: 'Review response agent - West Region' },
  ],
  [REVIEW_RESPONSE_EXPLORATION_AGENT_NAME]: [
    { region: 'North Region', status: 'Active', channels: 'Email', reviewsResponded: '102', responseRate: '15%', avgResponseTime: '20m', timeSaved: '4h 20m', locations: '500', instanceName: 'Review response agent - North Region' },
    { region: 'East Region',  status: 'Active', channels: 'Email', reviewsResponded: '98',  responseRate: '9%',  avgResponseTime: '5m',  timeSaved: '1h 10m', locations: '250', instanceName: 'Review response agent - East Region' },
    { region: 'South Region', status: 'Active', channels: 'Email', reviewsResponded: '53',  responseRate: '9%',  avgResponseTime: '10m', timeSaved: '45m',    locations: '200', instanceName: 'Review response agent - South Region', hasDraft: true },
    { region: 'West Region',  status: 'Inactive', channels: 'Email', reviewsResponded: '35',  responseRate: '8%',  avgResponseTime: '2m',  timeSaved: '3h 20m', locations: '100', instanceName: 'Review response agent - West Region' },
  ],
  'Review generation agents': [
    {
      region: 'North Region',
      status: 'Active',
      channels: 'Email, Text',
      reviewsReceived: '112',
      contactsReached: '115',
      clickThroughRate: '3.4%',
      timeSaved: '4h 10m',
      locations: '10',
      instanceName: 'Review generation agent - North Region',
    },
    {
      region: 'A/B testing',
      status: 'Active',
      channels: 'Email, Text',
      reviewsReceived: '137',
      contactsReached: '150',
      clickThroughRate: '5.1%',
      timeSaved: '5h 8m',
      locations: '20',
      instanceName: 'Review generation agent with A/B testing, smart targeting and split campaigns 1',
    },
  ],
  // First-time empty — no instances yet; Agents tab shows the create empty state.
  'Review tagging agents': [],
}

const DEFAULT_REGIONS: RegionRow[] = REGIONS_BY_AGENT['Front desk agent']

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

/** Map region labels → sample cities so Location filter matches real row fields. */
const REGION_TO_LOCATION: Record<string, string> = {
  'North region': 'Mountain View',
  'North Region': 'Mountain View',
  'East region': 'Palo Alto',
  'East Region': 'Palo Alto',
  'South region': 'San Jose',
  'South Region': 'San Jose',
  'West region': 'Sunnyvale',
  'West Region': 'Sunnyvale',
}

function matchesChannelFilter(rowChannels: string, picked: string[]) {
  if (!picked.length) return true
  const parts = rowChannels.split(',').map((c) => c.trim().toLowerCase())
  return picked.some((p) => parts.includes(p.toLowerCase()))
}

function matchesStatusFilter(row: AgentInstance, picked: string[]) {
  if (!picked.length) return true
  return picked.some((status) => {
    if (status === 'Draft') return row.status === 'Draft' || !!row.hasDraft
    return row.status === status
  })
}

function parseAgentsUpdatedMs(value?: string) {
  if (!value) return 0
  // Display strings omit the year (e.g. "August 6") — pin a year so sort still works.
  const forParse = /,\s*\d{4}\b/.test(value) || /\b\d{4}\b/.test(value) ? value : `${value}, 2026`
  const t = Date.parse(forParse)
  return Number.isFinite(t) ? t : 0
}

// ── Library template cards for the create-agent empty state ───────────────
const LIBRARY_TEMPLATES = [
  {
    id: 'sms-webchat',
    title: 'SMS and Webchat',
    description:
      'Handles customer conversations using your configured skills, procedures, and tools.',
    glyph: 'sms-webchat' as const,
    tone: 'info' as const,
  },
  {
    id: 'new-patient',
    title: 'New patient intake',
    description: 'Guides new patients through intake, verifies their insurance, and books the right appointment',
    glyph: 'intake' as const,
    tone: 'success' as const,
  },
  {
    id: 'established',
    title: 'Established patient scheduling',
    description: 'Validates existing records, checks coverage, and books or reschedules follow-up visits with preferred providers',
    glyph: 'scheduling' as const,
    tone: 'ai' as const,
  },
  {
    id: 'urgent',
    title: 'Urgent escalations',
    description: 'Detects high-risk symptoms, follows escalation policy, and hands off immediately to clinical staff or emergency guidance',
    glyph: 'routing' as const,
    tone: 'danger' as const,
  },
]

// ── Healthcare-only "Front desk agents" create screen: library cards ───────
type CreateLibraryCard = {
  id: string
  title: string
  description: string
  glyph?: LibraryCardGlyph
  tone?: LibraryCardTone
  /** Preview modal Outcome — falls back to a generic coverage blurb when omitted. */
  outcome?: string
  steps?: AgentLibraryPreviewStep[]
}

function workflowAgentNameForLibraryCard(card: CreateLibraryCard, currentAgent?: string): string {
  const haystack = `${card.id} ${card.title} ${currentAgent ?? ''}`.toLowerCase()
  if (haystack.includes('reminder') || haystack.includes('no-show') || haystack.includes('confirmation')) {
    return 'Reminder agent'
  }
  if (haystack.includes('generation')) return 'Review generation agent'
  if (haystack.includes('review')) return 'Review response agent'
  if (haystack.includes('waitlist')) return 'Waitlist agent'
  if (haystack.includes('outreach')) return 'Outreach agent'
  if (haystack.includes('tagging')) return 'Tagging & routing agent'
  if (haystack.includes('pre-visit') && !haystack.includes('preparation')) return 'Pre-visit agent'
  if (currentAgent?.startsWith('Reminder')) return 'Reminder agent'
  return 'Front desk agent'
}

function toLibraryPreviewData(
  card: CreateLibraryCard,
  opts?: { product?: string; agentName?: string },
): AgentLibraryPreviewData {
  return {
    id: card.id,
    name: card.title,
    goal: card.description,
    outcome:
      card.outcome ??
      'Increase coverage by automating more of this workflow across locations. Free your team to focus on exceptions while the agent handles the routine work.',
    locationsLabel: 'All locations',
    product: opts?.product,
    workflowAgentName: workflowAgentNameForLibraryCard(card, opts?.agentName),
    steps: card.steps ?? [
      {
        kind: 'trigger',
        title: '1. Workflow starts',
        description: 'Agent triggers when the configured event occurs across all sources and locations.',
      },
      {
        kind: 'task',
        title: '2. Complete the agent goal',
        description: card.description,
      },
    ],
  }
}

const HEALTHCARE_FRONTDESK_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'sms-webchat',
    title: 'SMS and Webchat',
    description:
      'Handles customer conversations using your configured skills, procedures, and tools.',
    glyph: 'sms-webchat',
    tone: 'info',
  },
  {
    id: 'new-patient',
    title: 'New patient intake',
    description: 'Guides new patients through intake, verifies their insurance, and books the right appointment',
    glyph: 'intake',
    tone: 'success',
  },
  {
    id: 'patient-scheduling',
    title: 'Patient scheduling',
    description: 'Finds returning patient records, confirms coverage, and books or reschedules visits',
    glyph: 'scheduling',
    tone: 'ai',
  },
]

const REMINDER_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'appointment-confirmation-reminder',
    title: 'Appointment confirmation reminder',
    description:
      'Sends a multi-step reminder sequence at 72h, 24h, and 2h before the appointment. Adapts tone and channel based on patient history and no-show risk.',
    glyph: 'reminder',
    tone: 'info',
  },
  {
    id: 'no-show-risk-intervention',
    title: 'No-show risk intervention agent',
    description:
      'Identifies patients flagged as high-risk by the AI scoring model and triggers a personalized outreach campaign — including a live AI call for patients with 3+ prior no-shows. Escalates to staff when needed.',
    glyph: 'noshow',
    tone: 'danger',
  },
  {
    id: 'pre-visit-preparation-reminder',
    title: 'Pre-visit preparation reminder',
    description:
      'Reminds patients of pre-visit requirements — fasting, medication holds, forms, and insurance documents. Checks completion status via patient portal and sends a targeted follow-up only for outstanding items.',
    glyph: 'prep',
    tone: 'success',
  },
  {
    id: 'chronic-care-medication-reminder',
    title: 'Chronic care & medication reminder',
    description:
      "Sends recurring reminders for chronic condition follow-ups, lab reorders, and prescription refills. Detects gaps in care by querying the patient's care plan and nudges patients who have fallen out of schedule.",
    glyph: 'medication',
    tone: 'warning',
  },
]

const WAITLIST_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'waitlist-agent',
    title: 'Waitlist agent',
    description:
      'Manages waitlist requests by reviewing availability, offering open slots, and confirming appointments with patients.',
    glyph: 'scheduling',
    tone: 'info',
    outcome:
      'Fill more cancelled and open slots automatically. Reach waitlisted patients faster so your schedule stays fuller with less staff outreach.',
    steps: [
      {
        kind: 'trigger',
        title: '1. Open or cancelled slot is available',
        description: 'Agent triggers when a cancelled or newly opened appointment slot needs to be filled.',
      },
      {
        kind: 'task',
        title: '2. Outreach and confirm',
        description: 'Contacts waitlisted patients, offers the open slot, and confirms the booking.',
      },
    ],
  },
]

const PREVISIT_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'previsit-checkin-outreach',
    title: 'Pre-visit agent',
    description: 'The Pre-Visit Agent automates pre-appointment check-in form outreach.',
    glyph: 'prep',
    tone: 'success',
    outcome:
      'Increase intake completion before visits. Patients arrive prepared so your front desk spends less time chasing forms.',
    steps: [
      {
        kind: 'trigger',
        title: '1. Upcoming appointment needs intake',
        description: 'Agent triggers ahead of the visit when intake or check-in forms are still outstanding.',
      },
      {
        kind: 'task',
        title: '2. Send outreach and follow up',
        description: 'Sends check-in form reminders and follows up until the intake is completed.',
      },
    ],
  },
]

const REVIEW_RESPONSE_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'reviews-response-templates',
    title: 'Review response agent replying using templates',
    description: 'Uses pre-defined templates and responds to reviews automatically',
    glyph: 'templates',
    tone: 'info',
    outcome:
      'Respond to more reviews consistently with on-brand templates. Reduce drafting time while keeping reply quality steady across locations.',
    steps: [
      {
        kind: 'trigger',
        title: '1. New review is received or updated',
        description:
          'Agent triggers when there is a new review or an existing review is updated across all sources and locations',
      },
      {
        kind: 'task',
        title: '2. Match and post a template reply',
        description: 'Selects the best matching template by rating and topic, then posts the reply automatically.',
      },
    ],
  },
  {
    id: 'reviews-response-autonomous',
    title: 'Review response agent replying autonomously',
    description:
      'Uses AI to analyze review sentiment, generates and posts unique, context-aware replies automatically',
    glyph: 'autonomous',
    tone: 'danger',
    outcome:
      'Increase review coverage by responding to more reviews across platforms effortlessly. Boost response rates with faster, personalized replies that build trust and satisfaction.',
    steps: [
      {
        kind: 'trigger',
        title: '1. New review is received or updated',
        description:
          'Agent triggers when there is a new review or an existing review is updated across all sources and locations',
      },
      {
        kind: 'task',
        title: '2. Analyze sentiment and draft reply',
        description:
          'Uses AI to understand the review, generate a unique context-aware reply, and apply brand tone guidelines.',
      },
      {
        kind: 'task',
        title: '3. Post reply automatically',
        description: 'Publishes the reply to the original review source without waiting for human approval.',
      },
    ],
  },
  {
    id: 'reviews-response-human-approval',
    title: 'Review response agent replying after human approval',
    description:
      'Uses AI to analyze review sentiment, generates and sends unique, context-aware replies for a human approval before posting',
    glyph: 'approval',
    tone: 'success',
    outcome:
      'Keep humans in the loop for sensitive replies while still drafting faster. Improve consistency without losing final approval control.',
    steps: [
      {
        kind: 'trigger',
        title: '1. New review is received or updated',
        description:
          'Agent triggers when there is a new review or an existing review is updated across all sources and locations',
      },
      {
        kind: 'task',
        title: '2. Draft reply for approval',
        description: 'Generates a unique reply and routes it to the dashboard for a teammate to approve or edit.',
      },
      {
        kind: 'task',
        title: '3. Post after approval',
        description: 'Publishes the reply once a human approves the draft.',
      },
    ],
  },
  {
    id: 'reviews-response-dashboard-suggestions',
    title: 'Review response agent suggesting replies in dashboard',
    description:
      'Uses AI to analyze review sentiment, generates and shows unique, context-aware replies in the dashboard for one-click manual posting',
    glyph: 'dashboard',
    tone: 'ai',
    outcome:
      'Give your team ready-to-post drafts in the dashboard. Speed up manual responses while keeping full control of when replies go live.',
    steps: [
      {
        kind: 'trigger',
        title: '1. New review is received or updated',
        description:
          'Agent triggers when there is a new review or an existing review is updated across all sources and locations',
      },
      {
        kind: 'task',
        title: '2. Suggest reply in dashboard',
        description: 'Surfaces a unique draft reply next to the review so a teammate can post with one click.',
      },
    ],
  },
]

/** Rotating landing-composer placeholders for the review response create flow. */
const REVIEW_RESPONSE_PLACEHOLDERS = [
  'Reply to new reviews using templates…',
  'Create a review response agent that drafts and posts unique, context-aware replies automatically…',
  'Hold replies for human approval…',
  'Build an agent that suggests reply drafts in the dashboard for one-click posting…',
  'Flag spam and alert the team…',
] as const

const FRONTDESK_PLACEHOLDERS = [
  'Route urgent calls to the right team…',
  'Create a front desk agent that handles intake, verifies insurance, and books the right visit…',
  'Schedule or reschedule returning patients…',
  'Build an agent that triages symptoms and transfers with full call context…',
  'Answer after-hours questions…',
] as const

const REMINDER_PLACEHOLDERS = [
  'Send appointment reminders at 72h, 24h, and 2h…',
  'Create a reminder agent that intervenes on high no-show risk patients with a live AI call…',
  'Remind patients about forms and prep…',
  'Build an agent that nudges overdue medication refills and chronic care follow-ups…',
  'Confirm visits over text and email…',
] as const

const DEFAULT_CREATE_PLACEHOLDER = 'Describe the agent you want to build…'

const REVIEW_GENERATION_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'reviews-generation-standard',
    title: 'Review generation agent',
    description: 'Sends review requests to customers after transactions complete across email and text.',
    glyph: 'generation',
    tone: 'info',
  },
  {
    id: 'reviews-generation-ab',
    title: 'Review generation agent with A/B testing',
    description: 'Runs split campaigns with smart targeting to maximize review request click-through and conversion.',
    glyph: 'generation-ab',
    tone: 'ai',
  },
]

const REVIEW_GENERATION_CREATE_PROMPT =
  'Create a review generation agent that sends review request emails and texts after a customer completes a transaction, so we get more reviews across locations.'

const REVIEW_TAGGING_CREATE_CARDS: CreateLibraryCard[] = [
  {
    id: 'review-tagging-evaluation',
    title: 'Review tagging - Review evaluation',
    description:
      'Analyzes review comments to identify topics mentioned in it. Uses the identified topics to tag reviews.',
    glyph: 'tagging',
    tone: 'success',
    outcome:
      'Tag more reviews consistently by topic so teams can find and act on themes faster across locations.',
    steps: [
      {
        kind: 'trigger',
        title: '1. New review is received or updated',
        description:
          'Agent triggers when there is a new review or an existing review is updated across all sources and locations.',
      },
      {
        kind: 'task',
        title: '2. Identify topics and apply tags',
        description:
          'Analyzes review comments for mentioned topics, then applies matching tags to the review.',
      },
    ],
  },
  {
    id: 'review-tagging-high-risk',
    title: 'High risk review tagging agent',
    description:
      'Analyzes review comments to identify extreme negative sentiments and critical issue topics mentioned to match them with tags existing in the account',
    glyph: 'tagging-risk',
    tone: 'danger',
    outcome:
      'Surface high-risk reviews quickly so teams can prioritize responses and escalate critical issues.',
    steps: [
      {
        kind: 'trigger',
        title: '1. New review is received or updated',
        description:
          'Agent triggers when there is a new review or an existing review is updated across all sources and locations.',
      },
      {
        kind: 'task',
        title: '2. Detect high-risk sentiment and tag',
        description:
          'Flags extreme negative sentiment and critical topics, then matches them to existing account tags.',
      },
    ],
  },
]

// ── Per-agent library cards ──────────────────────────────────────────────────
const DENTAL_AGENT_LIBRARY: Record<string, { id: string; title: string; description: string }[]> = {
  'Front desk agent': [
    {
      id: 'sms-webchat',
      title: 'SMS and Webchat',
      description:
        'Handles customer conversations using your configured skills, procedures, and tools.',
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
  ],
  'Reminder agent': [
    {
      id: 'appointment-confirmation-reminder',
      title: 'Appointment confirmation reminder',
      description:
        'Sends a multi-step reminder sequence at 72h, 24h, and 2h before the appointment. Adapts tone and channel based on patient history and no-show risk.',
    },
    {
      id: 'no-show-risk-intervention',
      title: 'No-show risk intervention agent',
      description:
        'Identifies patients flagged as high-risk by the AI scoring model and triggers a personalized outreach campaign – including a live AI call for patients with 3+ prior no-shows. Escalates to staff when needed.',
    },
    {
      id: 'pre-visit-preparation-reminder',
      title: 'Pre-visit preparation reminder',
      description:
        'Reminds patients of pre-visit requirements — fasting, medication holds, forms, and insurance documents. Checks completion status via patient portal and sends a targeted follow-up only for outstanding items.',
    },
    {
      id: 'chronic-care-medication-reminder',
      title: 'Chronic care & medication reminder',
      description:
        "Sends recurring reminders for chronic condition follow-ups, lab reorders, and prescription refills. Detects gaps in care by querying the patient's care plan and nudges patients who have fallen out of schedule.",
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
  [REVIEW_RESPONSE_AGENT_NAME]: [
    {
      id: 'reviews-response-templates',
      title: 'Review response agent replying using templates',
      description: 'Uses pre-defined templates and responds to reviews automatically',
    },
    {
      id: 'reviews-response-autonomous',
      title: 'Review response agent replying autonomously',
      description: 'Uses AI to analyze sentiment and post unique, context-aware replies automatically',
    },
    {
      id: 'reviews-response-human-approval',
      title: 'Review response agent replying after human approval',
      description: 'Uses AI to analyze sentiment, generate unique replies for human approval before posting',
    },
    {
      id: 'reviews-response-dashboard-suggestions',
      title: 'Review response agent suggesting replies in dashboard',
      description: 'Uses AI to analyze review sentiment and shows unique, context-aware replies in the dashboard for one-click posting',
    },
  ],
  [REVIEW_RESPONSE_EXPLORATION_AGENT_NAME]: [
    {
      id: 'reviews-response-templates',
      title: 'Review response agent replying using templates',
      description: 'Uses pre-defined templates and responds to reviews automatically',
    },
    {
      id: 'reviews-response-autonomous',
      title: 'Review response agent replying autonomously',
      description: 'Uses AI to analyze sentiment and post unique, context-aware replies automatically',
    },
    {
      id: 'reviews-response-human-approval',
      title: 'Review response agent replying after human approval',
      description: 'Uses AI to analyze sentiment, generate unique replies for human approval before posting',
    },
    {
      id: 'reviews-response-dashboard-suggestions',
      title: 'Review response agent suggesting replies in dashboard',
      description: 'Uses AI to analyze review sentiment and shows unique, context-aware replies in the dashboard for one-click posting',
    },
  ],
  'Review generation agents': REVIEW_GENERATION_CREATE_CARDS,
  'Review tagging agents': REVIEW_TAGGING_CREATE_CARDS,
}

/**
 * Create-flow library grid:
 * - ≤4 cards → one centered row (container shrinks to N cards)
 * - >4 cards → max 4 per row, left-aligned wrap (same as Review response Library)
 */
function createLibraryGridClasses(cardCount: number): { shell: string; grid: string } {
  if (cardCount > 4) {
    return {
      shell: 'max-w-[1280px]',
      grid: 'grid-cols-1 min-[500px]:grid-cols-2 min-[900px]:grid-cols-4',
    }
  }
  if (cardCount === 4) {
    return {
      shell: 'max-w-[1280px]',
      grid: 'grid-cols-1 min-[500px]:grid-cols-4',
    }
  }
  if (cardCount === 3) {
    return {
      shell: 'max-w-[1000px]',
      grid: 'grid-cols-1 min-[500px]:grid-cols-3',
    }
  }
  if (cardCount === 2) {
    return {
      shell: 'max-w-[720px]',
      grid: 'grid-cols-1 min-[500px]:grid-cols-2',
    }
  }
  return {
    shell: 'max-w-[360px]',
    grid: 'max-w-[325px] grid-cols-1',
  }
}

// ── Illustration for the create-agent empty state (library-only landing) ───
function CreateAgentEmptyState({
  cards,
  onCreateFromScratch,
  onSelectFromLibrary,
  onPreview,
  fromScratchLabel = 'Create from scratch',
  /** `build` = screenshot-style "Build your agent" + collapsible library (1st-time UX). */
  layout = 'compact',
  libraryDefaultOpen = true,
}: {
  cards: CreateLibraryCard[]
  onCreateFromScratch: () => void
  onSelectFromLibrary: (templateId: string) => void
  onPreview?: (card: CreateLibraryCard) => void
  fromScratchLabel?: string
  layout?: 'compact' | 'build'
  libraryDefaultOpen?: boolean
}) {
  const [libraryOpen, setLibraryOpen] = useState(libraryDefaultOpen)
  const cardCount = cards.length
  const { shell: libraryShellClass, grid: libraryGridClass } = createLibraryGridClasses(cardCount)
  const showLibrary = layout === 'compact' || libraryOpen
  return (
    <div
      className={`flex w-full flex-col items-center gap-2xl self-center py-lg ${libraryShellClass}`}
    >
      <img
        src={agentEmptyState}
        alt=""
        width={282}
        height={194}
        className="h-[194px] w-[282px] shrink-0 select-none"
        draggable={false}
      />

      {layout === 'build' ? (
        <div className="flex flex-col items-center gap-sm text-center">
          <p className="m-0 flex items-center justify-center gap-xs text-body text-text-primary">
            <span
              className="ai-gradient-icon size-4 shrink-0"
              style={{
                WebkitMaskImage: `url("${iconAgentsPurple}")`,
                maskImage: `url("${iconAgentsPurple}")`,
              }}
              aria-hidden
            />
            <span>
              Build your agent.{' '}
              <button
                type="button"
                onClick={onCreateFromScratch}
                className="text-body text-text-action hover:underline"
              >
                {fromScratchLabel}
              </button>
            </span>
          </p>
          <p className="m-0 text-body text-text-primary">or</p>
          <button
            type="button"
            onClick={() => setLibraryOpen((open) => !open)}
            className="flex items-center gap-xs text-body text-text-primary"
            aria-expanded={libraryOpen}
          >
            Select from library
          </button>
        </div>
      ) : (
        <p className="m-0 text-center text-body text-text-secondary">
          <button
            type="button"
            onClick={onCreateFromScratch}
            className="text-body text-text-action hover:underline"
          >
            {fromScratchLabel}
          </button>
          <span className="text-text-primary">{' or select from '}</span>
          <button type="button" className="text-body text-text-primary hover:underline">
            library
          </button>
        </p>
      )}

      {showLibrary && (
        <div className={`@container w-full ${cardCount === 1 ? 'flex justify-center' : ''}`}>
          <div className={`grid w-full gap-md ${libraryGridClass}`}>
            {cards.map((tpl) => (
              <InfoCard
                key={tpl.id}
                title={tpl.title}
                description={tpl.description}
                glyph={tpl.glyph}
                tone={tpl.tone}
                actionLabel="Use agent"
                onAction={() => onSelectFromLibrary(tpl.id)}
                onPreview={onPreview ? () => onPreview(tpl) : undefined}
              />
            ))}
          </div>
        </div>
      )}
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


// Bouncing-dots "thinking" indicator — matches the Recommendation detail chat's TypingDots.
function TypingDots() {
  return (
    <div className="flex items-center gap-[5px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-[7px] rounded-full bg-[#6b9fd4]"
          style={{ animation: 'sim-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

function AgentBuildLoaderRow() {
  return (
    <div className="agent-build-fade mt-lg flex items-center gap-md">
      <AiAvatarChatIcon size={24} className="shrink-0" />
      <TypingDots />
    </div>
  )
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[36px] flex justify-end">
      <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary">{children}</span>
    </div>
  )
}

// ChatGPT-style action row shown under every agent response: like / dislike / copy.
function MessageActions({ copyText, className }: { copyText?: string; className?: string }) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (copyText) void navigator.clipboard?.writeText(copyText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const btn =
    'flex size-6 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary'

  return (
    <div className={`msg-actions-row mt-xs flex items-center gap-xs opacity-0 transition-opacity ${className ?? ''}`}>
      <Tooltip content="Good response" variant="brief">
        <button
          type="button"
          aria-label="Good response"
          aria-pressed={feedback === 'up'}
          onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
          className={`${btn} ${feedback === 'up' ? 'bg-surface-hover text-text-secondary' : ''}`}
        >
          <Icon name="thumb_up" size={15} fill={feedback === 'up'} />
        </button>
      </Tooltip>
      <Tooltip content="Bad response" variant="brief">
        <button
          type="button"
          aria-label="Bad response"
          aria-pressed={feedback === 'down'}
          onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
          className={`${btn} ${feedback === 'down' ? 'bg-surface-hover text-text-secondary' : ''}`}
        >
          <Icon name="thumb_down" size={15} fill={feedback === 'down'} />
        </button>
      </Tooltip>
      <Tooltip content={copied ? 'Copied' : 'Copy'} variant="brief">
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy'}
          onClick={handleCopy}
          className={btn}
        >
          <Icon name={copied ? 'check' : 'copy_all'} size={15} />
        </button>
      </Tooltip>
    </div>
  )
}

// Seeded create-agent prompt from the Front desk demo script (John).
const JOHN_CREATE_PROMPT =
  "I want a front desk agent for our clinic. It should answer inbound calls, book and reschedule appointments, answer basic insurance questions, and hand off anything about billing disputes to a human. I've got a bunch of our real call recordings if that helps."

const REMINDER_CREATE_PROMPT =
  "Every time an appointment gets booked, I want patients to automatically get reminded — email and text. Start about a month out, then again a week before. If they still haven't confirmed two days before the appointment, have the agent actually call them. If they don't pick up, send a text. And nobody should get calls at weird hours"

const REVIEW_RESPONSE_CREATE_PROMPT =
  'Create a review response agent that monitors new reviews, analyzes sentiment, and posts thoughtful replies automatically — escalating negative reviews for human approval before publishing.'

export {
  REVIEW_RESPONSE_CREATE_CARDS,
  REVIEW_GENERATION_CREATE_CARDS,
  REVIEW_RESPONSE_CREATE_PROMPT,
  REVIEW_GENERATION_CREATE_PROMPT,
}

export function getCreateWithAiSetup(agentName: string): {
  variant: 'frontdesk' | 'reminder' | 'review-response' | 'review-generation'
  pageTitle: string
  initialPrompt?: string
  libraryCards?: CreateLibraryCard[]
  fromScratchLabel: string
} {
  const name = agentName || ''
  if (/review response/i.test(name)) {
    return {
      variant: 'review-response',
      pageTitle: 'New review response agent',
      initialPrompt: REVIEW_RESPONSE_CREATE_PROMPT,
      libraryCards: REVIEW_RESPONSE_CREATE_CARDS,
      fromScratchLabel: 'Create from scratch',
    }
  }
  if (/review generation/i.test(name)) {
    return {
      variant: 'review-generation',
      pageTitle: 'New review generation agent',
      initialPrompt: REVIEW_GENERATION_CREATE_PROMPT,
      libraryCards: REVIEW_GENERATION_CREATE_CARDS,
      fromScratchLabel: 'Create from scratch',
    }
  }
  if (/reminder/i.test(name)) {
    return {
      variant: 'reminder',
      pageTitle: 'New reminder agent',
      initialPrompt: REMINDER_CREATE_PROMPT,
      fromScratchLabel: 'Create from scratch',
    }
  }
  return {
    variant: 'frontdesk',
    pageTitle: 'New front desk agent',
    initialPrompt: JOHN_CREATE_PROMPT,
    fromScratchLabel: 'Setup manually',
  }
}

const REVIEW_RESPONSE_CREATE_THOUGHTS_TEXT = `Inbound review-response agent — not outbound outreach. The product is: new review lands → triage → analyze → draft → publish (or hold).

What I heard:
• Monitor new reviews continuously
• Analyze sentiment
• Write thoughtful, on-brand replies
• Auto-post by default, escalate negatives for human approval

Volume context to surface: ~120 new reviews/week, ~2,400 still unanswered — backlog is the urgency.

Open questions before I draft the workflow:
• Sources — Google / Facebook / Yelp / all
• Location scope
• Spam handling (don't waste replies on non-customers)
• Negative-reply policy (staff mentions, offline invite)
• Writing rules (language, length, SEO)
• Final publish mode — reconcile "escalate negatives" with how aggressive auto-post should be`

const REVIEW_RESPONSE_INTRO_PARAGRAPHS = [
  "You're getting about 120 new reviews a week and 2,400 are still unanswered. I'll build an agent that triages every review, writes an on-brand reply, and publishes it — let me get a few details right.",
  'First: which review sources should it watch — Google, Facebook, Yelp, or all of them?',
]

const REVIEW_RESPONSE_AFTER_SOURCES_THOUGHTS = `Sources: all of them. Trigger becomes every new or updated review across the full source set — no per-site filters to maintain.

Next: location scope. They have 4 locations. Covering all from day one means one policy everywhere; a smaller pilot would be quieter for the first week.`

const REVIEW_RESPONSE_SOURCES_REPLY = [
  "Done — it'll trigger on every new or updated review across all sources.",
  'And which locations should it cover: all 4, or just a few to start?',
]

const REVIEW_RESPONSE_AFTER_LOCATIONS_THOUGHTS = `Locations: all 4. Same reply policy at every location.

Before drafting replies, spam is the gate. ~7% of inbound isn't a real customer — if we reply to those we burn trust and waste quota. I'll propose a triage branch that peels spam off before any drafting.`

const REVIEW_RESPONSE_LOCATIONS_REPLY = [
  'Scoped to all 4 locations.',
  "Now, spam — about 7% of what comes in isn't a real customer, so I'll add a triage step up front so we never reply to those.",
]

const REVIEW_RESPONSE_AFTER_SPAM_OK_THOUGHTS = `Spam triage accepted as a hard gate before reply generation.

Open question: silent drop vs notify. Email alerts let the team flag spam on the review site without clogging the reply queue.`

const REVIEW_RESPONSE_SPAM_ALERT_REPLY = [
  'Do you want to receive alerts for these spam reviews in your email?',
]

const REVIEW_RESPONSE_AFTER_SPAM_ALERT_THOUGHTS = `Spam alerts: email preferred. Need the destination — account default (john@birdeye.com) vs a shared ops inbox.`

const REVIEW_RESPONSE_SPAM_EMAIL_REPLY = [
  'Which address should they go to — your account email (john@birdeye.com), or a different one?',
]

const REVIEW_RESPONSE_AFTER_SPAM_EMAIL_THOUGHTS = `Spam path locked: branch off → email alert to account address → no reply drafted.

Onto genuine reviews. Negatives are the high-risk path — 41% name a staff member. Recommendation: never name staff in a negative reply; acknowledge and take the conversation offline. Confirm: invite unhappy customers to call, email, or both?`

const REVIEW_RESPONSE_OFFLINE_REPLY = [
  'Set. Spam reviews now branch off and email you an alert so your team can flag them on the review site.',
  'Now the genuine ones — negative reviews especially. 41% of your negative reviews name a staff member. My recommendation: never name staff in a negative reply — acknowledge it and take the conversation offline. Should unhappy customers be invited to call or email the business?',
]

const REVIEW_RESPONSE_AFTER_OFFLINE_THOUGHTS = `Offline invite: phone + email. Good for de-escalation.

Also baking in CRITICAL severity (legal threats / safety) → recommend an immediate call; those shouldn't ride the normal auto-reply path.

Writing style defaults to propose next:
1. Reply in the review's language
2. Keep under 60 words
3. Add one SEO keyword to positive replies only`

const REVIEW_RESPONSE_WRITING_REPLY = [
  "Good. I'll also flag severe cases — legal threats or safety issues — as CRITICAL and recommend an immediate call.",
  'For writing style, I suggest three rules: reply in the review\'s language, keep it under 60 words, and add one SEO keyword to positive replies only. Keep all three?',
]

const REVIEW_RESPONSE_AFTER_WRITING_THOUGHTS = `Writing rules locked: language match, ≤60 words, SEO keyword on positives only.

Final fork — and it may soften the original "escalate negatives for approval" ask: publish automatically vs wait in the dashboard. Auto-post clears the 2,400 backlog faster; approval is safer. If they choose auto, I'll still recommend a short hold window as a safety net.`

const REVIEW_RESPONSE_PUBLISH_REPLY = [
  "Last decision, and it's the big one: should replies post automatically, or wait in the dashboard for your approval?",
]

const REVIEW_RESPONSE_AFTER_PUBLISH_THOUGHTS = `Publish mode: automatic. Keeping a 15-minute hold so the team can catch anything before it goes live — safety net without a full approval queue.

I have enough to build: all sources × 4 locations → spam triage + email alert → analyze (sentiment, topics, severity, staff mentions) → draft under the writing rules → publish with 15-min hold. CRITICAL cases stay flagged for an immediate call.`

const REVIEW_RESPONSE_HOLD_REPLY = [
  "Smart to keep a safety net — I'll post directly with a 15-minute hold so your team can catch anything first. That's everything I need.",
  "Perfect — here's exactly what I will build, step by step:",
  'STEP: Step 1: Trigger — the agent runs whenever a new review is created or an existing review is updated, across all enabled sources and all 4 locations.',
  'STEP: Step 2: Triage task — it first checks whether the review is genuine customer feedback or spam/policy-violating content.',
  'STEP: Step 3: Branching decision',
  '   • If spam/invalid: it does not generate a public reply. It sends your team an email alert with source, reviewer, and reason so someone can take action on the review site.',
  '   • If genuine: it continues to response generation.',
  'STEP: Step 4: Insight extraction task — for genuine reviews, it extracts sentiment, key topics, severity level, and any staff mentions to guide tone and handling.',
  "STEP: Step 5: Response generation task — it drafts an on-brand reply in the same language as the review, keeps it concise (under 60 words), and follows your safety rules.",
  'STEP: Step 6: Guardrails — for sensitive negative cases, it avoids naming staff directly, and CRITICAL risk signals (legal/safety) are flagged for immediate follow-up.',
  'STEP: Step 7: Send response task — it posts automatically with a 15-minute hold window, giving your team a short safety net before the reply goes fully live.',
  'If this flow looks right, type build and I will generate this exact draft on the canvas.',
]

const REVIEW_RESPONSE_AFTER_BUILD_THOUGHTS = `Assembling the workflow from the decisions above. No open questions left — draft the agent and summarize what's on the canvas.`

const REVIEW_RESPONSE_SUMMARY_PARAGRAPHS = [
  'Your review response agent is ready:',
  '• Triggers on every new review across all sources, all 4 locations',
  '• Triages spam → emails you an alert',
  '• Analyzes genuine reviews (sentiment, topics, severity, staff mentions)',
  '• Writes an on-brand reply in the review\'s language, under 60 words',
  '• Publishes directly with a 15-minute hold',
  'Review it on the canvas, then hit Publish when you\'re happy.',
]

const REVIEW_RESPONSE_BUILD_CARD = {
  title: 'New review response agent',
  description:
    'Monitors new reviews across all sources, triages spam, drafts on-brand replies, and publishes with a 15-minute hold.',
}

const REVIEW_RESPONSE_POST_DRAFT_REPLY =
  'Now that I have created the new review response agent, what would you like me to do?'

const REVIEW_RESPONSE_POST_DRAFT_PILLS = ['Make changes', 'Save agent', 'View in agent builder'] as const

const REVIEW_RESPONSE_DESIGN_STEPS = [
  { id: 'trigger', label: 'Wiring review triggers across sources' },
  { id: 'spam', label: 'Adding spam triage and email alerts' },
  { id: 'analyze', label: 'Configuring sentiment and severity analysis' },
  { id: 'reply', label: 'Setting reply style and publish hold' },
  { id: 'final', label: 'Final checks' },
] as const

// Reminder ghostwriter: reasoning shown after the first send.
const REMINDER_CREATE_THOUGHTS_TEXT = `This is an event-triggered, time-paced, multi-channel outbound reminder agent — not a conversational front-desk agent. The workflow is the product: appointment booked → paced reminders → confirmation check → escalate to a call if needed.

Journey I heard:
• Trigger: Appointment booked
• ~4 weeks before: Email + text reminder
• ~1 week before: Email + text reminder
• At 2 days before: Check if confirmed
• If not confirmed: Place a voice call
• If call not picked up: Fall back to text
• Quiet hours: Applied as a default

The deep part is the call. I need clear paths for answered / rejected / missed / voicemail, and a defined no-answer fallback (they already said: send a text).

Edge cases worth flagging: appointments booked less than ~5 days out (skip early touches), stop conditions on confirm / cancel / reschedule, and retry policy if the call fails.

Priority questions before I draft:
• Cadence — confirm 4 weeks / 1 week / 2 days
• Call behavior — outcomes and quiet hours
• No-answer handling — text fallback (already stated)`

const REMINDER_CREATE_INTRO_PARAGRAPHS = [
  "Got it — an agent that runs a reminder journey for every booked appointment. Here's the timeline I heard:",
  'Appointment booked → email and text reminder (4 weeks before) → email and text reminder (1 week before) → wait until 2 days before → Has the patient confirmed? → Yes — done, leave them alone → No — call the patient → if no answer → follow-up text.',
  'Did I get the timing right? You said "about a month" — I set 4 weeks, happy to adjust.',
]

// Pre-filled into the composer when the user clicks after the reminder timing question.
const REMINDER_TIMING_REPLY = 'Make the first one 3 weeks, not a month. Rest is right.'

const REMINDER_AFTER_TIMING_THOUGHTS_TEXT = `Cadence resolved: 3 weeks → 1 week → check at 2 days.

Appointments booked less than 3 weeks out should skip straight to the applicable step — nobody gets a stale reminder or none at all.

I'll propose a Reminder call starting procedure next. Open question: when a patient wants to reschedule mid-call — hand off to Front desk (Lakeside already has one live), offer new times inline, or take a message for staff to call back.`

const REMINDER_CADENCE_REPLY_PARAGRAPHS = [
  "Updated — 3 weeks, then 1 week, then the 2-day check. One thing I'll handle automatically: if an appointment is booked less than 3 weeks out, the agent skips ahead to whichever step still applies — nobody gets a stale reminder or none at all. Now, the call — this is the part worth getting right. When a patient answers, this stops being a notification and becomes a live conversation. Here's the starting procedure I plan to give the call:",
]

const REMINDER_CALL_PROCEDURE_NAME = 'Reminder call'
const REMINDER_CALL_PROCEDURE_LABEL = 'Reminder call'
const REMINDER_CALL_PROCEDURE_NOTE =
  'Verifies identity, delivers the reminder, and handles confirm, reschedule, or cancel.'

const REMINDER_CALL_PROCEDURE: Procedure = {
  id: 'hc-reminder-call',
  name: REMINDER_CALL_PROCEDURE_NAME,
  category: 'Healthcare Frontdesk',
  queue: 'Inbound',
  channels: ['Voice'],
  description: 'Outbound reminder call that confirms the upcoming appointment and handles reschedule, cancel, or handoff.',
  lastEdited: 'Jul 30',
  whenToUse: 'When the agent places a reminder call for an upcoming appointment.',
  steps: [
    {
      title: 'Greet the patient by name, identify as Lakeside Medical Group calling about their upcoming appointment.',
      bullets: [],
    },
    {
      title: 'State the appointment (day, time, provider) and ask if they can make it.',
      bullets: [],
    },
    {
      title: 'Confirms → mark it confirmed, thank them, end the call.',
      bullets: [],
    },
    {
      title: "Can't make it / wants to cancel → offer to cancel or reschedule.",
      bullets: [],
    },
    {
      title: 'Asks anything else or asks for a human → hand off.',
      bullets: [],
    },
  ],
  tools: [],
  context: [
    { kind: 'context', label: 'Provider_first_name' },
    { kind: 'context', label: 'Business_ID' },
    { kind: 'file', label: 'Products_list.PDF' },
    { kind: 'link', label: 'www.aspendental.com' },
  ],
}

/** Shape expected by AgentBuilder's procedureDetail RHS panel. */
function procedureToRhsDetail(procedure: Procedure, moreContextCount = 0) {
  const kindMap = { context: 'variable', file: 'attachment', link: 'link', tool: 'variable', subagent: 'variable', procedure: 'variable' } as const
  return {
    id: procedure.name,
    name: procedure.name,
    whenToUse: procedure.whenToUse,
    whenToExit: '',
    contextChips: procedure.context.map((c) => ({
      value: c.label,
      type: kindMap[c.kind] ?? 'variable',
    })),
    moreContextCount,
    stepsText: procedure.steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n'),
    addToLibrary: false,
  }
}

const REMINDER_CALL_RHS_DETAIL = procedureToRhsDetail(REMINDER_CALL_PROCEDURE, 25)

const REMINDER_RESCHEDULE_QUESTION_PARAGRAPHS = [
  'The question: when a patient wants to reschedule mid-call, what should happen?',
  '• Hand the call to your Front desk agent',
  '• This agent offers new times itself',
  '• Take a message for your staff to call back',
]

const REMINDER_RESCHEDULE_PILLS = [
  'Hand off the call to front desk agent',
  'Send a message to your staff to call back',
] as const

const REMINDER_AFTER_HANDOFF_THOUGHTS_TEXT = `Rescheduling → handoff to the Front desk agent.

Three arms left. Proposing defaults rather than asking open-ended questions: Rejected (patient declines the call) and missed (rings out) → wait 2 hours → one follow-up text with a confirm link. Voicemail → leave a short message with the callback number, then also send the text. And a retry policy: one call maximum — a reminder agent that calls twice starts to feel like a collections agent.`

const REMINDER_HANDOFF_REPLY_PARAGRAPHS = [
  'Done — reschedules get a handoff to your Front desk agent.',
  "For the calls that don't connect, here's what I suggest:",
  '• Call declined or missed → wait 2 hours → send one follow-up text with a confirm link.',
  '• Voicemail → leave a short message with your callback number, and send the same text.',
  "• One call maximum — no repeat calling. It's a reminder, not a chase.",
  'Sound right?',
]

const REMINDER_CONNECT_PILLS = ['Yes, correct', 'No, make changes'] as const

// Pre-filled into the composer after the no-connect defaults question.
const REMINDER_EMAIL_REPLY =
  "Yes. Oh — and here's the reminder email we send manually today. Keep the same tone."

const REMINDER_AFTER_EMAIL_THOUGHTS_TEXT = `A single small document — Extracting: warm, first-name tone; short paragraphs; includes the parking-instructions link and the "reply CONFIRM" convention. I'll reuse that voice and structure for both scheduled reminder messages, and keep their existing CONFIRM keyword as the confirmation mechanism for text.

Everything is now resolved or defaultable. Tool check against the catalog: email + text reminders ✓ (reminder tool), voice calling ✓, handoff to the Front desk agent ✓ (it's live). No missing integrations. Defaults to flag at review: calling window 9am–7pm patient-local (from "no weird hours"), caller ID = clinic main line, stop conditions, booked-inside-window skip rule, English only. Time to build — this one is fast, no need to tell her to leave.`

const REMINDER_READY_TO_BUILD_THOUGHTS_TEXT = `Everything is now resolved or defaultable. Tool check against the catalog: email + text reminders ✓ (reminder tool), voice calling ✓, handoff to the Front desk agent ✓ (it's live). No missing integrations. Defaults to flag at review: calling window 9am–7pm patient-local (from "no weird hours"), caller ID = clinic main line, stop conditions, booked-inside-window skip rule, English only. Time to build — this one is fast, no need to tell her to leave.`

const REMINDER_BUILD_REPLY_WITH_EMAIL =
  "Read it — warm and personal, and I noticed you use \"reply CONFIRM\" and include the parking instructions link. I'll keep both in the new messages. Building your agent now — this'll take under a minute."

const REMINDER_BUILD_REPLY_DEFAULT =
  "Defaults look good. Building your agent now — this'll take under a minute."

const REMINDER_POST_DRAFT_REPLY =
  'Now that I have created the new reminder agent for email and text, what would you like me to do?'

const REMINDER_POST_DRAFT_PILLS = ['Make changes', 'Save agent', 'View in agent builder'] as const

const REMINDER_DESIGN_STEPS = [
  { id: 'templates', label: 'Creating email and text templates' },
  { id: 'procedure', label: "Setting up the call's starting procedure" },
  { id: 'outcomes', label: 'Wiring the call outcome paths' },
  { id: 'final', label: 'Final checks' },
] as const

const REMINDER_BUILD_CARD = {
  title: 'New reminder agent - email and text',
  description: 'Sends email and text reminders, then calls patients who haven\'t confirmed.',
}

const FRONTDESK_BUILD_CARD = {
  title: 'New front desk agent - inbound',
  description:
    'Answers inbound calls and texts, books and reschedules appointments, and hands off billing disputes.',
}

// Pre-filled into the composer when John clicks the box after the draft review.
const FINAL_REVIEW_PROMPT =
  'Before I accept — the greeting is too generic. Make it "Thank you for calling Riverside Family Clinic, this is Ava. How can I help?" And let me test the booking flow.'

// John's response after the docs prompt: right-aligned attachment chips —
// same right-side placement as the first user message, proper RefChip attachments.
function UserDocsMessage({ files }: { files: AttachItem[] }) {
  return (
    <div className="mt-[36px] flex justify-end">
      <div className="flex max-w-[80%] flex-wrap justify-end gap-sm">
        {files.map((file) => (
          <RefChip key={file.id} kind={file.kind} label={file.label} />
        ))}
      </div>
    </div>
  )
}

const INTRO_THINKING_JOBS = [
  'Book appointment',
  'Reschedule appointment',
  'Answer insurance questions',
  'Escalate billing disputes to a human',
]

const CREATE_AGENT_THOUGHTS_TEXT = `This is an inbound Front desk agent for healthcare. Looking at how Myna is structured, this is a procedure + settings agent — the behaviour lives in procedures and settings, not a complex pure-workflow. The workflow itself is just "conversation starts → run procedures."

Jobs I can already see:
${INTRO_THINKING_JOBS.map((job) => `• ${job}`).join('\n')}

Channel: "inbound calls" → voice is implied. Need to confirm whether web chat / text are also in scope.

Transcripts are the single most valuable input here — they tell me the real distribution of jobs and how the team currently handles each one. He offered call recordings; I should ask for those transcripts first so I can ground the procedures in evidence rather than invent them.

I'll use defaults for greeting, consent, and voice for now and review later. First get the transcripts, then confirm channels — that's the one mandatory setting I can't infer.`

// Types a string out character-by-character; fires onDone once complete.
function useTypewriter(
  text: string,
  { charsPerTick = 4, intervalMs = 16, startDelayMs = 0, onDone }: {
    charsPerTick?: number
    intervalMs?: number
    startDelayMs?: number
    onDone?: () => void
  } = {},
) {
  const [typed, setTyped] = useState('')
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    setTyped('')
    let i = 0
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += charsPerTick
        setTyped(text.slice(0, i))
        if (i >= text.length) {
          window.clearInterval(interval)
          onDoneRef.current?.()
        }
      }, intervalMs)
    }, startDelayMs)
    return () => {
      window.clearTimeout(start)
      if (interval) window.clearInterval(interval)
    }
  }, [text, charsPerTick, intervalMs, startDelayMs])

  return { typed, done: typed.length >= text.length }
}

function TypingCaret() {
  return (
    <span className="thoughts-caret ml-px inline-block h-[1em] w-px translate-y-px bg-text-secondary" aria-hidden />
  )
}

// Animated gradient "AI" sparkle. When `spinning`, it rotates + pulses as a
// loading indicator while the agent composes a response; otherwise it rests.
function SparkleLoader({
  size = 18,
  spinning = true,
  className,
}: {
  size?: number
  spinning?: boolean
  className?: string
}) {
  return (
    <span
      className={`sparkle-loader ${spinning ? 'is-spinning' : ''} ${className ?? ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <defs>
          <linearGradient id="sparkle-loader-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9b6cf0" />
            <stop offset="55%" stopColor="#6834b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
          fill="url(#sparkle-loader-grad)"
        />
      </svg>
    </span>
  )
}

// Creation checklist labels shown while the Front desk draft card is building.
const DRAFT_BUILD_STATUS_LABELS = [
  'Creating agent',
  'Analysing contexts',
  'Analysing procedures',
  'Reading through the use cases',
  'Wiring up tools',
  'Finalising your draft',
]

function CreateAgentThinkingPanel({
  open,
  onToggle,
  onComplete,
  text = CREATE_AGENT_THOUGHTS_TEXT,
  label = 'Thoughts',
  fast = true,
}: {
  open: boolean
  onToggle: () => void
  onComplete?: () => void
  text?: string
  label?: string
  /** Faster typewriter for create-agent thoughts (default on). */
  fast?: boolean
}) {
  const completedRef = useRef(false)
  const { typed, done } = useTypewriter(text, {
    charsPerTick: fast ? 10 : 6,
    intervalMs: fast ? 10 : 12,
    onDone: () => {
      if (completedRef.current) return
      completedRef.current = true
      window.setTimeout(() => onComplete?.(), fast ? 100 : 180)
    },
  })

  const lines = typed.split('\n')

  return (
    <div className="agent-build-fade mt-3xl flex flex-col gap-sm">
      <button
        type="button"
        onClick={onToggle}
        disabled={!done}
        aria-expanded={open}
        className="group flex items-center gap-sm text-left disabled:cursor-default"
      >
        <Icon name="bolt" size={18} className="shrink-0 text-text-icon" />
        <span className="text-body text-text-secondary transition-colors group-hover:text-text-primary">{label}</span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={18}
          className="shrink-0 text-text-icon transition-colors group-hover:text-text-primary"
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ${
          open ? 'mt-sm max-h-[2400px] opacity-100' : 'mt-0 max-h-0 opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="ml-[9px] border-l border-border pl-lg text-body leading-6 text-text-tertiary">
          {lines.map((line, i) => {
            const isLast = i === lines.length - 1
            const caret = isLast && !done ? <TypingCaret /> : null
            if (line.startsWith('•')) {
              const label = line.slice(1).trimStart()
              return (
                <div key={i} className="flex items-start gap-sm">
                  <span className="shrink-0 text-[18px] leading-6" aria-hidden>
                    •
                  </span>
                  <span className="min-w-0 flex-1">
                    {label}
                    {caret}
                  </span>
                </div>
              )
            }
            if (line === '') {
              return <div key={i} className="h-md" />
            }
            return (
              <p key={i} className="whitespace-pre-wrap">
                {line}
                {caret}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Intro "Thinking" loader — sits in the same slot the Thoughts row (bolt icon + label) takes
// over once loading finishes.
function IntroThinkingLoaderRow() {
  return (
    <div className="mt-3xl flex flex-col gap-sm">
      <div className="agent-build-fade flex items-center gap-md">
        <AiAvatarChatIcon size={24} className="shrink-0" />
        <TypingDots />
      </div>
    </div>
  )
}

// Types an ordered list of paragraphs: each reveals + types only after the
// previous finishes (progressive disclosure), then fires onDone.
// Strings starting with "• " render as larger bullet rows.
// Strings starting with "ACTION: " render as a highlighted action cue row.
// Strings starting with "ACTION_CONT: " align under the action text.
function TypedParagraphs({
  paragraphs,
  className,
  onDone,
  fast = true,
  instant = false,
}: {
  paragraphs: ReactNode[]
  className?: string
  onDone?: () => void
  /** Faster typewriter for create-agent replies (default on). */
  fast?: boolean
  /** Show the full reply immediately — used when reopening a past chat from history. */
  instant?: boolean
}) {
  const [visible, setVisible] = useState(instant ? paragraphs.length - 1 : 0)
  const isStepRailLine = (value: string) => value.startsWith('STEP:') || /^\s+•/.test(value)
  const texts = paragraphs.map((p) => (typeof p === 'string' ? p : ''))
  const current = texts[visible] ?? ''
  const { typed, done } = useTypewriter(instant ? '' : current, {
    charsPerTick: fast ? 10 : 6,
    intervalMs: fast ? 10 : 12,
  })

  useEffect(() => {
    if (!instant) return
    onDone?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instant])

  useEffect(() => {
    if (instant) return
    if (!done) return
    if (visible < paragraphs.length - 1) {
      const t = window.setTimeout(() => setVisible((v) => v + 1), fast ? 60 : 100)
      return () => window.clearTimeout(t)
    }
    onDone?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, visible, fast, instant])

  const visibleItems = paragraphs
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i <= visible)
  const stepIndices = visibleItems
    .filter(({ p }) => typeof p === 'string' && isStepRailLine(p))
    .map(({ i }) => i)
  const firstStepIndex = stepIndices.length > 0 ? Math.min(...stepIndices) : -1
  const lastStepIndex = stepIndices.length > 0 ? Math.max(...stepIndices) : -1

  const renderParagraph = (p: ReactNode, i: number) => {
    const isInStepRail = firstStepIndex !== -1 && i >= firstStepIndex && i <= lastStepIndex
    const railClassName = isInStepRail ? 'agent-build-fade' : `agent-build-fade ${className ?? ''}`
    const contentClassName = isInStepRail ? className ?? '' : ''
    const rowClassName = [railClassName, contentClassName].filter(Boolean).join(' ')
    const isActive = !instant && i === visible
    const source = typeof p === 'string' ? p : ''
    const text = typeof p === 'string' ? (isActive ? typed : p) : p
    const caret = isActive && !done ? <TypingCaret /> : null

    if (source.startsWith('•')) {
      const label = typeof text === 'string' ? text.replace(/^•\s*/, '') : text
      return (
        <div key={i} className={`flex items-start gap-sm ${rowClassName}`}>
          <span className="shrink-0 text-[18px] leading-6" aria-hidden>
            •
          </span>
          <span className="min-w-0 flex-1">
            {label}
            {caret}
          </span>
        </div>
      )
    }

    if (source.startsWith('→')) {
      const label = typeof text === 'string' ? text.replace(/^→\s*/, '') : text
      return (
        <div key={i} className={`flex items-start gap-sm ${rowClassName}`}>
          <Icon name="arrow_forward" size={18} className="mt-px shrink-0 text-accent-positive" />
          <span className="min-w-0 flex-1">
            {label}
            {caret}
          </span>
        </div>
      )
    }

    if (source.startsWith('ACTION:')) {
      const label = typeof text === 'string' ? text.replace(/^ACTION:\s*/, '') : text
      return (
        <div key={i} className={`flex items-start gap-sm ${rowClassName}`}>
          <Icon name="arrow_forward" size={18} className="mt-px shrink-0 text-accent-positive" />
          <span className="min-w-0 flex-1 text-text-primary">
            {label}
            {caret}
          </span>
        </div>
      )
    }

    if (source.startsWith('ACTION_CONT:')) {
      const label = typeof text === 'string' ? text.replace(/^ACTION_CONT:\s*/, '') : text
      return (
        <p key={i} className={`-mt-sm ml-[26px] ${rowClassName}`}>
          {label}
          {caret}
        </p>
      )
    }

    if (source.startsWith('INDENT:')) {
      const label = typeof text === 'string' ? text.replace(/^INDENT:\s*/, '') : text
      return (
        <div key={i} className={`flex items-start gap-sm ${rowClassName}`}>
          <Icon name="lightbulb" size={18} className="mt-px shrink-0 text-[#E6AA04]" />
          <span className="min-w-0 flex-1 text-text-secondary">
            {label}
            {caret}
          </span>
        </div>
      )
    }

    if (source.startsWith('CALLOUT:')) {
      const label = typeof text === 'string' ? text.replace(/^CALLOUT:\s*/, '') : text
      return (
        <div key={i} className={`flex items-start gap-sm ${rowClassName}`}>
          <Icon name="schedule" size={18} className="mt-px shrink-0 text-[#E6AA04]" />
          <span className="min-w-0 flex-1 text-text-primary">
            {label}
            {caret}
          </span>
        </div>
      )
    }

    if (source.startsWith('STEP:')) {
      const label = typeof text === 'string' ? text.replace(/^STEP:\s*/, '') : text
      if (typeof label === 'string') {
        const match = label.match(/^(Step\s+\d+:)\s*(.*)$/i)
        if (match) {
          const [, stepLabel, rest] = match
          return (
            <p key={i} className={rowClassName}>
              <span className="font-medium text-text-primary">{stepLabel}</span>{' '}
              <span className="text-text-secondary">{rest}</span>
              {caret}
            </p>
          )
        }
      }
      return (
        <p key={i} className={rowClassName}>
          {label}
          {caret}
        </p>
      )
    }

    if (source.startsWith('WARN:')) {
      const label = typeof text === 'string' ? text.replace(/^WARN:\s*/, '') : text
      return (
        <div key={i} className={`flex items-start gap-sm ${rowClassName}`}>
          <Icon name="warning" size={18} className="mt-px shrink-0 text-[#E6AA04]" />
          <span className="min-w-0 flex-1 text-text-primary">
            {label}
            {caret}
          </span>
        </div>
      )
    }

    return (
      <p key={i} className={rowClassName}>
        {text}
        {caret}
      </p>
    )
  }

  return (
    <>
      {visibleItems
        .filter(({ i }) => i < firstStepIndex || firstStepIndex === -1)
        .map(({ p, i }) => renderParagraph(p, i))}
      {firstStepIndex !== -1 && (
        <div className="ml-[9px] border-l border-border pl-lg">
          <div className="flex flex-col gap-md">
            {visibleItems
              .filter(({ i }) => i >= firstStepIndex && i <= lastStepIndex)
              .map(({ p, i }) => renderParagraph(p, i))}
          </div>
        </div>
      )}
      {visibleItems
        .filter(({ i }) => i > lastStepIndex && firstStepIndex !== -1)
        .map(({ p, i }) => renderParagraph(p, i))}
    </>
  )
}

const CREATE_AGENT_INTRO_JOBS = [
  'Book an appointment',
  'Reschedule an appointment',
  'Answer insurance questions',
  'Escalate billing disputes to a human',
]

const CREATE_AGENT_INTRO_PARAGRAPHS = [
  'Great — a Front desk agent for inbound is a perfect fit. From what you said, I can already see four jobs:',
  ...CREATE_AGENT_INTRO_JOBS.map((job) => `• ${job}`),
  'ACTION: Please upload those call recordings or transcripts.',
  'ACTION_CONT: They are the best thing you can give me: they’ll show me what your callers actually ask for and how your team handles it, so I build procedures that match how you really work — not a generic template.',
  'You can drop in as many as you have.',
]

function CreateAgentIntroReply({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      {/* Sparkle avatar, left-aligned to sit in the same column as the Thoughts icon.
          Animates while the reply types, then rests. */}
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={CREATE_AGENT_INTRO_PARAGRAPHS}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

function ReminderCreateIntroReply({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={REMINDER_CREATE_INTRO_PARAGRAPHS}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

function ReviewAgentReply({
  paragraphs,
  onComplete,
}: {
  paragraphs: string[]
  onComplete?: () => void
}) {
  const [done, setDone] = useState(false)
  return (
    <div className="agent-build-fade mt-3xl flex gap-sm">
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
        <SparkleLoader size={14} spinning={!done} />
      </span>
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={paragraphs}
          onDone={() => {
            setDone(true)
            onComplete?.()
          }}
        />
      </div>
    </div>
  )
}

/** Demo trigger: picking this pill simulates a mid-stream API failure. */
function isSourcesStreamFailDemo(text: string) {
  return /^facebook only\.?$/i.test(text.trim())
}

const SOURCES_STREAM_FAIL_PARTIAL =
  "Got it — I'll limit the trigger to Facebook reviews only. Next I'll narrow loc"

/** Streams a partial assistant reply, then surfaces an inline failure + Retry. */
function GhostwriterStreamFailTurn({
  onFail,
}: {
  onFail: (partial: string) => void
}) {
  const onFailRef = useRef(onFail)
  onFailRef.current = onFail

  const { typed, done } = useTypewriter(SOURCES_STREAM_FAIL_PARTIAL, {
    charsPerTick: 3,
    intervalMs: 18,
  })

  useEffect(() => {
    if (!done) return
    // Brief pause after the last token so the cut feels like a dropped stream.
    const t = window.setTimeout(() => onFailRef.current(SOURCES_STREAM_FAIL_PARTIAL), 280)
    return () => window.clearTimeout(t)
  }, [done])

  return (
    <div className="agent-build-fade mt-3xl flex gap-sm" aria-live="polite">
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
        <SparkleLoader size={14} spinning />
      </span>
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <p className="whitespace-pre-wrap">
          {typed}
          <TypingCaret />
        </p>
      </div>
    </div>
  )
}

/** Inline stream-failure state (ChatGPT / Claude / Fin pattern) — not a toast. */
function GhostwriterStreamFailError({
  partial,
  onRetry,
}: {
  partial: string
  onRetry: () => void
}) {
  return (
    <div className="agent-build-fade mt-3xl flex gap-sm" role="alert">
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
        <SparkleLoader size={14} spinning={false} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-sm text-body leading-6">
        {partial ? (
          <p className="whitespace-pre-wrap text-text-primary">{partial}</p>
        ) : null}
        <p className="text-text-secondary">Couldn&apos;t generate a response</p>
        <button
          type="button"
          onClick={onRetry}
          className="flex h-9 w-fit items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

type ReviewChoiceStep = {
  /** Scripted demo reply pre-filled when the user clicks the composer. */
  composerFill: string
  /** Short options relevant to the current question. */
  primary: string[]
}

const REVIEW_RESPONSE_CHOICES = {
  sources: {
    composerFill: 'Watch all sources.',
    primary: ['All sources', 'Google only', 'Facebook only'],
  },
  locations: {
    composerFill: 'All 4 locations.',
    primary: ['All 4 locations', 'Just a few to start', 'Select locations'],
  },
  spamOk: {
    composerFill: 'ok',
    primary: ['ok', 'Sounds good'],
  },
  spamAlert: {
    composerFill: 'Yes, email me the spam alerts.',
    primary: ['Email me alerts', 'No alerts'],
  },
  spamEmail: {
    composerFill: 'Use my account email.',
    primary: ['Use my account email', 'Use a different address'],
  },
  offline: {
    composerFill: 'Yes — phone and email.',
    primary: ['Phone and email', 'Phone only', 'Email only'],
  },
  writing: {
    composerFill: 'Keep all three.',
    primary: ['Keep all three', 'Skip SEO keywords'],
  },
  publish: {
    composerFill: 'Post automatically.',
    primary: ['Post automatically', 'Wait for approval'],
  },
  build: {
    composerFill: 'Build agent.',
    primary: ['Build agent'],
  },
} as const satisfies Record<string, ReviewChoiceStep>

function ReviewChoicePills({
  primary,
  onPick,
}: {
  primary: readonly string[]
  onPick: (label: string) => void
}) {
  // Choice pills only — no "Additional answers" overflow.
  return (
    <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
      {primary.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(label)}
          className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ReviewBuildingCard({
  onDone,
  persisted = false,
  onViewWorkflow,
  workflowVisible = false,
}: {
  onDone?: () => void
  persisted?: boolean
  onViewWorkflow?: () => void
  workflowVisible?: boolean
}) {
  const [step, setStep] = useState(persisted ? REVIEW_RESPONSE_DESIGN_STEPS.length : 0)
  const completedRef = useRef(false)
  const done = persisted || step >= REVIEW_RESPONSE_DESIGN_STEPS.length
  const displayStep = persisted ? REVIEW_RESPONSE_DESIGN_STEPS.length : step
  const collapsed = done && workflowVisible

  useEffect(() => {
    if (persisted) return
    if (done) {
      if (!completedRef.current) {
        completedRef.current = true
        const t = window.setTimeout(() => onDone?.(), 600)
        return () => window.clearTimeout(t)
      }
      return
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done, persisted])

  return (
    <div className="agent-build-fade mt-3xl flex flex-col gap-md">
      <p className="text-body leading-6">
        {done ? (
          <span className="text-text-primary">Review response agent draft is ready</span>
        ) : (
          <span className="inline-flex items-center gap-xs">
            <span className="text-text-primary">Creating the review response agent</span>
            <span className="inline-flex items-center gap-px" aria-hidden>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="animate-pulse size-1 rounded-full bg-text-tertiary"
                  style={{ animationDelay: `${dot * 0.15}s` }}
                />
              ))}
            </span>
          </span>
        )}
      </p>
      <div className="rounded-md border border-border bg-surface p-lg">
        <div className="flex items-start gap-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-sm">
              <div className="flex min-w-0 items-center gap-sm">
                <span className="text-body text-text-primary">{REVIEW_RESPONSE_BUILD_CARD.title}</span>
                {done && (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                    Draft
                  </span>
                )}
              </div>
              {done && !workflowVisible && (
                <button
                  type="button"
                  onClick={onViewWorkflow}
                  className="shrink-0 rounded-sm text-body text-text-action hover:underline"
                >
                  View in agent builder
                </button>
              )}
            </div>
            <p className="mt-xs text-body text-text-secondary">{REVIEW_RESPONSE_BUILD_CARD.description}</p>
            {!done && !collapsed && (
              <ul className="mt-md flex flex-col gap-sm">
                {REVIEW_RESPONSE_DESIGN_STEPS.map((item, index) => {
                  const complete = index < displayStep
                  const active = index === displayStep
                  return (
                    <li key={item.id} className="flex items-center gap-sm text-body">
                      <Icon
                        name={complete ? 'check_circle' : active ? 'progress_activity' : 'radio_button_unchecked'}
                        size={18}
                        className={complete ? 'text-accent-positive' : active ? 'animate-spin text-ai-brand' : 'text-text-tertiary'}
                      />
                      <span className={complete || active ? 'text-text-primary' : 'text-text-tertiary'}>
                        {item.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewResponseThread({
  onDraftReady,
  onCreateAgent,
  onViewWorkflow,
  onMakeChanges,
  workflowVisible = false,
  suppressAutoScrollBriefly,
  pendingAnswer,
  onPendingAnswerConsumed,
  onComposerFillChange,
  onBusyChange,
  onTrailChange,
}: {
  onDraftReady?: (name: string | null) => void
  onCreateAgent?: (options?: { publish?: boolean }) => void
  onViewWorkflow?: () => void
  onMakeChanges?: () => void
  workflowVisible?: boolean
  suppressAutoScrollBriefly: () => void
  /** Answer submitted from the bottom composer (click-to-fill → send). */
  pendingAnswer?: string
  onPendingAnswerConsumed?: () => void
  /** Scripted reply for the current open question — parent fills composer on click. */
  onComposerFillChange?: (text: string | null) => void
  onBusyChange?: (busy: boolean) => void
  /** Emits the visible create-thread turns for the shared AI Builder draft store. */
  onTrailChange?: (trail: CreateChatTurn[]) => void
}) {
  const [introDone, setIntroDone] = useState(false)
  const [sourcesAnswer, setSourcesAnswer] = useState('')
  /** none → happy path; attempting/failed → Facebook-only stream-fail demo; ok → recovered via Retry. */
  const [sourcesStreamPhase, setSourcesStreamPhase] = useState<'none' | 'attempting' | 'failed' | 'ok'>('none')
  const [sourcesStreamPartial, setSourcesStreamPartial] = useState('')
  const [sourcesStreamAttemptKey, setSourcesStreamAttemptKey] = useState(0)
  const [sourcesThoughtsOpen, setSourcesThoughtsOpen] = useState(true)
  const [sourcesReplyReady, setSourcesReplyReady] = useState(false)
  const [sourcesReplyDone, setSourcesReplyDone] = useState(false)
  const [locationsAnswer, setLocationsAnswer] = useState('')
  const [locationsThoughtsOpen, setLocationsThoughtsOpen] = useState(true)
  const [locationsReplyReady, setLocationsReplyReady] = useState(false)
  const [locationsReplyDone, setLocationsReplyDone] = useState(false)
  const [locationsDrawerOpen, setLocationsDrawerOpen] = useState(false)
  const [spamOkAnswer, setSpamOkAnswer] = useState('')
  const [spamOkThoughtsOpen, setSpamOkThoughtsOpen] = useState(true)
  const [spamAlertReady, setSpamAlertReady] = useState(false)
  const [spamAlertDone, setSpamAlertDone] = useState(false)
  const [spamAlertAnswer, setSpamAlertAnswer] = useState('')
  const [spamAlertThoughtsOpen, setSpamAlertThoughtsOpen] = useState(true)
  const [spamEmailReady, setSpamEmailReady] = useState(false)
  const [spamEmailDone, setSpamEmailDone] = useState(false)
  const [spamEmailAnswer, setSpamEmailAnswer] = useState('')
  const [spamEmailThoughtsOpen, setSpamEmailThoughtsOpen] = useState(true)
  const [offlineReady, setOfflineReady] = useState(false)
  const [offlineDone, setOfflineDone] = useState(false)
  const [offlineAnswer, setOfflineAnswer] = useState('')
  const [offlineThoughtsOpen, setOfflineThoughtsOpen] = useState(true)
  const [writingReady, setWritingReady] = useState(false)
  const [writingDone, setWritingDone] = useState(false)
  const [writingAnswer, setWritingAnswer] = useState('')
  const [writingThoughtsOpen, setWritingThoughtsOpen] = useState(true)
  const [publishReady, setPublishReady] = useState(false)
  const [publishDone, setPublishDone] = useState(false)
  const [publishAnswer, setPublishAnswer] = useState('')
  const [publishThoughtsOpen, setPublishThoughtsOpen] = useState(true)
  const [holdReady, setHoldReady] = useState(false)
  const [holdDone, setHoldDone] = useState(false)
  const [buildAnswer, setBuildAnswer] = useState('')
  const [buildThoughtsOpen, setBuildThoughtsOpen] = useState(true)
  const [summaryReady, setSummaryReady] = useState(false)
  const [summaryDone, setSummaryDone] = useState(false)
  const [buildCardDone, setBuildCardDone] = useState(false)
  const [postDraftDone, setPostDraftDone] = useState(false)
  const [postDraftAnswer, setPostDraftAnswer] = useState('')

  const awaitingStep =
    introDone && !sourcesAnswer
      ? 'sources'
      : sourcesReplyDone && !locationsAnswer
        ? 'locations'
        : locationsReplyDone && !spamOkAnswer
          ? 'spamOk'
          : spamAlertDone && !spamAlertAnswer
            ? 'spamAlert'
            : spamEmailDone && !spamEmailAnswer
              ? 'spamEmail'
              : offlineDone && !offlineAnswer
                ? 'offline'
                : writingDone && !writingAnswer
                  ? 'writing'
                  : publishDone && !publishAnswer
                    ? 'publish'
                    : holdDone && !buildAnswer
                      ? 'build'
                      : null

  const applySourcesAnswer = (raw: string, { recoverFail = false }: { recoverFail?: boolean } = {}) => {
    const text = raw.trim()
    if (!text) return
    const fill = REVIEW_RESPONSE_CHOICES.sources.composerFill
    const next =
      text === 'All sources' || text === fill
        ? fill
        : text
    setSourcesThoughtsOpen(true)
    setSourcesReplyReady(false)
    setSourcesReplyDone(false)
    setSourcesStreamPartial('')
    if (recoverFail || !isSourcesStreamFailDemo(next)) {
      setSourcesStreamPhase('ok')
    } else {
      setSourcesStreamPhase('attempting')
      setSourcesStreamAttemptKey((k) => k + 1)
    }
    setSourcesAnswer(next)
  }

  const applyAnswer = (raw: string) => {
    const text = raw.trim()
    if (!text || !awaitingStep) return
    const fill = REVIEW_RESPONSE_CHOICES[awaitingStep].composerFill

    switch (awaitingStep) {
      case 'sources':
        applySourcesAnswer(text)
        break
      case 'locations':
        if (text === 'Select locations') {
          setLocationsDrawerOpen(true)
          return
        }
        setLocationsAnswer(
          text === 'All 4 locations' || text === fill ? fill : text,
        )
        break
      case 'spamOk':
        setSpamOkAnswer(text === 'ok' || text === fill ? fill : text)
        break
      case 'spamAlert':
        setSpamAlertAnswer(
          text === 'Email me alerts' || text === fill ? fill : text,
        )
        break
      case 'spamEmail':
        setSpamEmailAnswer(
          text === 'Use my account email' || text === fill ? fill : text,
        )
        break
      case 'offline':
        setOfflineAnswer(
          text === 'Phone and email' || text === fill ? fill : text,
        )
        break
      case 'writing':
        setWritingAnswer(
          text === 'Keep all three' || text === fill ? fill : text,
        )
        break
      case 'publish':
        setPublishAnswer(
          text === 'Post automatically' || text === fill ? fill : text,
        )
        break
      case 'build':
        setBuildAnswer(text === 'Build agent' || text === fill ? fill : text)
        break
    }
  }

  const handleSourcesStreamRetry = () => {
    // Re-send the same user prompt; this time the stream succeeds (no auto-retry loop).
    applySourcesAnswer(sourcesAnswer || 'Facebook only', { recoverFail: true })
  }

  useEffect(() => {
    if (!pendingAnswer?.trim()) return
    // While a failed turn sits inline, composer stays live — a new send rephrases.
    if (sourcesStreamPhase === 'failed') {
      applySourcesAnswer(pendingAnswer)
      onPendingAnswerConsumed?.()
      return
    }
    if (!awaitingStep) return
    applyAnswer(pendingAnswer)
    onPendingAnswerConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAnswer, awaitingStep, sourcesStreamPhase])

  useEffect(() => {
    if (sourcesStreamPhase === 'failed' && sourcesAnswer) {
      onComposerFillChange?.(sourcesAnswer)
      return
    }
    onComposerFillChange?.(
      awaitingStep ? REVIEW_RESPONSE_CHOICES[awaitingStep].composerFill : null,
    )
  }, [awaitingStep, onComposerFillChange, sourcesStreamPhase, sourcesAnswer])

  const sourcesAwaitingReply =
    Boolean(sourcesAnswer) && !sourcesReplyDone && sourcesStreamPhase !== 'failed'

  const busy =
    !introDone ||
    sourcesAwaitingReply ||
    (Boolean(locationsAnswer) && !locationsReplyDone) ||
    (Boolean(spamOkAnswer) && !spamAlertDone) ||
    (Boolean(spamAlertAnswer) && !spamEmailDone) ||
    (Boolean(spamEmailAnswer) && !offlineDone) ||
    (Boolean(offlineAnswer) && !writingDone) ||
    (Boolean(writingAnswer) && !publishDone) ||
    (Boolean(publishAnswer) && !holdDone) ||
    (Boolean(buildAnswer) && !summaryDone) ||
    (summaryDone && !buildCardDone) ||
    (buildCardDone && !postDraftDone)

  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  useEffect(() => {
    if (buildCardDone) onDraftReady?.(REVIEW_RESPONSE_BUILD_CARD.title)
  }, [buildCardDone, onDraftReady])

  useEffect(() => {
    if (!onTrailChange) return
    const trail: CreateChatTurn[] = []
    const pushAgent = (paragraphs: string[]) => {
      trail.push({ kind: 'agent', paragraphs })
    }

    // Intro is on screen as soon as this thread mounts (typed reply).
    pushAgent(REVIEW_RESPONSE_INTRO_PARAGRAPHS)

    if (sourcesAnswer) {
      trail.push({ kind: 'user', text: sourcesAnswer })
      if (sourcesStreamPhase === 'none' || sourcesStreamPhase === 'ok') {
        trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_SOURCES_THOUGHTS })
        if (sourcesReplyReady || sourcesReplyDone) pushAgent(REVIEW_RESPONSE_SOURCES_REPLY)
      }
    }
    if (locationsAnswer) {
      trail.push({ kind: 'user', text: locationsAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_LOCATIONS_THOUGHTS })
      if (locationsReplyReady || locationsReplyDone) pushAgent(REVIEW_RESPONSE_LOCATIONS_REPLY)
    }
    if (spamOkAnswer) {
      trail.push({ kind: 'user', text: spamOkAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_SPAM_OK_THOUGHTS })
      if (spamAlertReady || spamAlertDone) pushAgent(REVIEW_RESPONSE_SPAM_ALERT_REPLY)
    }
    if (spamAlertAnswer) {
      trail.push({ kind: 'user', text: spamAlertAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_SPAM_ALERT_THOUGHTS })
      if (spamEmailReady || spamEmailDone) pushAgent(REVIEW_RESPONSE_SPAM_EMAIL_REPLY)
    }
    if (spamEmailAnswer) {
      trail.push({ kind: 'user', text: spamEmailAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_SPAM_EMAIL_THOUGHTS })
      if (offlineReady || offlineDone) pushAgent(REVIEW_RESPONSE_OFFLINE_REPLY)
    }
    if (offlineAnswer) {
      trail.push({ kind: 'user', text: offlineAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_OFFLINE_THOUGHTS })
      if (writingReady || writingDone) pushAgent(REVIEW_RESPONSE_WRITING_REPLY)
    }
    if (writingAnswer) {
      trail.push({ kind: 'user', text: writingAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_WRITING_THOUGHTS })
      if (publishReady || publishDone) pushAgent(REVIEW_RESPONSE_PUBLISH_REPLY)
    }
    if (publishAnswer) {
      trail.push({ kind: 'user', text: publishAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_PUBLISH_THOUGHTS })
      if (holdReady || holdDone) pushAgent(REVIEW_RESPONSE_HOLD_REPLY)
    }
    if (buildAnswer) {
      trail.push({ kind: 'user', text: buildAnswer })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_AFTER_BUILD_THOUGHTS })
      if (summaryReady || summaryDone) pushAgent(REVIEW_RESPONSE_SUMMARY_PARAGRAPHS)
    }
    if (buildCardDone) {
      trail.push({
        kind: 'draft',
        title: REVIEW_RESPONSE_BUILD_CARD.title,
        description: REVIEW_RESPONSE_BUILD_CARD.description,
        variant: 'review-response',
      })
    }
    if (postDraftDone) {
      pushAgent([REVIEW_RESPONSE_POST_DRAFT_REPLY])
    }
    if (postDraftAnswer) {
      trail.push({ kind: 'user', text: postDraftAnswer })
    }

    onTrailChange(trail)
  }, [
    onTrailChange,
    sourcesAnswer,
    sourcesStreamPhase,
    sourcesReplyReady,
    sourcesReplyDone,
    locationsAnswer,
    locationsReplyReady,
    locationsReplyDone,
    spamOkAnswer,
    spamAlertReady,
    spamAlertDone,
    spamAlertAnswer,
    spamEmailReady,
    spamEmailDone,
    spamEmailAnswer,
    offlineReady,
    offlineDone,
    offlineAnswer,
    writingReady,
    writingDone,
    writingAnswer,
    publishReady,
    publishDone,
    publishAnswer,
    holdReady,
    holdDone,
    buildAnswer,
    summaryReady,
    summaryDone,
    buildCardDone,
    postDraftDone,
    postDraftAnswer,
  ])

  const handlePostDraftAnswer = (label: string) => {
    if (label === 'View in agent builder') {
      onViewWorkflow?.()
      return
    }
    setPostDraftAnswer(label)
    if (label === 'Save agent') onCreateAgent?.()
    else if (label === 'Make changes') onMakeChanges?.()
  }

  const choice = awaitingStep ? REVIEW_RESPONSE_CHOICES[awaitingStep] : null
  const postDraftPills = workflowVisible
    ? REVIEW_RESPONSE_POST_DRAFT_PILLS.filter((label) => label !== 'View in agent builder')
    : REVIEW_RESPONSE_POST_DRAFT_PILLS

  return (
    <>
      <ReviewAgentReply paragraphs={REVIEW_RESPONSE_INTRO_PARAGRAPHS} onComplete={() => setIntroDone(true)} />
      {introDone && (
        <MessageActions copyText={REVIEW_RESPONSE_INTRO_PARAGRAPHS.join('\n\n')} className="ml-3xl" />
      )}
      {choice && awaitingStep === 'sources' && (
        <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
      )}
      {sourcesAnswer && <UserBubble>{sourcesAnswer}</UserBubble>}
      {sourcesAnswer && sourcesStreamPhase === 'attempting' && (
        <GhostwriterStreamFailTurn
          key={sourcesStreamAttemptKey}
          onFail={(partial) => {
            setSourcesStreamPartial(partial)
            setSourcesStreamPhase('failed')
          }}
        />
      )}
      {sourcesAnswer && sourcesStreamPhase === 'failed' && (
        <GhostwriterStreamFailError
          partial={sourcesStreamPartial}
          onRetry={handleSourcesStreamRetry}
        />
      )}
      {sourcesAnswer && (sourcesStreamPhase === 'none' || sourcesStreamPhase === 'ok') && (
        <>
          <CreateAgentThinkingPanel
            open={sourcesThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setSourcesThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setSourcesThoughtsOpen(false)
              setSourcesReplyReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_SOURCES_THOUGHTS}
            fast
          />
          {sourcesReplyReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_SOURCES_REPLY}
              onComplete={() => setSourcesReplyDone(true)}
            />
          )}
          {sourcesReplyDone && (
            <MessageActions copyText={REVIEW_RESPONSE_SOURCES_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'locations' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {locationsAnswer && <UserBubble>{locationsAnswer}</UserBubble>}
      {locationsAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={locationsThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setLocationsThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setLocationsThoughtsOpen(false)
              setLocationsReplyReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_LOCATIONS_THOUGHTS}
            fast
          />
          {locationsReplyReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_LOCATIONS_REPLY}
              onComplete={() => setLocationsReplyDone(true)}
            />
          )}
          {locationsReplyDone && (
            <MessageActions copyText={REVIEW_RESPONSE_LOCATIONS_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'spamOk' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {spamOkAnswer && <UserBubble>{spamOkAnswer}</UserBubble>}
      {spamOkAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={spamOkThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setSpamOkThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setSpamOkThoughtsOpen(false)
              setSpamAlertReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_SPAM_OK_THOUGHTS}
            fast
          />
          {spamAlertReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_SPAM_ALERT_REPLY}
              onComplete={() => setSpamAlertDone(true)}
            />
          )}
          {spamAlertDone && (
            <MessageActions copyText={REVIEW_RESPONSE_SPAM_ALERT_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'spamAlert' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {spamAlertAnswer && <UserBubble>{spamAlertAnswer}</UserBubble>}
      {spamAlertAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={spamAlertThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setSpamAlertThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setSpamAlertThoughtsOpen(false)
              setSpamEmailReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_SPAM_ALERT_THOUGHTS}
            fast
          />
          {spamEmailReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_SPAM_EMAIL_REPLY}
              onComplete={() => setSpamEmailDone(true)}
            />
          )}
          {spamEmailDone && (
            <MessageActions copyText={REVIEW_RESPONSE_SPAM_EMAIL_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'spamEmail' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {spamEmailAnswer && <UserBubble>{spamEmailAnswer}</UserBubble>}
      {spamEmailAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={spamEmailThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setSpamEmailThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setSpamEmailThoughtsOpen(false)
              setOfflineReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_SPAM_EMAIL_THOUGHTS}
            fast
          />
          {offlineReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_OFFLINE_REPLY}
              onComplete={() => setOfflineDone(true)}
            />
          )}
          {offlineDone && (
            <MessageActions copyText={REVIEW_RESPONSE_OFFLINE_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'offline' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {offlineAnswer && <UserBubble>{offlineAnswer}</UserBubble>}
      {offlineAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={offlineThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setOfflineThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setOfflineThoughtsOpen(false)
              setWritingReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_OFFLINE_THOUGHTS}
            fast
          />
          {writingReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_WRITING_REPLY}
              onComplete={() => setWritingDone(true)}
            />
          )}
          {writingDone && (
            <MessageActions copyText={REVIEW_RESPONSE_WRITING_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'writing' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {writingAnswer && <UserBubble>{writingAnswer}</UserBubble>}
      {writingAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={writingThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setWritingThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setWritingThoughtsOpen(false)
              setPublishReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_WRITING_THOUGHTS}
            fast
          />
          {publishReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_PUBLISH_REPLY}
              onComplete={() => setPublishDone(true)}
            />
          )}
          {publishDone && (
            <MessageActions copyText={REVIEW_RESPONSE_PUBLISH_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'publish' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {publishAnswer && <UserBubble>{publishAnswer}</UserBubble>}
      {publishAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={publishThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setPublishThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setPublishThoughtsOpen(false)
              setHoldReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_PUBLISH_THOUGHTS}
            fast
          />
          {holdReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_HOLD_REPLY}
              onComplete={() => setHoldDone(true)}
            />
          )}
          {holdDone && (
            <MessageActions copyText={REVIEW_RESPONSE_HOLD_REPLY.join('\n\n')} className="ml-3xl" />
          )}
          {choice && awaitingStep === 'build' && (
            <ReviewChoicePills primary={choice.primary} onPick={applyAnswer} />
          )}
        </>
      )}
      {buildAnswer && <UserBubble>{buildAnswer}</UserBubble>}
      {buildAnswer && (
        <>
          <CreateAgentThinkingPanel
            open={buildThoughtsOpen}
            onToggle={() => {
              suppressAutoScrollBriefly()
              setBuildThoughtsOpen((prev) => !prev)
            }}
            onComplete={() => {
              setBuildThoughtsOpen(false)
              setSummaryReady(true)
            }}
            text={REVIEW_RESPONSE_AFTER_BUILD_THOUGHTS}
            fast
          />
          {summaryReady && (
            <ReviewAgentReply
              paragraphs={REVIEW_RESPONSE_SUMMARY_PARAGRAPHS}
              onComplete={() => setSummaryDone(true)}
            />
          )}
          {summaryDone && (
            <MessageActions copyText={REVIEW_RESPONSE_SUMMARY_PARAGRAPHS.join('\n\n')} className="ml-3xl" />
          )}
          {summaryDone && (
            <ReviewBuildingCard
              onDone={() => setBuildCardDone(true)}
              onViewWorkflow={onViewWorkflow}
              workflowVisible={workflowVisible}
            />
          )}
          {buildCardDone && (
            <>
              <div className="agent-build-fade mt-3xl flex gap-sm">
                <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                  <SparkleLoader size={14} spinning={!postDraftDone} />
                </span>
                <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
                  <TypedParagraphs
                    fast
                    paragraphs={[REVIEW_RESPONSE_POST_DRAFT_REPLY]}
                    onDone={() => setPostDraftDone(true)}
                  />
                </div>
              </div>
              {postDraftDone && (
                <MessageActions className="ml-3xl" copyText={REVIEW_RESPONSE_POST_DRAFT_REPLY} />
              )}
              {postDraftDone && !postDraftAnswer && (
                <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
                  {postDraftPills.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handlePostDraftAnswer(label)}
                      className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {postDraftAnswer && <UserBubble>{postDraftAnswer}</UserBubble>}
            </>
          )}
        </>
      )}
      {locationsDrawerOpen && (
        <LocationsDrawer
          onBack={() => setLocationsDrawerOpen(false)}
          onSave={(selected: { id: string; name: string }[] | { locations?: { id: string; name: string }[] }) => {
            setLocationsDrawerOpen(false)
            const list = Array.isArray(selected) ? selected : (selected?.locations || [])
            if (!list.length) return
            const names = list.map((loc) => loc.name)
            const answer =
              names.length <= 2
                ? names.join(', ')
                : `${names.slice(0, 2).join(', ')} + ${names.length - 2} more`
            setLocationsAnswer(answer)
          }}
        />
      )}
    </>
  )
}

function ReminderCadenceFollowUp({
  openProcedureName,
  onOpenProcedure,
  onComplete,
}: {
  openProcedureName: string | null
  onOpenProcedure: (name: string) => void
  onComplete?: () => void
}) {
  const [stage, setStage] = useState<'intro' | 'question' | 'done'>('intro')

  useEffect(() => {
    if (stage !== 'done') return
    onComplete?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={REMINDER_CADENCE_REPLY_PARAGRAPHS}
          onDone={() => setStage('question')}
        />

        {(stage === 'question' || stage === 'done') && (
          <button
            type="button"
            onClick={() => onOpenProcedure(REMINDER_CALL_PROCEDURE_NAME)}
            aria-pressed={openProcedureName === REMINDER_CALL_PROCEDURE_NAME}
            className={`agent-build-fade flex items-start gap-sm rounded-md border border-border px-md py-md text-left hover:bg-surface-hover ${
              openProcedureName === REMINDER_CALL_PROCEDURE_NAME ? 'bg-surface-hover' : 'bg-surface'
            }`}
          >
            <span className="flex h-6 shrink-0 items-center">
              <Icon name="menu_book" size={18} className="text-text-icon" />
            </span>
            <span className="min-w-0 flex-1 text-body leading-6">
              <span className="text-text-primary">{REMINDER_CALL_PROCEDURE_LABEL}</span>
              <span className="text-text-secondary"> — {REMINDER_CALL_PROCEDURE_NOTE}</span>
            </span>
            <span className="flex h-6 shrink-0 items-center">
              <Icon name="chevron_right" size={18} className="text-text-icon" />
            </span>
          </button>
        )}

        {(stage === 'question' || stage === 'done') && (
          <TypedParagraphs
            fast
            paragraphs={REMINDER_RESCHEDULE_QUESTION_PARAGRAPHS}
            onDone={() => setStage('done')}
          />
        )}
      </div>
    </div>
  )
}

function ReminderHandoffFollowUp({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={REMINDER_HANDOFF_REPLY_PARAGRAPHS}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

function ReminderBuildReply({
  hasEmailAttachment,
  onComplete,
}: {
  hasEmailAttachment: boolean
  onComplete?: () => void
}) {
  const text = hasEmailAttachment ? REMINDER_BUILD_REPLY_WITH_EMAIL : REMINDER_BUILD_REPLY_DEFAULT
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={[text]}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

function ReminderPostDraftFollowUp({
  answer,
  onAnswer,
  onComplete,
  hideViewWorkflow = false,
}: {
  answer: string
  onAnswer: (label: string) => void
  onComplete?: () => void
  hideViewWorkflow?: boolean
}) {
  const [done, setDone] = useState(false)
  const pills = hideViewWorkflow
    ? REMINDER_POST_DRAFT_PILLS.filter((label) => label !== 'View in agent builder')
    : REMINDER_POST_DRAFT_PILLS

  return (
    <>
      <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
        <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
        <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
          <TypedParagraphs
            fast
            paragraphs={[REMINDER_POST_DRAFT_REPLY]}
            onDone={() => {
              setDone(true)
              onComplete?.()
            }}
          />
        </div>
      </div>
      {done && !answer && (
        <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
          {pills.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onAnswer(label)}
              className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {done && (
        <MessageActions className="ml-3xl" copyText={REMINDER_POST_DRAFT_REPLY} />
      )}
      {answer && <UserBubble>{answer}</UserBubble>}
    </>
  )
}

/** Agent response while the reminder draft is being built — checklist + status card.
 *  Mirrors Front desk `BuildingProgressPanel` so the designing steps are visible above the card. */
function ReminderBuildingCard({
  onDone,
  persisted = false,
  onViewWorkflow,
  openProcedureName,
  onOpenProcedure,
  workflowVisible = false,
}: {
  onDone?: () => void
  persisted?: boolean
  onViewWorkflow?: () => void
  openProcedureName: string | null
  onOpenProcedure: (name: string) => void
  workflowVisible?: boolean
}) {
  const [step, setStep] = useState(persisted ? REMINDER_DESIGN_STEPS.length : 0)
  const completedRef = useRef(false)
  const done = persisted || step >= REMINDER_DESIGN_STEPS.length
  const displayStep = persisted ? REMINDER_DESIGN_STEPS.length : step
  const collapsed = done && workflowVisible

  useEffect(() => {
    if (persisted) return
    if (done) {
      if (!completedRef.current) {
        completedRef.current = true
        const t = window.setTimeout(() => onDone?.(), 600)
        return () => window.clearTimeout(t)
      }
      return
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 1100)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done, persisted])

  return (
    <div className="agent-build-fade mt-3xl flex flex-col gap-md">
      {/* Heading swaps from an animated "building" state to the completion message. */}
      <p className="text-body leading-6">
        {done ? (
          <span className="font-medium text-text-primary">Reminder agent draft is ready</span>
        ) : (
          <span className="inline-flex items-center gap-xs">
            <span className="font-medium text-text-primary">Creating the reminder agent journey</span>
            <span className="inline-flex items-center gap-px" aria-hidden>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="animate-pulse size-1 rounded-full bg-text-tertiary"
                  style={{ animationDelay: `${dot * 0.15}s` }}
                />
              ))}
            </span>
          </span>
        )}
      </p>

      {/* Single card that morphs from building (checklist) to draft-ready (full recap) in place.
          When the workflow canvas is open, collapse to title + one-liner only. */}
      <div className="rounded-md border border-border bg-surface p-lg">
        <div className="flex items-start gap-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-sm">
              <div className="flex min-w-0 items-center gap-sm">
                <span className="text-body text-text-primary">{REMINDER_BUILD_CARD.title}</span>
                {done && (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                    Draft
                  </span>
                )}
              </div>
              {done && !workflowVisible && (
                <button
                  type="button"
                  onClick={onViewWorkflow}
                  className="shrink-0 rounded-sm text-body text-text-action hover:underline"
                >
                  View in agent builder
                </button>
              )}
            </div>
            <p className="mt-xs text-small text-text-secondary">{REMINDER_BUILD_CARD.description}</p>
          </div>
        </div>

        {!done ? (
          <div className="mt-md flex flex-col gap-sm">
            {REMINDER_DESIGN_STEPS.map((s, i) => {
              const isDone = i < displayStep
              const isActive = i === displayStep
              return (
                <span key={s.id} className="inline-flex items-center gap-xs text-body">
                  {isDone ? (
                    <Icon name="check_circle" size={18} className="shrink-0 text-accent-positive" />
                  ) : isActive ? (
                    <Icon name="hourglass_top" size={18} className="animate-pulse shrink-0 text-chip-warning-text" />
                  ) : (
                    <Icon name="radio_button_unchecked" size={18} className="shrink-0 text-text-tertiary" />
                  )}
                  <span className={isDone || isActive ? 'text-text-primary' : 'text-text-tertiary'}>{s.label}</span>
                </span>
              )
            })}
          </div>
        ) : !collapsed ? (
          <div className="agent-build-fade mt-lg">
            <ReminderDraftReviewContent
              openProcedureName={openProcedureName}
              onOpenProcedure={onOpenProcedure}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ReminderDraftReviewContent({
  openProcedureName,
  onOpenProcedure,
}: {
  openProcedureName: string | null
  onOpenProcedure: (name: string) => void
}) {
  const reminderCallPressed = openProcedureName === REMINDER_CALL_PROCEDURE_NAME

  return (
    <>
      <DraftReviewSection label="What it does">
        <p className="text-body leading-6 text-text-primary">
          Runs a reminder journey for every booked appointment — email and text at 3 weeks and 1 week out, then a
          confirmation check at 2 days with a phone call for anyone unconfirmed.
        </p>
      </DraftReviewSection>

      <DraftReviewSection label="The journey — tap any step to open it, or open the full workflow view">
        <ol className="flex list-decimal flex-col gap-sm pl-lg text-body leading-6 text-text-primary">
          <li>
            <span className="text-text-primary">Starts when an appointment is booked</span>
            <span className="text-text-secondary">
              {' '}
              — any location (you can filter by location, provider, or appointment type later)
            </span>
          </li>
          <li>
            <span className="text-text-primary">3 weeks before</span>
            <span className="text-text-secondary"> → </span>
            <Icon name="mail" size={16} className="inline-block align-text-bottom text-text-icon" />
            <span className="text-text-secondary"> email + </span>
            <Icon name="sms" size={16} className="inline-block align-text-bottom text-text-icon" />
            <span className="text-text-secondary">
              {' '}
              text — written from your template, reply-CONFIRM + parking link kept
            </span>
          </li>
          <li>
            <span className="text-text-primary">1 week before</span>
            <span className="text-text-secondary"> → </span>
            <Icon name="mail" size={16} className="inline-block align-text-bottom text-text-icon" />
            <span className="text-text-secondary"> email + </span>
            <Icon name="sms" size={16} className="inline-block align-text-bottom text-text-icon" />
            <span className="text-text-secondary"> text</span>
          </li>
          <li>
            <span className="text-text-primary">Wait</span>
            <span className="text-text-secondary"> until 2 days before</span>
          </li>
          <li>
            <span className="text-text-primary">Confirmed?</span>
            <span className="text-text-secondary"> → Yes: journey ends. No: </span>
            <Icon name="call" size={16} className="inline-block align-text-bottom text-text-icon" />
            <span className="text-text-secondary"> call the patient (within calling window)</span>
          </li>
          <li>
            <span className="text-text-primary">Call outcomes:</span>
            <ul className="mt-sm list-disc space-y-sm pl-lg text-body leading-6">
              <li>
                <span className="text-text-primary">Answered</span>
                <span className="text-text-secondary"> → runs the </span>
                <button
                  type="button"
                  aria-pressed={reminderCallPressed}
                  onClick={() => onOpenProcedure(REMINDER_CALL_PROCEDURE_NAME)}
                  className={`mx-xs inline-flex align-middle ${
                    reminderCallPressed ? 'ring-1 ring-border-selected rounded-full' : ''
                  }`}
                >
                  <RefChip kind="procedure" label={REMINDER_CALL_PROCEDURE_LABEL} />
                </button>
                <span className="text-text-secondary">
                  {' '}
                  starting procedure (tap to read — confirm / cancel / reschedule → warm handoff to your Front
                  desk agent / human handoff on request; never discusses clinical questions)
                </span>
              </li>
              <li>
                <span className="text-text-primary">Declined</span>
                <span className="text-text-secondary"> → wait 2 hours → one follow-up text</span>
              </li>
              <li>
                <span className="text-text-primary">Missed</span>
                <span className="text-text-secondary"> → wait 2 hours → one follow-up text</span>
              </li>
              <li>
                <span className="text-text-primary">Voicemail</span>
                <span className="text-text-secondary">
                  {' '}
                  → short message with callback number + the same text
                </span>
              </li>
            </ul>
          </li>
          <li>
            <span className="text-text-primary">At any point:</span>
            <span className="text-text-secondary">
              {' '}
              a confirmation, cancellation, or reschedule stops the journey. A reschedule restarts it against the
              new date.
            </span>
          </li>
        </ol>
      </DraftReviewSection>

      <DraftReviewSection label="Tools it uses">
        <div className="flex flex-col gap-xs">
          {['Email & text reminders', 'Voice calling', 'Front desk agent handoff'].map((tool) => (
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
    </>
  )
}

/** Full beat after the user picks a mid-call reschedule option. Owns its own
 *  Thoughts → reply → pills sequence so it always runs when mounted. */
function ReminderAfterRescheduleBeat({
  connectAnswer,
  connectAttachments,
  openProcedureName,
  onConnectAnswer,
  onOpenProcedure,
  onHandoffReplyDone,
  onEmailThoughtsDone,
  onBuildDone,
  onViewWorkflow,
  onSaveAgent,
  onMakeChanges,
  onSuppressAutoScroll,
  workflowVisible = false,
}: {
  connectAnswer: string
  connectAttachments: AttachItem[]
  openProcedureName: string | null
  onConnectAnswer: (answer: string) => void
  onOpenProcedure: (name: string) => void
  onHandoffReplyDone: () => void
  onEmailThoughtsDone: () => void
  onBuildDone?: () => void
  onViewWorkflow?: () => void
  onSaveAgent?: () => void
  onMakeChanges?: () => void
  onSuppressAutoScroll: () => void
  workflowVisible?: boolean
}) {
  const [thoughtsOpen, setThoughtsOpen] = useState(true)
  const [replyReady, setReplyReady] = useState(false)
  const [replyDone, setReplyDone] = useState(false)
  const [emailThoughtsOpen, setEmailThoughtsOpen] = useState(true)
  const [emailThoughtsDone, setEmailThoughtsDone] = useState(false)
  const [buildReplyDone, setBuildReplyDone] = useState(false)
  const [buildDone, setBuildDone] = useState(false)
  const [postDraftAnswer, setPostDraftAnswer] = useState('')
  const continues = Boolean(connectAnswer) && !connectAnswer.startsWith('No')
  const hasEmailAttachment = connectAttachments.length > 0
  const handoffDoneRef = useRef(false)
  const emailDoneRef = useRef(false)

  const handlePostDraftAnswer = (label: string) => {
    if (label === 'View in agent builder') {
      onViewWorkflow?.()
      return
    }
    setPostDraftAnswer(label)
    if (label === 'Save agent') onSaveAgent?.()
    else if (label === 'Make changes') onMakeChanges?.()
  }

  return (
    <>
      <CreateAgentThinkingPanel
        open={thoughtsOpen}
        onToggle={() => {
          onSuppressAutoScroll()
          setThoughtsOpen((prev) => !prev)
        }}
        onComplete={() => {
          setThoughtsOpen(false)
          setReplyReady(true)
        }}
        text={REMINDER_AFTER_HANDOFF_THOUGHTS_TEXT}
        fast
      />
      {replyReady && (
        <ReminderHandoffFollowUp
          onComplete={() => {
            setReplyDone(true)
            if (!handoffDoneRef.current) {
              handoffDoneRef.current = true
              onHandoffReplyDone()
            }
          }}
        />
      )}
      {replyDone && !connectAnswer && (
        <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
          {REMINDER_CONNECT_PILLS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onConnectAnswer(label)}
              className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {replyDone && (
        <MessageActions
          className="ml-3xl"
          copyText={REMINDER_HANDOFF_REPLY_PARAGRAPHS.join('\n\n')}
        />
      )}
      {connectAnswer && <UserBubble>{connectAnswer}</UserBubble>}
      {connectAttachments.length > 0 && <UserDocsMessage files={connectAttachments} />}
      {continues && (
        <CreateAgentThinkingPanel
          open={emailThoughtsOpen}
          onToggle={() => {
            onSuppressAutoScroll()
            setEmailThoughtsOpen((prev) => !prev)
          }}
          onComplete={() => {
            setEmailThoughtsOpen(false)
            setEmailThoughtsDone(true)
            if (!emailDoneRef.current) {
              emailDoneRef.current = true
              onEmailThoughtsDone()
            }
          }}
          text={
            hasEmailAttachment
              ? REMINDER_AFTER_EMAIL_THOUGHTS_TEXT
              : REMINDER_READY_TO_BUILD_THOUGHTS_TEXT
          }
          fast
        />
      )}
      {continues && emailThoughtsDone && (
        <>
          <ReminderBuildReply
            hasEmailAttachment={hasEmailAttachment}
            onComplete={() => setBuildReplyDone(true)}
          />
          {buildReplyDone && (
            <>
              <MessageActions
                className="ml-3xl"
                copyText={
                  hasEmailAttachment ? REMINDER_BUILD_REPLY_WITH_EMAIL : REMINDER_BUILD_REPLY_DEFAULT
                }
              />
              <ReminderBuildingCard
                persisted={buildDone}
                onViewWorkflow={onViewWorkflow}
                openProcedureName={openProcedureName}
                onOpenProcedure={onOpenProcedure}
                workflowVisible={workflowVisible}
                onDone={() => {
                  setBuildDone(true)
                  onBuildDone?.()
                }}
              />
              {buildDone && (
                <ReminderPostDraftFollowUp
                  answer={postDraftAnswer}
                  onAnswer={handlePostDraftAnswer}
                  hideViewWorkflow={workflowVisible}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

// Reasoning shown right after John attaches his documents (before the reply).
const CREATE_AGENT_DOCS_THOUGHTS_TEXT = `Three inputs:
• 612 transcripts containing evidence of jobs + handling
• Insurance FAQ, Knowledge base the agent should answer from
• Front desk SOP, Brand guidelines with behavior/tone/escalation rules

612 transcripts is a large batch — analysis will take a while (est. 10–15 min). I'll kick off background analysis, show honest progress, I'll treat the SOP as instructions (do's/don'ts, escalation), the FAQ as a knowledge source the insurance procedure draws on, and the transcripts as evidence for which procedures to build.`

// Reasoning shown after the background build completes (post-build analysis).
const CREATE_AGENT_POST_BUILD_THOUGHTS_TEXT = `Clustering results:
• Booking — 41%
• Rescheduling — 19%
• Insurance questions — 17%
• Billing disputes — 11%
• Prescription refills — 7%
• Other — 5%
Booking/reschedule/insurance/billing all match what John asked for — good. But refills are 7% of calls and John didn't mention them. That's a gap worth flagging as a suggestion at review, not something I invent silently into the agent.

From the SOP: escalate billing disputes AND any caller who explicitly asks for a human; verify insurance eligibility before confirming a new-patient appointment; use warm, plain language; never give clinical advice. I'll encode the escalation rule as a hard behavior.

Tools needed: appointment scheduling, patient records (EHR) lookup, insurance verification, and a human-handoff/escalation. Checking the catalog:
• Scheduling
• EHR
• Insurance verification
• Escalation
All present — no missing integration for the four requested jobs. (If refills get added later, that would need a pharmacy tool, which isn't connected — I'll note that.)

Mandatory settings I still can't resolve: channels (voice implied, but web chat/text unconfirmed). Greeting, consent, voice, language, locations — I'll default and flag.`

const CREATE_AGENT_DOCS_REPLY_PARAGRAPHS = [
  "Got it — 612 transcripts, your insurance FAQ, and your front-desk SOP. I'll:",
  '• Use the transcripts to learn what your callers ask for and how you handle it,',
  '• Treat the SOP as your rules for tone and when to escalate,',
  '• And let the agent answer insurance questions from your FAQ.',
  "CALLOUT: This might take 10–15 minutes. No need to wait — close this whenever, and I'll notify you when your draft is ready.",
]

/** Pre-filled into the composer when John clicks the box after being asked for docs. */
const DEMO_DOCS_ATTACHMENTS: AttachItem[] = [
  { id: 'docs-transcripts', kind: 'file', label: 'call-transcripts (612).zip' },
  { id: 'docs-faq', kind: 'file', label: 'insurance-faq.pdf' },
  { id: 'docs-sop', kind: 'file', label: 'front-desk-SOP.pdf' },
]

function GhostwriterDocsReply({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={CREATE_AGENT_DOCS_REPLY_PARAGRAPHS}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

const CALLER_JOB_BREAKDOWN = [
  { id: 'book', label: 'Book an appointment', pct: '41%' },
  { id: 'reschedule', label: 'Reschedule an appointment', pct: '19%' },
  { id: 'insurance', label: 'Insurance questions', pct: '17%' },
  { id: 'billing', label: 'Billing disputes', pct: '11%' },
  { id: 'refills', label: 'Prescription refills', pct: '7%' },
  { id: 'other', label: 'Other', pct: '5%' },
] as const

const CREATE_AGENT_DRAFT_READY_INTRO = [
  "I finished reading all 612 transcripts. Here's what I found:",
]

const CREATE_AGENT_DRAFT_READY_CLOSING = [
  "One thing I noticed: about 7% of your calls are prescription refill requests — you didn't mention those, so I left them out. Want me to add a refill procedure too?",
]

function GhostwriterDraftReadyReply({ onComplete }: { onComplete?: () => void }) {
  const [stage, setStage] = useState<'intro' | 'list' | 'closing' | 'done'>('intro')

  useEffect(() => {
    if (stage !== 'list') return
    const t = window.setTimeout(() => setStage('closing'), 200)
    return () => window.clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'done') return
    onComplete?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={CREATE_AGENT_DRAFT_READY_INTRO}
          onDone={() => setStage('list')}
        />

        {(stage === 'list' || stage === 'closing' || stage === 'done') && (
          <div className="agent-build-fade flex flex-col gap-sm">
            <p className="text-body text-text-primary">What your callers actually ask for:</p>
            <ul className="flex flex-col gap-sm">
              {CALLER_JOB_BREAKDOWN.map((job) => (
                <li key={job.id} className="flex items-start gap-sm text-body text-text-secondary">
                  <span className="shrink-0 text-[18px] leading-6" aria-hidden>
                    •
                  </span>
                  <span>
                    {job.label} — <span className="text-text-primary">{job.pct}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(stage === 'closing' || stage === 'done') && (
          <TypedParagraphs
            fast
            paragraphs={CREATE_AGENT_DRAFT_READY_CLOSING}
            onDone={() => setStage('done')}
          />
        )}
      </div>
    </div>
  )
}

// Built live when John opts to add a refill procedure. Must match a procedure
// name in HC_PROCEDURES so the card can open it in the preview panel.
const REFILL_PROCEDURE_NAME = FRONT_DESK_DRAFT_REFILL_PROCEDURE

const CREATE_AGENT_REFILL_THOUGHTS_TEXT = `Refills are 7% of calls — worth building. A typical refill call: a patient says "I need a refill on my lisinopril." The agent has to identify the patient, pull the prescription from the EHR, confirm the medication and pharmacy, then route the refill to the prescriber for approval — it can't approve refills itself.

The blocker: this needs a pharmacy / e-prescribe integration, which isn't connected yet. So I'll build the procedure with the right steps and tool references, but flag the pharmacy tool as "needs connection" so it's clear this can't go live until someone wires it up. Guardrails stay intact — never give dosage or clinical advice, and controlled substances always go to a human.`

const CREATE_AGENT_REVIEW_THOUGHTS_TEXT = `The review cleanly separates "you told me" vs "I defaulted" so nothing mandatory is hidden. Publishing isn't blocked. I'll let John test before he commits — testing must run every tool in mock mode so no real appointment gets booked.`

const FRONTDESK_POST_DRAFT_REPLY =
  'I have created a Front desk agent for you to answer inbound calls, book and reschedule appointments, answer basic insurance questions, and hand off anything about billing disputes to a human.'

const FRONTDESK_POST_DRAFT_PILLS = [
  "Yes, that's right",
  'Make changes',
  'Test agent',
  'View in agent builder',
] as const

const CREATE_AGENT_REFILL_REPLY_PARAGRAPHS = [
  "On it — building the refill procedure now. Here's how it'll work:",
  '• Identify the patient and pull their prescription from the EHR,',
  '• Confirm the medication, the dosage on file, and their pharmacy,',
  '• Send the refill to the prescriber for approval — the agent never approves it itself,',
  '• Escalate controlled substances or anything unusual to a human.',
  "WARN: I've flagged the pharmacy / e-prescribe integration as not connected — the procedure is built and ready, but someone needs to connect that tool before it can go live.",
]

function GhostwriterRefillReply({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={CREATE_AGENT_REFILL_REPLY_PARAGRAPHS}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

// Reasoning + reply after John asks to edit the greeting and test the booking flow.
const CREATE_AGENT_TEST_THOUGHTS_TEXT = `Two things:
• Edit the greeting — a settings change, low-risk, no downstream effects
• Run a mock-mode test of booking

I'll apply the greeting, confirm it, then launch the test with the scheduler + EHR + insurance tools all in mock mode, clearly labeled as test mode so John never mistakes a simulated booking for a real one.`

// Simulated booking transcript loaded into the test preview when John clicks its input box.
const CREATE_AGENT_TEST_TRANSCRIPT: { role: 'system' | 'agent' | 'user'; text: string }[] = [
  { role: 'system', text: 'Test mode — simulated tools, no real actions' },
  { role: 'agent', text: 'Thank you for calling Riverside Family Clinic, this is Ava. How can I help?' },
  { role: 'user', text: "Hi, I'd like to book a physical for next week." },
  { role: 'agent', text: "I'd be happy to help. Are you an existing patient with us, or is this your first visit?" },
  { role: 'user', text: 'Existing patient, John Doe, date of birth 4/12/1985.' },
  {
    role: 'system',
    text: 'Test trace — agent invoked Patient records (EHR) in mock mode → returned a plausible match (John Doe, active patient). No real record was read. Next it checks availability via the Appointment scheduler (mock).',
  },
  {
    role: 'agent',
    text: 'Thanks, John — I found your record. I have openings next Tuesday at 9:40am or Thursday at 2:15pm for a physical. Which works?',
  },
  { role: 'user', text: 'Thursday works.' },
  {
    role: 'agent',
    text: "You're all set for a physical Thursday at 2:15pm. You'll get a text confirmation shortly. Anything else?",
  },
]

const CREATE_AGENT_TEST_REPLY_PARAGRAPHS = [
  'Updated the greeting to: "Thank you for calling Riverside Family Clinic, this is Ava. How can I help?"',
  "Now let's test the booking flow. I'll run the agent in Test mode — all tools are simulated, so no real appointment is booked and no real text is sent. Go ahead and talk to it like you're a caller.",
]

function GhostwriterTestReply({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
      <div className="flex flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        <TypedParagraphs
          fast
          paragraphs={CREATE_AGENT_TEST_REPLY_PARAGRAPHS}
          onDone={onComplete}
        />
      </div>
    </div>
  )
}

function DraftReviewSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <p className="text-small text-text-tertiary">{label}</p>
      {children}
    </div>
  )
}

// Ordered checklist for the background build; each completes on a timer.
const BUILD_STEPS = [
  { id: 'reading', label: 'Reading transcripts — 612 of 612' },
  { id: 'clustering', label: 'Clustering caller requests into jobs' },
  { id: 'drafting', label: 'Drafting procedures from your SOP and FAQ' },
  { id: 'tools', label: 'Configuring tools' },
  { id: 'integrations', label: 'Checking for integrations' },
]

// Rotating "agent is working" status lines that flow while the build runs.
const BUILD_ACTIVITY_MESSAGES = [
  'Analyzing appointment-booking calls…',
  'Identifying rescheduling patterns…',
  'Extracting answers from your insurance FAQ…',
  'Mapping escalation rules from your SOP…',
  'Drafting the appointment-booking procedure…',
  'Drafting the insurance-questions procedure…',
  'Wiring up scheduling and CRM tools…',
  'Checking for calendar and phone integrations…',
]

// Live background-build progress: checklist completes step-by-step, a flowing
// status line rotates, and an estimated time counts down. Fires onComplete when
// every step is done. When persisted, keeps the completed checklist visible.
function BuildingProgressPanel({
  onComplete,
  continuation = false,
  persisted = false,
}: {
  onComplete?: () => void
  continuation?: boolean
  persisted?: boolean
}) {
  const [step, setStep] = useState(0)
  const [activity, setActivity] = useState(0)
  const done = persisted || step >= BUILD_STEPS.length

  useEffect(() => {
    if (persisted) return
    if (step >= BUILD_STEPS.length) {
      const t = window.setTimeout(() => onComplete?.(), 300)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 850)
    return () => window.clearTimeout(t)
  }, [step, persisted, onComplete])

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => {
      setActivity((a) => (a + 1) % BUILD_ACTIVITY_MESSAGES.length)
    }, 500)
    return () => window.clearInterval(id)
  }, [done])

  const displayStep = persisted ? BUILD_STEPS.length : step
  const minutesRemaining = Math.max(1, BUILD_STEPS.length - displayStep)

  return (
    <div className={`agent-build-fade flex flex-col gap-md ${continuation ? 'mt-md' : 'mt-3xl'}`}>
      <p className="text-body leading-6">
        {/* Bold title is an explicit request from the design, overriding §6.6 here. */}
        <span className="font-medium text-text-primary">Building your Front desk agent</span>
        <span className="text-text-secondary"> · you can leave — I'll notify you when it's ready</span>
      </p>

      <div className="flex flex-col gap-sm">
        {BUILD_STEPS.map((s, i) => {
          const isDone = i < displayStep
          const isActive = i === displayStep && !done
          return (
            <span key={s.id} className="inline-flex items-center gap-xs text-body">
              {isDone ? (
                <Icon name="check_circle" size={18} className="shrink-0 text-accent-positive" />
              ) : isActive ? (
                <Icon name="hourglass_top" size={18} className="animate-pulse shrink-0 text-chip-warning-text" />
              ) : (
                <Icon name="radio_button_unchecked" size={18} className="shrink-0 text-text-tertiary" />
              )}
              <span className={isDone || isActive ? 'text-text-primary' : 'text-text-tertiary'}>{s.label}</span>
            </span>
          )
        })}
      </div>

      {!done && (
        <div className="flex items-center gap-xs text-small text-text-secondary">
          <Icon name="progress_activity" size={14} className="animate-spin text-text-icon" />
          <span>{BUILD_ACTIVITY_MESSAGES[activity]}</span>
        </div>
      )}

      {!persisted && (
        <p className="text-small italic text-text-tertiary">
          {done ? 'Wrapping up…' : `~ ${minutesRemaining} minutes remaining`}
        </p>
      )}
    </div>
  )
}

/** Final Front desk draft build — Reminder-style card that morphs from checklist → draft review. */
function FrontdeskBuildingCard({
  refillAdded,
  onDone,
  persisted = false,
  onViewWorkflow,
  openProcedureName,
  onOpenProcedure,
  workflowVisible = false,
}: {
  refillAdded: boolean
  onDone?: () => void
  persisted?: boolean
  onViewWorkflow?: () => void
  openProcedureName: string | null
  onOpenProcedure: (name: string) => void
  workflowVisible?: boolean
}) {
  const steps = DRAFT_BUILD_STATUS_LABELS.map((label, i) => ({ id: `fd-draft-${i}`, label }))
  const [step, setStep] = useState(persisted ? steps.length : 0)
  const completedRef = useRef(false)
  const done = persisted || step >= steps.length
  const displayStep = persisted ? steps.length : step

  useEffect(() => {
    if (persisted) return
    if (done) {
      if (!completedRef.current) {
        completedRef.current = true
        const t = window.setTimeout(() => onDone?.(), 200)
        return () => window.clearTimeout(t)
      }
      return
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 320)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done, persisted])

  return (
    <div className="agent-build-fade mt-3xl flex flex-col gap-md">
      <p className="text-body leading-6">
        {done ? (
          <span className="font-medium text-text-primary">Front desk agent draft is ready</span>
        ) : (
          <span className="inline-flex items-center gap-xs">
            <span className="font-medium text-text-primary">Creating the front desk agent</span>
            <span className="inline-flex items-center gap-px" aria-hidden>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="animate-pulse size-1 rounded-full bg-text-tertiary"
                  style={{ animationDelay: `${dot * 0.15}s` }}
                />
              ))}
            </span>
          </span>
        )}
      </p>

      <div className="rounded-md border border-border bg-surface p-lg">
        <div className="flex items-start gap-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-sm">
              <div className="flex min-w-0 items-center gap-sm">
                <span className="text-body text-text-primary">{FRONTDESK_BUILD_CARD.title}</span>
                {done && (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                    Draft
                  </span>
                )}
              </div>
              {done && !workflowVisible && (
                <button
                  type="button"
                  onClick={onViewWorkflow}
                  className="shrink-0 rounded-sm text-body text-text-action hover:underline"
                >
                  View in agent builder
                </button>
              )}
            </div>
            <p className="mt-xs text-small text-text-secondary">{FRONTDESK_BUILD_CARD.description}</p>
          </div>
        </div>

        {!done ? (
          <div className="mt-md flex flex-col gap-sm">
            {steps.map((s, i) => {
              const isDone = i < displayStep
              const isActive = i === displayStep
              return (
                <span key={s.id} className="inline-flex items-center gap-xs text-body">
                  {isDone ? (
                    <Icon name="check_circle" size={18} className="shrink-0 text-accent-positive" />
                  ) : isActive ? (
                    <Icon name="hourglass_top" size={18} className="animate-pulse shrink-0 text-chip-warning-text" />
                  ) : (
                    <Icon name="radio_button_unchecked" size={18} className="shrink-0 text-text-tertiary" />
                  )}
                  <span className={isDone || isActive ? 'text-text-primary' : 'text-text-tertiary'}>{s.label}</span>
                </span>
              )
            })}
          </div>
        ) : (
          <div className="agent-build-fade mt-lg">
            <FrontDeskDraftReviewContent
              refillAdded={refillAdded}
              openProcedureName={openProcedureName}
              onOpenProcedure={onOpenProcedure}
            />
          </div>
        )}
      </div>
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

// Rotating status shown before the Thoughts panel / agent reply on first send.
const INTRO_STATUS_LABELS = [
  'Thinking',
  'Analyzing your prompt',
  'Understanding what you are asking for',
  'Understanding user requirements',
  'Synthesizing information',
]

// Rotating status labels shown before each later agent response lands.
// ~1.6s each.
const STEP_THINKING_LABELS: Partial<Record<CreatePhase, string[]>> = {
  'ask-jobs': [
    'Analyzing your documents',
    'Understanding user requirements',
    'Synthesizing information',
  ],
  'ask-confirm-create': [
    'Thinking',
    'Analyzing your selections',
    'Synthesizing information',
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
  const isReminderCall = procedure.name === REMINDER_CALL_PROCEDURE_NAME
  const visibleContext = procedure.context.slice(0, 4)
  const moreContext = isReminderCall
    ? 25
    : Math.max(0, procedure.context.length - visibleContext.length)
  const bodyScrollRef = useRef<HTMLDivElement | null>(null)
  useSubtleScrollbar(bodyScrollRef)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="[&>div]:!p-xl">
        <RHSSidePanelHeader
          title={procedure.name}
          onPreview={undefined}
          onClose={onClose}
          showActions={false}
          showMoreMenu={false}
        />
      </div>

      <div
        ref={bodyScrollRef}
        className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-2xl overflow-y-auto px-xl pb-3xl pt-xl"
      >
        <div className="flex flex-col gap-sm">
          <p className="text-small text-text-secondary">
            When to use this procedure? <span className="text-chip-danger-text">*</span>
          </p>
          <p className="text-body leading-6 text-text-primary">{procedure.whenToUse}</p>
        </div>

        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-small text-text-secondary">
            Context
            <InfoTooltip text="Uses your brand voice, industry knowledge, to generate accurate responses" />
          </div>
          <div className="flex flex-col gap-sm">
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
            <InfoTooltip text="Information your agent can refer to during a conversation, like your location details, knowledge base, and connected files" />
          </div>
          <div className="flex flex-col gap-md">
            {procedure.steps.map((step, stepIndex) => (
              <div key={step.title} className="flex flex-col gap-sm">
                <p className="text-body text-text-primary">
                  {stepIndex + 1}. {step.title}
                </p>
                {step.bullets.length > 0 && (
                  <ul className="flex list-disc flex-col gap-sm pl-lg">
                    {step.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="marker:text-text-secondary">
                        <ProcedureStepTokens tokens={bullet.tokens} />
                      </li>
                    ))}
                  </ul>
                )}
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
export function CreateAiGhostwriterShellHeader({
  title,
  onBack,
  onViewAgentBuilder,
  viewAgentBuilderDisabled = false,
  showDraftBadge = true,
}: {
  title: string
  onBack: () => void
  onViewAgentBuilder: () => void
  viewAgentBuilderDisabled?: boolean
  /** Hide until a draft agent has been created in the co-pilot flow. */
  showDraftBadge?: boolean
}) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-sm bg-surface px-2xl">
      <div className="flex w-full items-center justify-between gap-md">
        <div className="flex min-w-0 max-w-[720px] items-center gap-xs">
          <button
            type="button"
            onClick={onBack}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            aria-label="Back"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <h1 className="min-w-0 truncate text-h3 text-text-primary">{title}</h1>
          {showDraftBadge && (
            <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
              Draft
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onViewAgentBuilder}
          disabled={viewAgentBuilderDisabled}
          className="flex h-9 shrink-0 items-center rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-tertiary disabled:hover:bg-surface"
        >
          View agent builder
        </button>
      </div>
    </div>
  )
}

/** Fullscreen existing-agent Create with AI — shares trail with docked AI Builder panel. */
function ExistingAgentCompactHelp({
  agentKey,
  greeting,
  quickStarts,
}: {
  agentKey: string
  greeting: string
  quickStarts: { label: string; prompt: string }[]
}) {
  const [prompt, setPrompt] = useState('')
  const { trail, send, hasMessages } = useAiBuilderTrail(agentKey)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [trail.length])

  const handleSend = (text?: string) => {
    const value = (text ?? prompt).trim()
    if (!value) return
    send(value)
    setPrompt('')
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 justify-center gap-xl self-stretch pr-sm">
      <div className="flex h-full min-h-0 w-full min-w-0 max-w-[720px] flex-col">
        <div
          ref={scrollRef}
          className={`scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto pb-md ${
            hasMessages ? '' : 'justify-end'
          }`}
        >
          {!hasMessages ? (
            <div className="flex items-start gap-sm">
              <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                <SparkleLoader size={14} spinning={false} />
              </span>
              <div className="flex min-w-0 flex-col items-start gap-md">
                <p className="text-body leading-6 text-text-primary">{greeting}</p>
                <div className="flex flex-col items-start gap-sm">
                  {quickStarts.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleSend(option.prompt)}
                      className="flex h-8 items-center rounded-sm border border-border-selected bg-surface px-[10px] text-left text-body text-text-primary hover:bg-surface-l2"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-lg pt-md">
              {trail.map((turn, i) => {
                if (turn.kind === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary whitespace-pre-wrap">
                        {turn.text}
                      </span>
                    </div>
                  )
                }
                if (turn.kind === 'agent') {
                  return (
                    <div key={i} className="flex items-start gap-sm">
                      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                        <SparkleLoader size={14} spinning={false} />
                      </span>
                      <p className="min-w-0 flex-1 text-body leading-6 text-text-primary whitespace-pre-wrap">
                        {(turn.paragraphs || []).join('\n')}
                      </p>
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>

        <div className="z-10 flex shrink-0 flex-col gap-md bg-surface pb-sm pt-md">
          <PromptComposer
            value={prompt}
            onChange={setPrompt}
            onSend={() => handleSend()}
            placeholder="What would you like to do?"
          />
        </div>
      </div>
    </div>
  )
}

function CreateFlowPageHeader({
  onBack,
  title,
  centered = false,
  inlineProcedureOpen = false,
}: {
  onBack: () => void
  title: string
  centered?: boolean
  inlineProcedureOpen?: boolean
}) {
  const row = (
    <div className="flex w-full min-w-0 max-w-[720px] items-center gap-xs">
      <button
        type="button"
        onClick={onBack}
        className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        aria-label="Back"
      >
        <Icon name="arrow_back" size={20} />
      </button>
      <h1 className="min-w-0 truncate text-h3 text-text-primary">{title}</h1>
    </div>
  )

  if (centered) {
    return (
      <div className="flex h-16 shrink-0 justify-center bg-surface px-lg">
        <div className="flex h-full w-full max-w-[1600px] justify-center gap-xl pr-sm">
          {inlineProcedureOpen && (
            <div className="hidden w-[480px] min-w-0 shrink-[999] lg:block" aria-hidden />
          )}
          {row}
          {inlineProcedureOpen && (
            <div className="hidden w-[500px] shrink-0 lg:block" aria-hidden />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-16 shrink-0 items-center gap-sm bg-surface px-2xl">
      {row}
    </div>
  )
}

export function HealthcareFrontdeskCreateAgentScreen({
  onCreateFromScratch,
  onSelectFromLibrary,
  onCreateAgent,
  onViewWorkflow,
  onBack,
  onSubmittedChange,
  pageTitle,
  hideHeaderBack = false,
  libraryCards,
  initialPrompt,
  autoStart = false,
  historyChatId = null,
  historyChat = null,
  fromScratchLabel = 'Setup manually',
  variant = 'frontdesk',
  workflowVisible = false,
  compactGreeting = false,
  existingAgent = false,
  onDraftReady,
  onCanvasProcedureChange,
  onInlineProcedureOpenChange,
  canvasProcedureId = null,
}: {
  onCreateFromScratch: () => void
  onSelectFromLibrary: (templateId: string) => void
  onCreateAgent?: (options?: { publish?: boolean; chat?: ChatHistoryTranscript }) => void
  onViewWorkflow?: () => void
  onBack?: () => void
  onSubmittedChange?: (submitted: boolean) => void
  pageTitle?: string
  /** Hides the in-column back arrow when the shell header already provides navigation. */
  hideHeaderBack?: boolean
  libraryCards?: CreateLibraryCard[]
  initialPrompt?: string
  /** Auto-sends `initialPrompt` on mount instead of waiting for the user — used to "reopen" a recent chat. */
  autoStart?: boolean
  /** When set, shows a static past transcript for this recent-chat id (no thinking / typing). */
  historyChatId?: string | null
  /** Full transcript for a recent/saved chat — preferred over looking up by id. */
  historyChat?: ChatHistoryTranscript | null
  fromScratchLabel?: string
  variant?: 'frontdesk' | 'reminder' | 'review-response' | 'review-generation'
  workflowVisible?: boolean
  /** Docked panel / pre-submit fullscreen — greeting + quick-start pills instead of library landing. */
  compactGreeting?: boolean
  /** Already-built agent — help-oriented greeting + contextual follow-ups. */
  existingAgent?: boolean
  /** Fires when the reminder draft card finishes building (name) or the flow resets (null). */
  onDraftReady?: (name: string | null) => void
  /** When the workflow canvas is open, procedure clicks open the canvas RHS instead of an inline preview. */
  onCanvasProcedureChange?: (name: string | null) => void
  /** Keeps the full-page header aligned when an inline procedure panel is open. */
  onInlineProcedureOpenChange?: (open: boolean) => void
  /** Mirrors the canvas RHS procedure so closing the panel clears the chat pressed state. */
  canvasProcedureId?: string | null
}) {
  const isReminderFlow = variant === 'reminder'
  const resolvedHistoryChat =
    historyChat ??
    (historyChatId
      ? (isReminderFlow ? REMINDER_CHAT_HISTORY : FRONTDESK_CHAT_HISTORY).find((c) => c.id === historyChatId) ?? null
      : null)

  useEffect(() => {
    if (!resolvedHistoryChat) return
    onSubmittedChange?.(true)
    onDraftReady?.(resolvedHistoryChat.draftTitle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedHistoryChat?.id])

  // Past chats render a static transcript — keep this before live-flow hooks via a child.
  if (resolvedHistoryChat) {
    return (
      <HistoryChatReplay
        chat={resolvedHistoryChat}
        onBack={onBack}
        pageTitle={pageTitle}
        hideHeaderBack={hideHeaderBack}
      />
    )
  }

  return (
    <HealthcareFrontdeskCreateAgentLive
      onCreateFromScratch={onCreateFromScratch}
      onSelectFromLibrary={onSelectFromLibrary}
      onCreateAgent={onCreateAgent}
      onViewWorkflow={onViewWorkflow}
      onBack={onBack}
      onSubmittedChange={onSubmittedChange}
      pageTitle={pageTitle}
      hideHeaderBack={hideHeaderBack}
      libraryCards={libraryCards}
      initialPrompt={initialPrompt}
      autoStart={autoStart}
      fromScratchLabel={fromScratchLabel}
      variant={variant}
      workflowVisible={workflowVisible}
      compactGreeting={compactGreeting}
      existingAgent={existingAgent}
      onDraftReady={onDraftReady}
      onCanvasProcedureChange={onCanvasProcedureChange}
      onInlineProcedureOpenChange={onInlineProcedureOpenChange}
      canvasProcedureId={canvasProcedureId}
    />
  )
}

function HealthcareFrontdeskCreateAgentLive({
  onCreateFromScratch,
  onSelectFromLibrary,
  onCreateAgent,
  onViewWorkflow,
  onBack,
  onSubmittedChange,
  pageTitle,
  hideHeaderBack = false,
  libraryCards,
  initialPrompt,
  autoStart = false,
  fromScratchLabel = 'Setup manually',
  variant = 'frontdesk',
  workflowVisible = false,
  compactGreeting = false,
  existingAgent = false,
  onDraftReady,
  onCanvasProcedureChange,
  onInlineProcedureOpenChange,
  canvasProcedureId = null,
}: {
  onCreateFromScratch: () => void
  onSelectFromLibrary: (templateId: string) => void
  onCreateAgent?: (options?: { publish?: boolean; chat?: ChatHistoryTranscript }) => void
  onViewWorkflow?: () => void
  onBack?: () => void
  onSubmittedChange?: (submitted: boolean) => void
  pageTitle?: string
  hideHeaderBack?: boolean
  libraryCards?: CreateLibraryCard[]
  initialPrompt?: string
  autoStart?: boolean
  fromScratchLabel?: string
  variant?: 'frontdesk' | 'reminder' | 'review-response' | 'review-generation'
  workflowVisible?: boolean
  compactGreeting?: boolean
  existingAgent?: boolean
  onDraftReady?: (name: string | null) => void
  onCanvasProcedureChange?: (name: string | null) => void
  onInlineProcedureOpenChange?: (open: boolean) => void
  canvasProcedureId?: string | null
}) {
  const isReminderFlow = variant === 'reminder'
  const isReviewFlow = variant === 'review-response'
  const isReviewGenFlow = variant === 'review-generation'
  const [prompt, setPrompt] = useState('')
  const [landingAttachments, setLandingAttachments] = useState<AttachItem[]>([])
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const [filesModalOpen, setFilesModalOpen] = useState(false)
  const landingImageInputRef = useRef<HTMLInputElement | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const rotatingPlaceholders = isReviewFlow
    ? REVIEW_RESPONSE_PLACEHOLDERS
    : isReminderFlow
      ? REMINDER_PLACEHOLDERS
      : variant === 'frontdesk'
        ? FRONTDESK_PLACEHOLDERS
        : null
  const landingPlaceholder = rotatingPlaceholders
    ? rotatingPlaceholders[placeholderIndex % rotatingPlaceholders.length]
    : DEFAULT_CREATE_PLACEHOLDER
  const { typed: typedPlaceholder, done: placeholderTyped } = useTypewriter(
    rotatingPlaceholders ? landingPlaceholder : '',
    { charsPerTick: 1, intervalMs: 28 },
  )
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
  const [introStatusIndex, setIntroStatusIndex] = useState(0)
  const [thinkingOpen, setThinkingOpen] = useState(true)
  const [introReplyReady, setIntroReplyReady] = useState(false)
  const [introReplyDone, setIntroReplyDone] = useState(false)
  const [timingAnswer, setTimingAnswer] = useState('')
  const [timingThoughtsOpen, setTimingThoughtsOpen] = useState(true)
  const [timingFollowReady, setTimingFollowReady] = useState(false)
  const [timingFollowDone, setTimingFollowDone] = useState(false)
  const [rescheduleAnswer, setRescheduleAnswer] = useState('')
  const [handoffFollowDone, setHandoffFollowDone] = useState(false)
  const [connectAnswer, setConnectAnswer] = useState('')
  const [connectAttachments, setConnectAttachments] = useState<AttachItem[]>([])
  const [emailThoughtsDone, setEmailThoughtsDone] = useState(false)
  const [reminderBuildDone, setReminderBuildDone] = useState(false)
  const [docsThoughtsOpen, setDocsThoughtsOpen] = useState(true)
  const [docsReplyReady, setDocsReplyReady] = useState(false)
  const [docsReplyDone, setDocsReplyDone] = useState(false)
  const [docsBuildComplete, setDocsBuildComplete] = useState(false)
  const [docsPostBuildThoughtsOpen, setDocsPostBuildThoughtsOpen] = useState(true)
  const [docsDraftReady, setDocsDraftReady] = useState(false)
  const [docsDraftReadyDone, setDocsDraftReadyDone] = useState(false)
  const [refillAnswer, setRefillAnswer] = useState('')
  const [refillThoughtsOpen, setRefillThoughtsOpen] = useState(true)
  const [refillReplyReady, setRefillReplyReady] = useState(false)
  const [refillReplyDone, setRefillReplyDone] = useState(false)
  const [refillProcedureCreated, setRefillProcedureCreated] = useState(false)
  const [createAgentAnswer, setCreateAgentAnswer] = useState('')
  const [draftBuildReady, setDraftBuildReady] = useState(false)
  const [reviewThoughtsOpen, setReviewThoughtsOpen] = useState(true)
  const [reviewThoughtsDone, setReviewThoughtsDone] = useState(false)
  const [reviewFollowUpAnswer, setReviewFollowUpAnswer] = useState('')
  const [testThoughtsOpen, setTestThoughtsOpen] = useState(true)
  const [testReplyReady, setTestReplyReady] = useState(false)
  const [testReplyDone, setTestReplyDone] = useState(false)
  const [stepThinkingPhase, setStepThinkingPhase] = useState<CreatePhase | null>(null)
  const [stepThinkingIndex, setStepThinkingIndex] = useState(0)
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([])
  const [openProcedureName, setOpenProcedureName] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // The header row's spacer (which keeps the 720px chat column centered) needs to
  // reserve the same width whenever EITHER the inline procedure panel OR the
  // Test-agent preview panel occupies the RHS slot — they share the same visual slot.
  useEffect(() => {
    onInlineProcedureOpenChange?.((Boolean(openProcedureName) || previewOpen) && !workflowVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProcedureName, previewOpen, workflowVisible])

  const handleOpenProcedure = (name: string | null) => {
    setOpenProcedureName(name)
    if (!onCanvasProcedureChange) return
    // Full-page conversation → inline procedure panel beside the chat.
    // Workflow canvas open → procedure opens on the canvas RHS instead.
    if (workflowVisible) onCanvasProcedureChange(name)
    else onCanvasProcedureChange(null)
  }

  // If the canvas opens while a procedure is already selected in chat, mirror it to the RHS.
  useEffect(() => {
    if (!onCanvasProcedureChange) return
    if (workflowVisible && openProcedureName) {
      onInlineProcedureOpenChange?.(false)
      onCanvasProcedureChange(openProcedureName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowVisible])

  // Closing the canvas RHS clears the pressed procedure chip in chat.
  useEffect(() => {
    if (!onCanvasProcedureChange || !workflowVisible) return
    if (canvasProcedureId === null && openProcedureName) {
      setOpenProcedureName(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasProcedureId, workflowVisible])
  const [previewActive, setPreviewActive] = useState(false)
  const [previewSessionEnded, setPreviewSessionEnded] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [showTestFollowUp, setShowTestFollowUp] = useState(false)
  const [testAgentAnswers, setTestAgentAnswers] = useState<string[]>([])
  const hadPreviewSessionRef = useRef(false)
  const previewActiveRef = useRef(false)
  const [loaderIndex, setLoaderIndex] = useState<number | null>(null)
  const [followUp, setFollowUp] = useState('')
  const [reviewComposerFill, setReviewComposerFill] = useState<string | null>(null)
  const [reviewPendingAnswer, setReviewPendingAnswer] = useState('')
  const [reviewThreadBusy, setReviewThreadBusy] = useState(true)
  const [reviewThreadTrail, setReviewThreadTrail] = useState<CreateChatTurn[]>([])
  const [attachments, setAttachments] = useState<AttachItem[]>([])
  const threadRef = useRef<HTMLDivElement | null>(null)
  const threadScrollRef = useRef<HTMLDivElement | null>(null)
  const [threadOverflowing, setThreadOverflowing] = useState(false)
  // "Scroll to latest" should only show once the user has actually scrolled away
  // from the bottom — not just whenever the thread is tall enough to overflow.
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  // When true, the auto-follow ResizeObserver ignores height changes. Set briefly
  // whenever the user manually toggles a Thoughts panel so opening/closing it
  // never moves the page.
  const suppressAutoScrollRef = useRef(false)
  const reviewPromptFilledRef = useRef(false)
  const timingPromptFilledRef = useRef(false)
  const emailPromptFilledRef = useRef(false)
  const suppressAutoScrollBriefly = () => {
    suppressAutoScrollRef.current = true
    window.setTimeout(() => {
      suppressAutoScrollRef.current = false
    }, 400)
  }

  const building = loaderIndex !== null
  const stepThinking = stepThinkingPhase !== null
  const previewLocksComposer = previewOpen && !previewSessionEnded
  const connectAnswerContinues = Boolean(connectAnswer) && !connectAnswer.startsWith('No')
  const reminderGenerating =
    isReminderFlow &&
    (introThinking ||
      !introReplyDone ||
      (Boolean(timingAnswer) && !timingFollowDone) ||
      (Boolean(rescheduleAnswer) && !handoffFollowDone) ||
      (connectAnswerContinues && !reminderBuildDone))
  const reviewGenerating =
    isReviewFlow && (introThinking || !introReplyReady || reviewThreadBusy)
  const composerLocked = building || stepThinking || previewLocksComposer || reminderGenerating || reviewGenerating
  const composerPlaceholder = previewLocksComposer
    ? previewActive
      ? 'Test in progress...'
      : 'Test preview open...'
    : 'Ask me anything'

  const handlePreviewActiveChange = (active: boolean) => {
    previewActiveRef.current = active
    setPreviewActive(active)
    if (active) {
      hadPreviewSessionRef.current = true
      setPreviewSessionEnded(false)
    }
  }

  const handlePreviewSessionEnded = () => {
    setPreviewSessionEnded(true)
    setShowTestFollowUp(true)
  }

  const handlePreviewClose = () => {
    previewActiveRef.current = false
    setPreviewOpen(false)
    setPreviewActive(false)
    setPreviewSessionEnded(false)
  }

  const saveCreatedAgent = (options?: { publish?: boolean }) => {
    const draftTitle = isReviewFlow
      ? (agentName || REVIEW_RESPONSE_BUILD_CARD.title)
      : isReminderFlow
        ? (agentName || REMINDER_BUILD_CARD.title)
        : (agentName || FRONTDESK_BUILD_CARD.title)
    const draftDescription = isReviewFlow
      ? REVIEW_RESPONSE_BUILD_CARD.description
      : isReminderFlow
        ? REMINDER_BUILD_CARD.description
        : FRONTDESK_BUILD_CARD.description
    onCreateAgent?.({
      ...options,
      chat: buildSavedCreateChat({
        variant: isReminderFlow ? 'reminder' : 'frontdesk',
        prompt,
        draftTitle,
        draftDescription,
        docsAnswer,
        docsFileLabels: docsAttachments.map((f) => f.label),
        docsProvided,
        docsBuildComplete,
        docsDraftReadyDone,
        refillAnswer,
        refillProcedureCreated,
        createAgentAnswer,
        draftBuildReady,
        reviewFollowUpAnswer,
        testReplyDone,
        testAgentAnswers,
        timingAnswer,
        timingFollowDone,
        rescheduleAnswer,
        connectAnswer,
        connectFileLabels: connectAttachments.map((f) => f.label),
        reminderBuildDone,
      }),
    })
  }

  const handleStartTestAgent = (label = 'Test agent') => {
    setTestAgentAnswers((prev) => [...prev, label])
    handleOpenProcedure(null)
    setShowTestFollowUp(false)
    setPreviewSessionEnded(false)
    hadPreviewSessionRef.current = false
    previewActiveRef.current = false
    setPreviewActive(false)
    setPreviewKey((k) => k + 1)
    setPreviewOpen(true)
  }

  const resetCreateFlow = () => {
    setSubmitted(false)
    onSubmittedChange?.(false)
    onDraftReady?.(null)
    setPhase('ask-docs')
    setPrompt('')
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
    setIntroThinking(false)
    setIntroStatusIndex(0)
    setThinkingOpen(true)
    setIntroReplyReady(false)
    setIntroReplyDone(false)
    setTimingAnswer('')
    setTimingThoughtsOpen(true)
    setTimingFollowReady(false)
    setTimingFollowDone(false)
    setRescheduleAnswer('')
    setHandoffFollowDone(false)
    setConnectAnswer('')
    setConnectAttachments([])
    setEmailThoughtsDone(false)
    setReminderBuildDone(false)
    timingPromptFilledRef.current = false
    emailPromptFilledRef.current = false
    setReviewComposerFill(null)
    setReviewPendingAnswer('')
    setReviewThreadBusy(true)
    setReviewThreadTrail([])
    setDocsThoughtsOpen(true)
    setDocsReplyReady(false)
    setDocsReplyDone(false)
    setDocsBuildComplete(false)
    setDocsPostBuildThoughtsOpen(true)
    setDocsDraftReady(false)
    setDocsDraftReadyDone(false)
    setRefillAnswer('')
    setRefillThoughtsOpen(true)
    setRefillReplyReady(false)
    setRefillReplyDone(false)
    setRefillProcedureCreated(false)
    setCreateAgentAnswer('')
    setDraftBuildReady(false)
    setReviewThoughtsOpen(true)
    setReviewThoughtsDone(false)
    setReviewFollowUpAnswer('')
    setTestThoughtsOpen(true)
    setTestReplyReady(false)
    setTestReplyDone(false)
    reviewPromptFilledRef.current = false
    setStepThinkingPhase(null)
    handleOpenProcedure(null)
    setPreviewOpen(false)
    setPreviewActive(false)
    setPreviewSessionEnded(false)
    setShowTestFollowUp(false)
    setTestAgentAnswers([])
    hadPreviewSessionRef.current = false
    previewActiveRef.current = false
    setFollowUp('')
  }

  // Keep the docked AI Builder panel in sync with this create-flow transcript.
  useEffect(() => {
    if (!submitted) return
    const draftKey = isReviewFlow
      ? agentName || REVIEW_RESPONSE_BUILD_CARD.title
      : isReminderFlow
        ? agentName || REMINDER_BUILD_CARD.title
        : agentName || FRONTDESK_BUILD_CARD.title

    if (isReviewFlow) {
      const trail: CreateChatTurn[] = []
      const trimmed = prompt.trim()
      if (trimmed) trail.push({ kind: 'user', text: trimmed })
      trail.push({ kind: 'thoughts', text: REVIEW_RESPONSE_CREATE_THOUGHTS_TEXT })
      trail.push(...reviewThreadTrail)
      setCreateAiDraftTrail(draftKey, trail)
      return
    }

    if (isReviewGenFlow) return

    const trail = buildCreateChatTrail({
      variant: isReminderFlow ? 'reminder' : 'frontdesk',
      prompt,
      draftTitle: draftKey,
      draftDescription: isReminderFlow
        ? REMINDER_BUILD_CARD.description
        : FRONTDESK_BUILD_CARD.description,
      docsAnswer,
      docsFileLabels: docsAttachments.map((f) => f.label),
      docsProvided,
      docsBuildComplete,
      docsDraftReadyDone,
      refillAnswer,
      refillProcedureCreated,
      createAgentAnswer,
      draftBuildReady,
      reviewFollowUpAnswer,
      testReplyDone,
      testAgentAnswers,
      timingAnswer,
      timingFollowDone,
      rescheduleAnswer,
      connectAnswer,
      connectFileLabels: connectAttachments.map((f) => f.label),
      reminderBuildDone,
    })
    setCreateAiDraftTrail(draftKey, trail)
  }, [
    submitted,
    isReviewFlow,
    isReminderFlow,
    isReviewGenFlow,
    agentName,
    prompt,
    reviewThreadTrail,
    docsAnswer,
    docsAttachments,
    docsProvided,
    docsBuildComplete,
    docsDraftReadyDone,
    refillAnswer,
    refillProcedureCreated,
    createAgentAnswer,
    draftBuildReady,
    reviewFollowUpAnswer,
    testReplyDone,
    testAgentAnswers,
    timingAnswer,
    timingFollowDone,
    rescheduleAnswer,
    connectAnswer,
    connectAttachments,
    reminderBuildDone,
  ])

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
    const scrollEl = threadScrollRef.current
    if (!thread || !scrollEl) return
    const measure = () => setThreadOverflowing(scrollEl.scrollHeight > scrollEl.clientHeight + 4)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(thread)
    observer.observe(scrollEl)
    return () => observer.disconnect()
  }, [submitted])

  // Track whether the user has scrolled away from the bottom, so the chevron only
  // appears once there's actually somewhere to scroll back down to.
  useEffect(() => {
    const scrollEl = threadScrollRef.current
    if (!scrollEl) return
    const handleScroll = () => {
      const distanceFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight
      setIsScrolledUp(distanceFromBottom > 40)
    }
    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [submitted])

  useEffect(() => {
    if (!rotatingPlaceholders || !placeholderTyped) return
    const id = window.setTimeout(() => {
      setPlaceholderIndex((i) => (i + 1) % rotatingPlaceholders.length)
    }, 2200)
    return () => window.clearTimeout(id)
  }, [rotatingPlaceholders, placeholderTyped, placeholderIndex])

  // Auto-follow: while the conversation is actively being generated (loaders and
  // typed text keep growing the thread), keep it pinned to the bottom. Manual
  // Thoughts toggles set suppressAutoScrollRef so they never move the page.
  useEffect(() => {
    const thread = threadRef.current
    const scrollEl = threadScrollRef.current
    if (!thread || !scrollEl) return
    let prevHeight = thread.scrollHeight
    const obs = new ResizeObserver(() => {
      const height = thread.scrollHeight
      const grew = height > prevHeight + 1
      prevHeight = height
      if (grew && !suppressAutoScrollRef.current) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      }
    })
    obs.observe(thread)
    return () => obs.disconnect()
  }, [submitted])

  useEffect(() => {
    if (!introThinking) return
    setIntroStatusIndex(0)
    let i = 0
    const rotateMs = 450
    const rotate = window.setInterval(() => {
      i += 1
      if (i >= INTRO_STATUS_LABELS.length) {
        window.clearInterval(rotate)
        setIntroThinking(false)
      } else {
        setIntroStatusIndex(i)
      }
    }, rotateMs)
    return () => window.clearInterval(rotate)
  }, [introThinking, isReminderFlow, isReviewFlow])


  useEffect(() => {
    if (stepThinkingPhase === null) return
    const labels = STEP_THINKING_LABELS[stepThinkingPhase] ?? []
    const timer = setTimeout(() => {
      if (stepThinkingIndex < labels.length - 1) {
        setStepThinkingIndex(stepThinkingIndex + 1)
      } else {
        setStepThinkingPhase(null)
      }
    }, 500)
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
    }, 1600)
    return () => clearTimeout(timer)
  }, [loaderIndex])

  // Hold on the "Creating the procedure…" loader before revealing the card.
  useEffect(() => {
    if (!refillReplyDone || refillProcedureCreated) return
    const timer = setTimeout(() => setRefillProcedureCreated(true), 900)
    return () => clearTimeout(timer)
  }, [refillReplyDone, refillProcedureCreated])

  // Keep the latest agent response in view: scroll the conversation to the
  // bottom whenever a new message, loader row, or answer is rendered.
  useEffect(() => {
    if (!submitted) return
    const scrollEl = threadScrollRef.current
    if (!scrollEl) return
    const raf = requestAnimationFrame(() => {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(raf)
  }, [
    // NOTE: thinkingOpen / docsPostBuildThoughtsOpen are intentionally excluded —
    // manually expanding/collapsing a Thoughts panel must NOT move the page. The
    // ResizeObserver below handles auto-scroll while content is being generated.
    submitted,
    phase,
    introThinking,
    introStatusIndex,
    introReplyReady,
    introReplyDone,
    docsReplyReady,
    docsReplyDone,
    docsBuildComplete,
    docsDraftReady,
    docsDraftReadyDone,
    refillAnswer,
    refillReplyReady,
    refillReplyDone,
    refillProcedureCreated,
    createAgentAnswer,
    draftBuildReady,
    reviewThoughtsDone,
    reviewFollowUpAnswer,
    testReplyReady,
    testReplyDone,
    stepThinkingPhase,
    stepThinkingIndex,
    loaderIndex,
    agentName,
    docsAnswer,
    confirmCreateAnswer,
    jobsAnswer,
    showTestFollowUp,
    testAgentAnswers,
    timingAnswer,
    timingFollowReady,
    timingFollowDone,
    rescheduleAnswer,
    handoffFollowDone,
    connectAnswer,
    connectAttachments,
    emailThoughtsDone,
    reminderBuildDone,
  ])

  const startConversation = (text: string) => {
    if (!text.trim()) return
    // Review generation create: landing send opens the agent builder (no scripted chat yet).
    if (isReviewGenFlow) {
      onCreateFromScratch()
      return
    }
    setPrompt(text)
    setSubmitted(true)
    onSubmittedChange?.(true)
    setPhase('ask-docs')
    setIntroThinking(true)
  }

  const handleSend = () => startConversation(prompt)

  useEffect(() => {
    if (autoStart && initialPrompt) startConversation(initialPrompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startBuilding = () => {
    setPhase('summary')
    setLoaderIndex(null)
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

  // Docs path: after the background build finishes, persist steps then show post-build thinking.
  const handleDocsBuildComplete = () => {
    setDocsBuildComplete(true)
  }

  const handlePostBuildThinkingComplete = () => {
    setDocsPostBuildThoughtsOpen(false)
    setAgentName((prev) => prev || 'Front desk agent')
    setSelectedProcedures(RECOMMENDED_PROCEDURES.slice(0, 4).map((p) => p.name))
    setDocsDraftReady(true)
  }

  const toggleJob = (id: string) => {
    setSelectedJobs((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]))
  }

  const confirmSelectedJobs = () => {
    if (selectedJobs.length === 0) return
    const titles = JOB_OPTIONS.filter((job) => selectedJobs.includes(job.id)).map((job) => job.title)
    setJobsAnswerPills(titles)
    setJobsAnswer(titles.join(', '))
    advanceWithThinking('ask-confirm-create')
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const canSendFollowUp =
    isReminderFlow && handoffFollowDone && !connectAnswer
      ? Boolean(followUp.trim() || attachments.length > 0)
      : isReviewFlow
        ? Boolean(followUp.trim() && reviewComposerFill && !reviewThreadBusy)
        : phase === 'ask-docs'
          ? Boolean(followUp.trim() || attachments.length > 0)
          : Boolean(followUp.trim())

  const handleFollowUpSend = () => {
    if (!canSendFollowUp || building || introThinking || stepThinking || previewLocksComposer || reminderGenerating) return
    // Reminder create flow: capture scripted replies as chat bubbles, then continue.
    if (isReminderFlow) {
      if (introReplyDone && !timingAnswer && followUp.trim()) {
        setTimingAnswer(followUp.trim())
        setFollowUp('')
        return
      }
      if (handoffFollowDone && !connectAnswer && (followUp.trim() || attachments.length > 0)) {
        setConnectAnswer(followUp.trim() || 'Yes, correct')
        setConnectAttachments([...attachments])
        setAttachments([])
        setFollowUp('')
      }
      return
    }
    // Review response create flow: send composer text into the thread's current question.
    if (isReviewFlow) {
      if (!reviewComposerFill || reviewThreadBusy || !followUp.trim()) return
      setReviewPendingAnswer(followUp.trim())
      setFollowUp('')
      return
    }
    // After the draft review, further messages are just logged to the thread.
    if (reviewThoughtsDone) {
      if (followUp.trim()) setReviewFollowUpAnswer(followUp.trim())
      setFollowUp('')
      return
    }
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
      <div className="relative flex h-full min-h-0 w-full flex-1 justify-center gap-xl self-stretch pr-sm">
        <style>{`
          .agent-build-fade { animation: agent-build-fade-in 0.15s ease-out; }
          @keyframes agent-build-fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
          @keyframes sparkle-twinkle {
            0%, 100% { transform: scale(0.85) rotate(-8deg); opacity: 0.6; }
            50%      { transform: scale(1.15) rotate(8deg); opacity: 1; }
          }
          .sparkle-twinkle { animation: sparkle-twinkle 1.1s ease-in-out infinite; }
          @keyframes sim-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-5px); opacity: 1; }
          }
          /* Like/dislike/copy row stays hidden until its turn (.chat-turn, marking either the
             message's own row or an ancestor wrapping it) is hovered, or the row itself is
             hovered/focused — covers both sibling- and nested-actions-row placements. */
          .chat-turn:hover ~ .msg-actions-row,
          .chat-turn:hover .msg-actions-row,
          .msg-actions-row:hover,
          .msg-actions-row:focus-within {
            opacity: 1;
          }
          @keyframes thoughts-caret {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
          .thoughts-caret { animation: thoughts-caret 0.9s step-end infinite; }
        `}</style>

        {/* Spacer mirrors the right panel's width so the chat stays centered on
            wide screens, but collapses first (shrink-[999]) on narrow ones so the
            chat keeps its width and the panel stays pinned to the right edge.
            When the workflow canvas is open, procedures open on the canvas RHS instead. */}
        {((openProcedureName || previewOpen) && !workflowVisible) && (
          <div className="hidden w-[480px] min-w-0 shrink-[999] lg:block" aria-hidden />
        )}

        <div className="flex h-full min-h-0 w-full min-w-0 max-w-[720px] flex-col">
        <div
          ref={threadScrollRef}
          className="scrollbar-none min-h-0 flex-1 overflow-y-auto"
        >
        <div ref={threadRef} className="flex flex-col pb-md">
        {pageTitle && !hideHeaderBack && (
          <div className="sticky top-0 z-20 mb-md flex h-16 shrink-0 items-center gap-sm bg-surface">
            {!hideHeaderBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                aria-label="Back"
              >
                <Icon name="arrow_back" size={20} />
              </button>
            )}
            <h1 className="min-w-0 truncate text-h3 text-text-primary">{pageTitle}</h1>
            <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
              Draft
            </span>
          </div>
        )}
        <div className="flex justify-end pt-md">
          <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary">{prompt.trim()}</span>
        </div>

        {introThinking ? (
          <IntroThinkingLoaderRow />
        ) : (
          <>
            <CreateAgentThinkingPanel
              open={thinkingOpen}
              onToggle={() => {
                suppressAutoScrollBriefly()
                setThinkingOpen((prev) => !prev)
              }}
              onComplete={() => {
                setThinkingOpen(false)
                setIntroReplyReady(true)
              }}
              text={
                isReviewFlow
                  ? REVIEW_RESPONSE_CREATE_THOUGHTS_TEXT
                  : isReminderFlow
                    ? REMINDER_CREATE_THOUGHTS_TEXT
                    : CREATE_AGENT_THOUGHTS_TEXT
              }
              fast
            />

            {introReplyReady && (
              isReviewFlow ? (
                <ReviewResponseThread
                  onDraftReady={(name) => {
                    if (name) setAgentName(name)
                    onDraftReady?.(name)
                  }}
                  onCreateAgent={() => saveCreatedAgent()}
                  onViewWorkflow={onViewWorkflow}
                  onMakeChanges={resetCreateFlow}
                  workflowVisible={workflowVisible}
                  suppressAutoScrollBriefly={suppressAutoScrollBriefly}
                  pendingAnswer={reviewPendingAnswer}
                  onPendingAnswerConsumed={() => setReviewPendingAnswer('')}
                  onComposerFillChange={setReviewComposerFill}
                  onBusyChange={setReviewThreadBusy}
                  onTrailChange={setReviewThreadTrail}
                />
              ) : isReminderFlow ? (
                <>
                  <ReminderCreateIntroReply onComplete={() => setIntroReplyDone(true)} />
                  {introReplyDone && !timingAnswer && (
                    <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
                      <button
                        type="button"
                        onClick={() => setTimingAnswer('Yes correct')}
                        className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                      >
                        Yes correct
                      </button>
                    </div>
                  )}
                  {introReplyDone && (
                    <MessageActions
                      copyText={REMINDER_CREATE_INTRO_PARAGRAPHS.join('\n\n')}
                      className="ml-3xl"
                    />
                  )}
                  {timingAnswer && <UserBubble>{timingAnswer}</UserBubble>}
                  {timingAnswer && (
                    <>
                      <CreateAgentThinkingPanel
                        open={timingThoughtsOpen}
                        onToggle={() => {
                          suppressAutoScrollBriefly()
                          setTimingThoughtsOpen((prev) => !prev)
                        }}
                        onComplete={() => {
                          setTimingThoughtsOpen(false)
                          setTimingFollowReady(true)
                        }}
                        text={REMINDER_AFTER_TIMING_THOUGHTS_TEXT}
                        fast
                      />
                      {timingFollowReady && (
                        <ReminderCadenceFollowUp
                          openProcedureName={openProcedureName}
                          onOpenProcedure={handleOpenProcedure}
                          onComplete={() => setTimingFollowDone(true)}
                        />
                      )}
                      {timingFollowDone && !rescheduleAnswer && (
                        <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
                          {REMINDER_RESCHEDULE_PILLS.map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setRescheduleAnswer(label)}
                              className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                      {timingFollowDone && (
                        <MessageActions
                          className="ml-3xl"
                          copyText={[
                            ...REMINDER_CADENCE_REPLY_PARAGRAPHS,
                            ...REMINDER_RESCHEDULE_QUESTION_PARAGRAPHS.map((line) =>
                              line.replace(/^•\s*/, ''),
                            ),
                          ].join('\n\n')}
                        />
                      )}
                      {rescheduleAnswer && <UserBubble>{rescheduleAnswer}</UserBubble>}
                      {rescheduleAnswer && (
                        <ReminderAfterRescheduleBeat
                          key={rescheduleAnswer}
                          connectAnswer={connectAnswer}
                          connectAttachments={connectAttachments}
                          openProcedureName={openProcedureName}
                          onConnectAnswer={setConnectAnswer}
                          onOpenProcedure={handleOpenProcedure}
                          onHandoffReplyDone={() => setHandoffFollowDone(true)}
                          onEmailThoughtsDone={() => setEmailThoughtsDone(true)}
                          onBuildDone={() => {
                            setReminderBuildDone(true)
                            setAgentName(REMINDER_BUILD_CARD.title)
                            onDraftReady?.(REMINDER_BUILD_CARD.title)
                          }}
                          onViewWorkflow={onViewWorkflow}
                          onSaveAgent={() => saveCreatedAgent()}
                          onMakeChanges={resetCreateFlow}
                          onSuppressAutoScroll={suppressAutoScrollBriefly}
                          workflowVisible={workflowVisible}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <CreateAgentIntroReply onComplete={() => setIntroReplyDone(true)} />
                  {introReplyDone && <MessageActions copyText={CREATE_AGENT_INTRO_PARAGRAPHS.join('\n\n')} className="ml-3xl" />}
                </>
              )
            )}

            {!isReminderFlow && (docsAttachments.length > 0 ? (
              <UserDocsMessage files={docsAttachments} />
            ) : (
              docsAnswer && <UserBubble>{docsAnswer}</UserBubble>
            ))}

            {!isReminderFlow && stepThinkingPhase === 'ask-jobs' && (
              <AgentBuildLoaderRow />
            )}

            {!isReminderFlow && showStep('ask-jobs') && (
              <>
                {docsProvided && (
                  <>
                    <CreateAgentThinkingPanel
                      open={docsThoughtsOpen}
                      onToggle={() => {
                        suppressAutoScrollBriefly()
                        setDocsThoughtsOpen((prev) => !prev)
                      }}
                      onComplete={() => {
                        setDocsThoughtsOpen(false)
                        setDocsReplyReady(true)
                      }}
                      text={CREATE_AGENT_DOCS_THOUGHTS_TEXT}
                    />
                    {docsReplyReady && <GhostwriterDocsReply onComplete={() => setDocsReplyDone(true)} />}
                    {docsReplyDone && (
                      <div className="ml-3xl">
                        <BuildingProgressPanel
                          continuation
                          persisted={docsBuildComplete}
                          onComplete={handleDocsBuildComplete}
                        />
                      </div>
                    )}
                    {docsBuildComplete && (
                      <CreateAgentThinkingPanel
                        open={docsPostBuildThoughtsOpen}
                        onToggle={() => {
                          suppressAutoScrollBriefly()
                          setDocsPostBuildThoughtsOpen((prev) => !prev)
                        }}
                        onComplete={handlePostBuildThinkingComplete}
                        text={CREATE_AGENT_POST_BUILD_THOUGHTS_TEXT}
                      />
                    )}
                    {docsDraftReady && (
                      <GhostwriterDraftReadyReply onComplete={() => setDocsDraftReadyDone(true)} />
                    )}
                    {docsDraftReadyDone && !refillAnswer && (
                      <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
                        <button
                          type="button"
                          onClick={() => setRefillAnswer('Add procedure "Handling refills"')}
                          className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                        >
                          Add procedure &quot;Handling refills&quot;
                        </button>
                        <button
                          type="button"
                          className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                        >
                          Skip refills for now. Let&apos;s keep it to the four
                        </button>
                      </div>
                    )}
                    {docsDraftReadyDone && (
                      <MessageActions
                        className="ml-3xl"
                        copyText={[
                          ...CREATE_AGENT_DRAFT_READY_INTRO,
                          'What your callers actually ask for:',
                          ...CALLER_JOB_BREAKDOWN.map((j) => `• ${j.label} — ${j.pct}`),
                          ...CREATE_AGENT_DRAFT_READY_CLOSING.map((line) =>
                            line.replace(/^INDENT:\s*/, ''),
                          ),
                        ].join('\n')}
                      />
                    )}
                    {refillAnswer && <UserBubble>{refillAnswer}</UserBubble>}

                    {refillAnswer.startsWith('Add procedure') && (
                      <>
                        <CreateAgentThinkingPanel
                          open={refillThoughtsOpen}
                          onToggle={() => {
                            suppressAutoScrollBriefly()
                            setRefillThoughtsOpen((prev) => !prev)
                          }}
                          onComplete={() => {
                            setRefillThoughtsOpen(false)
                            setRefillReplyReady(true)
                          }}
                          text={CREATE_AGENT_REFILL_THOUGHTS_TEXT}
                        />
                        {refillReplyReady && (
                          <GhostwriterRefillReply onComplete={() => setRefillReplyDone(true)} />
                        )}
                        {refillReplyDone && !refillProcedureCreated && (
                          <div className="agent-build-fade ml-3xl mt-sm flex items-center gap-sm text-body text-text-secondary">
                            <SparkleLoader size={16} />
                            <span>Creating the procedure…</span>
                          </div>
                        )}
                        {refillProcedureCreated && (
                          <>
                            <div className="chat-turn ml-3xl flex flex-col gap-sm">
                              <p className="text-body leading-6 text-text-primary">
                                I've added the procedure to your library:
                              </p>
                              <button
                                type="button"
                                onClick={() => handleOpenProcedure(REFILL_PROCEDURE_NAME)}
                                aria-pressed={openProcedureName === REFILL_PROCEDURE_NAME}
                                className={`flex items-start gap-sm rounded-md border border-border px-md py-md text-left hover:bg-surface-hover ${
                                  openProcedureName === REFILL_PROCEDURE_NAME ? 'bg-surface-hover' : 'bg-surface'
                                }`}
                              >
                                <span className="flex h-6 shrink-0 items-center">
                                  <Icon name="menu_book" size={18} className="text-text-icon" />
                                </span>
                                <span className="min-w-0 flex-1 text-body leading-6">
                                  <span className="text-text-primary">{REFILL_PROCEDURE_NAME}</span>
                                  <span className="text-text-secondary">
                                    {' '}
                                    — routes refills to the prescriber for approval · flagged, needs a pharmacy
                                    integration before it can go live
                                  </span>
                                </span>
                                <span className="flex h-6 shrink-0 items-center">
                                  <Icon name="chevron_right" size={18} className="text-text-icon" />
                                </span>
                              </button>
                            </div>
                            <MessageActions
                              className="ml-3xl"
                              copyText={CREATE_AGENT_REFILL_REPLY_PARAGRAPHS.join('\n')}
                            />

                            <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
                              <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
                              <p className="flex-1 text-body leading-6 text-text-primary">
                                Now that I've created the procedure, I can go ahead and create the agent draft. Would
                                you like me to proceed?
                              </p>
                            </div>
                            {!createAgentAnswer && (
                              <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap gap-sm">
                                <button
                                  type="button"
                                  onClick={() => setCreateAgentAnswer('Yes, create the agent')}
                                  className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                                >
                                  Yes, create the agent
                                </button>
                                <button
                                  type="button"
                                  className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                                >
                                  Make changes
                                </button>
                              </div>
                            )}
                            {createAgentAnswer && <UserBubble>{createAgentAnswer}</UserBubble>}
                          </>
                        )}
                      </>
                    )}

                    {(refillAnswer.startsWith('Skip') || createAgentAnswer.startsWith('Yes')) && (
                      <>
                        <FrontdeskBuildingCard
                          refillAdded={refillAnswer.startsWith('Add procedure')}
                          persisted={draftBuildReady}
                          onViewWorkflow={onViewWorkflow}
                          workflowVisible={workflowVisible}
                          openProcedureName={openProcedureName}
                          onOpenProcedure={handleOpenProcedure}
                          onDone={() => {
                            setDraftBuildReady(true)
                            setAgentName(FRONTDESK_BUILD_CARD.title)
                            onDraftReady?.(FRONTDESK_BUILD_CARD.title)
                          }}
                        />
                        {draftBuildReady && (
                          <>
                        <CreateAgentThinkingPanel
                          open={reviewThoughtsOpen}
                          onToggle={() => {
                            suppressAutoScrollBriefly()
                            setReviewThoughtsOpen((prev) => !prev)
                          }}
                          onComplete={() => {
                            setReviewThoughtsOpen(false)
                            setReviewThoughtsDone(true)
                          }}
                          text={CREATE_AGENT_REVIEW_THOUGHTS_TEXT}
                        />
                        {reviewThoughtsDone && (
                          <>
                            <div className="chat-turn agent-build-fade mt-3xl flex gap-sm">
                              <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
                              <p className="flex-1 text-body leading-6 text-text-primary">
                                {FRONTDESK_POST_DRAFT_REPLY}
                              </p>
                            </div>
                            <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap items-center gap-sm">
                              {FRONTDESK_POST_DRAFT_PILLS.filter(
                                (label) => !(workflowVisible && label === 'View in agent builder'),
                              ).map((label) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() => {
                                    if (label === 'View in agent builder') onViewWorkflow?.()
                                    else if (label === 'Test agent') handleStartTestAgent()
                                  }}
                                  className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                                >
                                  {label === "Yes, that's right" ? (
                                    <>Yes, that&apos;s right</>
                                  ) : (
                                    label
                                  )}
                                </button>
                              ))}
                            </div>
                            {reviewFollowUpAnswer && (
                              <>
                                <UserBubble>{reviewFollowUpAnswer}</UserBubble>
                                <CreateAgentThinkingPanel
                                  open={testThoughtsOpen}
                                  onToggle={() => {
                                    suppressAutoScrollBriefly()
                                    setTestThoughtsOpen((prev) => !prev)
                                  }}
                                  onComplete={() => {
                                    setTestThoughtsOpen(false)
                                    setTestReplyReady(true)
                                  }}
                                  text={CREATE_AGENT_TEST_THOUGHTS_TEXT}
                                />
                                {testReplyReady && (
                                  <GhostwriterTestReply onComplete={() => setTestReplyDone(true)} />
                                )}
                                {testReplyDone && (
                                  <div className="agent-build-fade ml-3xl mt-sm flex flex-wrap items-center gap-sm">
                                    <button
                                      type="button"
                                      className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                                    >
                                      Make changes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStartTestAgent()}
                                      className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                                    >
                                      Test agent
                                    </button>
                                    {!workflowVisible && (
                                      <button
                                        type="button"
                                        onClick={onViewWorkflow}
                                        className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                                      >
                                        View in agent builder
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                {!docsProvided && (
                  <>
                <div className="chat-turn agent-build-fade mt-2xl flex flex-col gap-sm">
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

                <div className="chat-turn agent-build-fade mt-2xl flex flex-col gap-sm">
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
                <MessageActions
                  copyText={`Based on this analysis, here are a few use cases / jobs to be done that stood out.\n${JOB_OPTIONS.map((j) => `- ${j.title}`).join('\n')}`}
                />
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
              </>
            )}

            {!isReminderFlow && showStep('ask-confirm-create') && (phase === 'ask-confirm-create' || confirmCreateAnswer) && (
              <>
                <div className="chat-turn agent-build-fade mt-2xl flex flex-col gap-sm">
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
                        className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                      >
                        Not yet
                      </button>
                    </div>
                  )}
                </div>
                <MessageActions copyText="Can I go ahead and create an agent based on these use cases?" />
                {confirmCreateAnswer && <UserBubble>{confirmCreateAnswer}</UserBubble>}
              </>
            )}

            {!isReminderFlow && stepThinking && stepThinkingPhase && stepThinkingPhase !== 'ask-jobs' && (
              <AgentBuildLoaderRow />
            )}

            {!isReminderFlow && phase === 'summary' && (
              <div className="chat-turn agent-build-fade mt-2xl flex flex-col gap-md">
                {selectedProcedures.length > 0 && (
                  <div className="flex flex-col gap-sm">
                    <p className="text-body leading-6 text-text-primary">
                      I have built procedures based on your use cases:
                    </p>
                    {selectedProcedures.slice(0, 4).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleOpenProcedure(name)}
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
                    className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                  >
                    Yes, that's right
                  </button>
                  <button
                    type="button"
                    className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                  >
                    Make changes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartTestAgent()}
                    className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                  >
                    Test agent
                  </button>
                </div>

                <MessageActions
                  copyText={`${agentName} is ready to go. I've set up the basics based on what you described.`}
                />
              </div>
            )}

            {!isReminderFlow && testAgentAnswers.map((answer, i) => (
              <UserBubble key={`${answer}-${i}`}>{answer}</UserBubble>
            ))}

            {!isReminderFlow && showTestFollowUp && (
              <div className="chat-turn agent-build-fade mt-2xl flex flex-col gap-sm">
                <div className="flex gap-sm">
                  <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
                  <p className="flex-1 text-body leading-6 text-text-primary">
                    How did your agent perform? Was it able to get you desired test result? What would you like to do
                    next?
                  </p>
                </div>
                <div className="ml-3xl mt-sm flex items-center gap-sm">
                  <button
                    type="button"
                    className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                  >
                    Make changes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartTestAgent('Test agent again')}
                    className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                  >
                    Test agent again
                  </button>
                  <button
                    type="button"
                    onClick={() => saveCreatedAgent()}
                    className="flex h-9 items-center rounded-md border border-border bg-surface px-lg text-body text-text-primary hover:bg-surface-hover"
                  >
                    Save this agent
                  </button>
                </div>
                <MessageActions
                  className="ml-3xl"
                  copyText="How did your agent perform? Was it able to get you desired test result? What would you like to do next?"
                />
              </div>
            )}
          </>
        )}

        </div>
        </div>

        <div className="z-10 flex shrink-0 flex-col gap-md bg-surface pb-sm pt-md">
          {threadOverflowing && isScrolledUp && (
            <div className="flex justify-center">
              <button
                type="button"
                aria-label="Scroll to latest"
                onClick={() => threadScrollRef.current?.scrollTo({ top: threadScrollRef.current.scrollHeight, behavior: 'smooth' })}
                className="flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-icon hover:bg-surface-hover"
              >
                <Icon name="expand_more" size={18} />
              </button>
            </div>
          )}

          <PromptComposer
            value={followUp}
            onChange={setFollowUp}
            onSend={handleFollowUpSend}
            onFocus={() => {
              // Reminder create flow: after the agent asks about timing, click
              // the composer to pre-fill the scripted reply, then Enter to send.
              if (isReminderFlow && introReplyDone && !timingAnswer && !followUp.trim()) {
                timingPromptFilledRef.current = true
                setFollowUp(REMINDER_TIMING_REPLY)
                return
              }
              // After no-connect defaults: pre-fill the email tone reply.
              if (
                isReminderFlow &&
                handoffFollowDone &&
                !connectAnswer &&
                !followUp.trim()
              ) {
                emailPromptFilledRef.current = true
                setFollowUp(REMINDER_EMAIL_REPLY)
                return
              }
              // Front desk: after being asked for docs, click to attach the demo files.
              if (
                !isReminderFlow &&
                !isReviewFlow &&
                phase === 'ask-docs' &&
                introReplyDone &&
                attachments.length === 0
              ) {
                setAttachments(DEMO_DOCS_ATTACHMENTS)
                return
              }
              // Review response: click composer to pre-fill the current question's reply.
              if (isReviewFlow && reviewComposerFill && !followUp.trim() && !reviewThreadBusy) {
                setFollowUp(reviewComposerFill)
                return
              }
              // Once the draft review is done, clicking into the box pre-fills
              // John's next message so the demo can continue in one click.
              if (reviewThoughtsDone && !followUp && !reviewPromptFilledRef.current) {
                reviewPromptFilledRef.current = true
                setFollowUp(FINAL_REVIEW_PROMPT)
              }
            }}
            onClick={() => {
              if (isReminderFlow && introReplyDone && !timingAnswer && !followUp.trim()) {
                timingPromptFilledRef.current = true
                setFollowUp(REMINDER_TIMING_REPLY)
                return
              }
              if (
                isReminderFlow &&
                handoffFollowDone &&
                !connectAnswer &&
                !followUp.trim()
              ) {
                emailPromptFilledRef.current = true
                setFollowUp(REMINDER_EMAIL_REPLY)
                return
              }
              if (
                !isReminderFlow &&
                !isReviewFlow &&
                phase === 'ask-docs' &&
                introReplyDone &&
                attachments.length === 0
              ) {
                setAttachments(DEMO_DOCS_ATTACHMENTS)
                return
              }
              if (isReviewFlow && reviewComposerFill && !followUp.trim() && !reviewThreadBusy) {
                setFollowUp(reviewComposerFill)
              }
            }}
            rows={2}
            disabled={composerLocked}
            sendDisabled={!canSendFollowUp}
            placeholder={composerPlaceholder}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
            onAttach={(option) => {
              if (option === 'upload-image') landingImageInputRef.current?.click()
              else if (option === 'media-library') setMediaLibraryOpen(true)
              else if (option === 'files') setFilesModalOpen(true)
            }}
          />
        </div>
        </div>

        {/* Matches the panel's own width now that it's absolutely positioned (out of
            flex flow) — keeps the chat column centered exactly as it was when the
            panel still participated in this row's layout. */}
        {((openProcedureName || previewOpen) && !workflowVisible) && (
          <div className="hidden w-[500px] shrink-0 lg:block" aria-hidden />
        )}

        {((openProcedureName || previewOpen) && !workflowVisible) && (
          <div
            className={`absolute -top-10 bottom-2xl right-sm hidden w-[500px] overflow-hidden rounded-lg lg:block ${
              previewOpen ? 'border border-border bg-surface shadow-card' : ''
            }`}
          >
            {previewOpen ? (
              <div className="h-full">
                <div className="preview-panel-float-wrap !h-full !w-full !p-0 [&_.preview-panel]:!w-full [&_.preview-panel]:!rounded-none [&_.preview-panel]:!border-0 [&_.preview-panel]:!shadow-none [&_.preview-panel__header]:!h-[64px] [&_.preview-panel__header]:!px-xl [&_.preview-panel__header]:!py-0 [&_.preview-panel__title]:!text-[16px] [&_.preview-panel__title]:!font-normal [&_.preview-panel__title]:!leading-6 [&_.preview-panel__title]:![letter-spacing:-0.32px] [&_.preview-panel__title]:!text-[#212121] [&_.preview-panel__close-btn_.material-symbols-outlined]:![font-size:24px] [&_.preview-panel__close-btn]:!text-[#303030] [&_.preview-panel__body--outbound]:!p-xl">
                  <PreviewPanel
                    key={previewKey}
                    onClose={handlePreviewClose}
                    onPreviewActiveChange={handlePreviewActiveChange}
                    onSessionEnded={handlePreviewSessionEnded}
                    agentName={agentName || 'Front desk agent'}
                    showViewDetails={false}
                    showViewLogs={false}
                    scriptedTranscript={CREATE_AGENT_TEST_TRANSCRIPT}
                  />
                </div>
              </div>
            ) : (
              (() => {
                const procedure =
                  openProcedureName === REMINDER_CALL_PROCEDURE_NAME
                    ? REMINDER_CALL_PROCEDURE
                    : HC_PROCEDURES.find((p) => p.name === openProcedureName)
                if (!procedure) return null
                return (
                  <div className="h-full">
                    <ProcedurePreviewPanel procedure={procedure} onClose={() => handleOpenProcedure(null)} />
                  </div>
                )
              })()
            )}
          </div>
        )}

        <input
          ref={landingImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setAttachments((prev) => [...prev, { id: `image-${Date.now()}`, kind: 'file', label: file.name }])
            }
            e.target.value = ''
          }}
        />
        <MediaLibraryModal
          open={mediaLibraryOpen}
          onClose={() => setMediaLibraryOpen(false)}
          onDone={(selected) =>
            setAttachments((prev) => [
              ...prev,
              ...selected.map((f) => ({ id: f.id, kind: 'file' as const, label: f.label })),
            ])
          }
        />
        <FilesModal
          open={filesModalOpen}
          onClose={() => setFilesModalOpen(false)}
          onDone={(selected) =>
            setAttachments((prev) => [
              ...prev,
              ...selected.map((f) => ({ id: f.id, kind: 'file' as const, label: f.label })),
            ])
          }
        />
      </div>
    )
  }

  // Compact greeting + suggestion pills — Create with AI side panel / fullscreen expand.
  // The full-page create landing keeps the older "Build your agent" layout below.
  if (compactGreeting) {
    const reviewQuickStarts = [
      {
        label: 'Replying using templates',
        prompt:
          'Create a review response agent that replies to new reviews using approved response templates.',
      },
      {
        label: 'Replying autonomously',
        prompt:
          'Create a review response agent that drafts and posts replies to new reviews autonomously.',
      },
      {
        label: 'Replying after human approval',
        prompt:
          'Create a review response agent that drafts replies to new reviews and waits for human approval before posting.',
      },
      {
        label: 'Suggesting replies in dashboard',
        prompt:
          'Create a review response agent that suggests reply drafts in the dashboard for the team to send.',
      },
    ]
    const reminderQuickStarts = [
      { label: 'Appointment confirmation reminder', prompt: REMINDER_CREATE_PROMPT },
      {
        label: 'No-show risk agent',
        prompt:
          'Create an agent that identifies patients at high risk of missing appointments and uses additional reminders and a confirmation call.',
      },
      {
        label: 'Pre-visit reminder agent',
        prompt:
          'Create an agent that reminds patients about forms, fasting instructions, insurance cards, and other preparation before their visit.',
      },
      {
        label: 'Medication reminder agent',
        prompt:
          'Create an agent that sends recurring medication reminders and follows up when a patient misses or does not acknowledge a dose.',
      },
    ]
    const frontdeskQuickStarts = [
      {
        label: 'SMS and Webchat',
        prompt:
          'Create a Front desk agent that handles customer conversations over SMS and webchat using configured skills, procedures, and tools.',
      },
      {
        label: 'New patient intake',
        prompt:
          'Create a Front desk agent that guides new patients through intake, verifies insurance, and books the right appointment.',
      },
      {
        label: 'Patient scheduling',
        prompt:
          'Create a Front desk agent that finds patient records and books, reschedules, or cancels appointments.',
      },
    ]
    const existingReviewQuickStarts = [
      { label: 'Change reply tone', prompt: 'Change the reply tone for this review response agent.' },
      { label: 'Update escalation for negative reviews', prompt: 'Update how negative reviews are escalated for human approval.' },
      { label: 'Adjust which sources to watch', prompt: 'Adjust which review sources this agent should watch.' },
      { label: 'Add another location', prompt: 'Add another location to this review response agent.' },
    ]
    const existingReviewGenQuickStarts = [
      { label: 'Change request tone', prompt: 'Change the tone of review requests this agent sends.' },
      { label: 'Update send timing', prompt: 'Update when this agent sends review requests.' },
      { label: 'Adjust who receives requests', prompt: 'Adjust who receives review generation requests.' },
      { label: 'Add a follow-up nudge', prompt: 'Add a follow-up nudge when patients do not leave a review.' },
    ]
    const existingReminderQuickStarts = [
      { label: 'Change reminder timing', prompt: 'Change the reminder timing for this agent.' },
      { label: 'Update email, text, or call channels', prompt: 'Update which channels this reminder agent uses.' },
      { label: 'Adjust confirmation follow-up', prompt: 'Adjust how confirmation follow-up works for this reminder agent.' },
      { label: 'Skip reminders for certain visits', prompt: 'Skip reminders for certain visit types.' },
    ]
    const existingFrontdeskQuickStarts = [
      { label: 'Update call routing', prompt: 'Update call routing for this front desk agent.' },
      { label: 'Change the greeting', prompt: 'Change the greeting for this front desk agent.' },
      { label: 'Add a booking rule', prompt: 'Add a booking rule to this front desk agent.' },
      { label: 'Escalate more intents to a human', prompt: 'Escalate more intents to a human for this front desk agent.' },
    ]
    const buildQuickStarts = isReviewFlow || isReviewGenFlow
      ? reviewQuickStarts
      : isReminderFlow
        ? reminderQuickStarts
        : frontdeskQuickStarts
    const existingQuickStarts = isReviewGenFlow
      ? existingReviewGenQuickStarts
      : isReviewFlow
        ? existingReviewQuickStarts
        : isReminderFlow
          ? existingReminderQuickStarts
          : existingFrontdeskQuickStarts
    const quickStarts = existingAgent ? existingQuickStarts : buildQuickStarts
    const agentLabel = isReviewGenFlow
      ? 'Review generation'
      : isReviewFlow
        ? 'Review response'
        : isReminderFlow
          ? 'Reminder'
          : 'Front desk'
    const greetingName = pageTitle?.trim() || `${agentLabel} agent`
    const greeting = existingAgent
      ? "Hi! I'm here to help you. Tell me what you'd like to do"
      : `Hi! I'm here to help you build your ${greetingName}. Tell me what you'd like to build`

    if (existingAgent) {
      return (
        <ExistingAgentCompactHelp
          agentKey={pageTitle?.trim() || greetingName}
          greeting={greeting}
          quickStarts={quickStarts}
        />
      )
    }

    return (
      <div className="relative flex h-full min-h-0 w-full flex-1 justify-center gap-xl self-stretch pr-sm">
        <div className="flex h-full min-h-0 w-full min-w-0 max-w-[720px] flex-col">
          <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden pb-md">
            <div className="flex items-start gap-sm">
              <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                <SparkleLoader size={14} spinning={false} />
              </span>
              <div className="flex min-w-0 flex-col items-start gap-md">
                <p className="text-body leading-6 text-text-primary">{greeting}</p>
                <div className="flex flex-col items-start gap-sm">
                  {quickStarts.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => startConversation(option.prompt)}
                      className="flex h-8 items-center rounded-sm border border-border-selected bg-surface px-[10px] text-left text-body text-text-primary hover:bg-surface-l2"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="z-10 flex shrink-0 flex-col gap-md bg-surface pb-sm pt-md">
            <PromptComposer
              value={prompt}
              onChange={setPrompt}
              onSend={handleSend}
              placeholder={
                existingAgent
                  ? 'What would you like to do?'
                  : isReviewFlow || isReviewGenFlow
                    ? 'What would you like to build? For example: Review response agent replying autonomously.'
                    : 'What would you like to build?'
              }
              onAttach={(option) => {
                if (option === 'upload-image') landingImageInputRef.current?.click()
                else if (option === 'media-library') setMediaLibraryOpen(true)
                else if (option === 'files') setFilesModalOpen(true)
              }}
            />
          </div>
        </div>

        <input
          ref={landingImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setLandingAttachments((prev) => [
                ...prev,
                { id: `image-${Date.now()}`, kind: 'file', label: file.name },
              ])
            }
            e.target.value = ''
          }}
        />
        <MediaLibraryModal
          open={mediaLibraryOpen}
          onClose={() => setMediaLibraryOpen(false)}
          onDone={(selected) =>
            setLandingAttachments((prev) => [
              ...prev,
              ...selected.map((f) => ({ id: f.id, kind: 'file' as const, label: f.label })),
            ])
          }
        />
        <FilesModal
          open={filesModalOpen}
          onClose={() => setFilesModalOpen(false)}
          onDone={(selected) =>
            setLandingAttachments((prev) => [
              ...prev,
              ...selected.map((f) => ({ id: f.id, kind: 'file' as const, label: f.label })),
            ])
          }
        />
      </div>
    )
  }

  const landingCards = libraryCards ?? HEALTHCARE_FRONTDESK_CREATE_CARDS
  const { shell: landingShellClass, grid: landingGridClass } = createLibraryGridClasses(landingCards.length)

  return (
    <div className={`-translate-y-10 mt-3xl flex w-full flex-col items-center gap-2xl self-center py-lg ${landingShellClass}`}>
      {pageTitle && (
        <div className="flex h-16 w-full shrink-0 items-center gap-sm">
          {!hideHeaderBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              aria-label="Back"
            >
              <Icon name="arrow_back" size={20} />
            </button>
          )}
          <h1 className="text-h3 text-text-primary">{pageTitle}</h1>
        </div>
      )}

      <div className="flex flex-col items-center gap-sm text-center">
        <span
          className="ai-gradient-icon size-10"
          style={{
            WebkitMaskImage: `url("${iconAgentsTwoStarSparkle}")`,
            maskImage: `url("${iconAgentsTwoStarSparkle}")`,
          }}
          aria-hidden
        />
        <p className="text-[20px] leading-[28px] tracking-[-0.4px] text-text-primary">
          Build your <span className="ai-gradient-text">agent</span>
        </p>
        <p className="text-[16px] leading-6 tracking-[-0.32px] text-text-secondary">Hey John, add an AI agent that gets the work done for you!</p>
      </div>

      <div className="ai-gradient-border w-full max-w-[640px] rounded-xl p-[2px]">
        <div className="flex flex-col gap-md rounded-[14px] bg-surface px-lg py-md shadow-card">
          {landingAttachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-sm">
              {landingAttachments.map((item) => (
                <RefChip
                  key={item.id}
                  kind={item.kind}
                  label={item.label}
                  onRemove={() => setLandingAttachments((prev) => prev.filter((a) => a.id !== item.id))}
                />
              ))}
            </div>
          )}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => {
              if (!prompt.trim()) setPrompt(initialPrompt ?? JOHN_CREATE_PROMPT)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={3}
            placeholder={rotatingPlaceholders ? typedPlaceholder : DEFAULT_CREATE_PLACEHOLDER}
            className="scrollbar-light min-h-16 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-xs">
              <AttachMenuPopover
                onSelect={(option) => {
                  if (option === 'upload-image') landingImageInputRef.current?.click()
                  else if (option === 'media-library') setMediaLibraryOpen(true)
                  else if (option === 'files') setFilesModalOpen(true)
                }}
              />
              <input
                ref={landingImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLandingAttachments((prev) => [
                      ...prev,
                      { id: `image-${Date.now()}`, kind: 'file', label: file.name },
                    ])
                  }
                  e.target.value = ''
                }}
              />
              <Tooltip content="Dictate" variant="brief">
                <button
                  type="button"
                  aria-label="Dictate"
                  className="flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <Icon name="mic" size={20} />
                </button>
              </Tooltip>
            </div>
            <button
              type="button"
              aria-label="Send"
              onClick={handleSend}
              className="flex size-9 items-center justify-center rounded-sm text-ai-brand transition-colors hover:bg-surface-hover"
            >
              <SendIcon size={24} />
            </button>
          </div>
        </div>
      </div>

      <MediaLibraryModal
        open={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        onDone={(selected) =>
          setLandingAttachments((prev) => [
            ...prev,
            ...selected.map((f) => ({ id: f.id, kind: 'file' as const, label: f.label })),
          ])
        }
      />
      <FilesModal
        open={filesModalOpen}
        onClose={() => setFilesModalOpen(false)}
        onDone={(selected) =>
          setLandingAttachments((prev) => [
            ...prev,
            ...selected.map((f) => ({ id: f.id, kind: 'file' as const, label: f.label })),
          ])
        }
      />

      <p className="m-0 mt-3xl text-center text-body text-text-secondary">
        <button
          type="button"
          onClick={onCreateFromScratch}
          className="text-body text-text-action hover:underline"
        >
          {fromScratchLabel}
        </button>
        <span className="text-text-primary">{' or select from '}</span>
        <button type="button" className="text-body text-text-primary hover:underline">
          library
        </button>
      </p>

      <div className={`@container w-full ${landingCards.length === 1 ? 'flex justify-center' : ''}`}>
        <div className={`grid w-full gap-md ${landingGridClass}`}>
          {landingCards.map((tpl) => (
            <div key={tpl.id} className={INFO_CARD_LAYOUT.root}>
              {tpl.glyph && tpl.tone ? (
                <div className="flex min-w-0 items-center gap-md">
                  <LibraryCardIcon glyph={tpl.glyph} tone={tpl.tone} />
                  <h3 className="min-w-0 flex-1 text-body leading-[22px] tracking-[-0.28px] text-text-primary">{tpl.title}</h3>
                </div>
              ) : (
                <h3 className="min-w-0 shrink-0 line-clamp-2 text-body text-text-primary">{tpl.title}</h3>
              )}
              <p className={INFO_CARD_LAYOUT.description}>{tpl.description}</p>
              <div className={INFO_CARD_LAYOUT.ctaShell}>
                <div className={INFO_CARD_LAYOUT.ctaInner}>
                  <div className={INFO_CARD_LAYOUT.ctaWrap}>
                    <button
                      type="button"
                      onClick={() => onSelectFromLibrary(tpl.id)}
                      className={`${INFO_CARD_LAYOUT.ctaSecondary} max-w-fit flex-none`}
                    >
                      Use agent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mock recent chats for the create-agent history rail. Selecting one opens a
// static past transcript (no thinking / typing animation).
type ChatHistoryTranscript = {
  id: string
  title: string
  prompt: string
  draftTitle: string
  draftDescription: string
  replies: string[][]
  trail?: CreateChatTurn[]
  variant?: 'frontdesk' | 'reminder'
}

function cleanTrailParagraph(text: string) {
  return text
    .replace(/^ACTION_CONT:\s*/, '')
    .replace(/^ACTION:\s*/, '')
    .replace(/^CALLOUT:\s*/, '')
    .replace(/^WARN:\s*/, '')
    .replace(/^INDENT:\s*/, '')
}

function agentParagraphs(paragraphs: string[]): CreateChatTurn {
  return { kind: 'agent', paragraphs: paragraphs.map(cleanTrailParagraph) }
}

type SavedCreateChatSnapshot = {
  variant: 'frontdesk' | 'reminder'
  prompt: string
  draftTitle: string
  draftDescription: string
  docsAnswer?: string
  docsFileLabels?: string[]
  docsProvided?: boolean
  docsBuildComplete?: boolean
  docsDraftReadyDone?: boolean
  refillAnswer?: string
  refillProcedureCreated?: boolean
  createAgentAnswer?: string
  draftBuildReady?: boolean
  reviewFollowUpAnswer?: string
  testReplyDone?: boolean
  testAgentAnswers?: string[]
  timingAnswer?: string
  timingFollowDone?: boolean
  rescheduleAnswer?: string
  connectAnswer?: string
  connectFileLabels?: string[]
  reminderBuildDone?: boolean
}

function buildCreateChatTrail(snap: SavedCreateChatSnapshot): CreateChatTurn[] {
  const trail: CreateChatTurn[] = []
  const trimmed = snap.prompt.trim()
  if (trimmed) trail.push({ kind: 'user', text: trimmed })

  if (snap.variant === 'reminder') {
    trail.push({ kind: 'thoughts', text: REMINDER_CREATE_THOUGHTS_TEXT })
    trail.push(agentParagraphs(REMINDER_CREATE_INTRO_PARAGRAPHS))
    if (snap.timingAnswer) {
      trail.push({ kind: 'user', text: snap.timingAnswer })
      trail.push({ kind: 'thoughts', text: REMINDER_AFTER_TIMING_THOUGHTS_TEXT })
    }
    if (snap.timingFollowDone) {
      trail.push(
        agentParagraphs([
          ...REMINDER_CADENCE_REPLY_PARAGRAPHS,
          ...REMINDER_RESCHEDULE_QUESTION_PARAGRAPHS,
        ]),
      )
    }
    if (snap.rescheduleAnswer) {
      trail.push({ kind: 'user', text: snap.rescheduleAnswer })
      trail.push({ kind: 'thoughts', text: REMINDER_AFTER_HANDOFF_THOUGHTS_TEXT })
      trail.push(agentParagraphs(REMINDER_HANDOFF_REPLY_PARAGRAPHS))
    }
    if (snap.connectAnswer) {
      trail.push({ kind: 'user', text: snap.connectAnswer })
      if (snap.connectFileLabels?.length) {
        trail.push({ kind: 'user-files', labels: snap.connectFileLabels })
      }
      const continues = !snap.connectAnswer.startsWith('No')
      if (continues) {
        const hasEmail = Boolean(snap.connectFileLabels?.length)
        trail.push({
          kind: 'thoughts',
          text: hasEmail ? REMINDER_AFTER_EMAIL_THOUGHTS_TEXT : REMINDER_READY_TO_BUILD_THOUGHTS_TEXT,
        })
        trail.push(
          agentParagraphs([
            hasEmail ? REMINDER_BUILD_REPLY_WITH_EMAIL : REMINDER_BUILD_REPLY_DEFAULT,
          ]),
        )
        if (snap.reminderBuildDone) {
          trail.push({
            kind: 'draft',
            title: snap.draftTitle,
            description: snap.draftDescription,
            variant: 'reminder',
          })
        }
      }
    }
    return trail
  }

  // Front desk
  trail.push({ kind: 'thoughts', text: CREATE_AGENT_THOUGHTS_TEXT })
  trail.push(agentParagraphs(CREATE_AGENT_INTRO_PARAGRAPHS))

  if (snap.docsFileLabels?.length) {
    trail.push({ kind: 'user-files', labels: snap.docsFileLabels })
  } else if (snap.docsAnswer) {
    trail.push({ kind: 'user', text: snap.docsAnswer })
  }

  if (snap.docsProvided) {
    trail.push({ kind: 'thoughts', text: CREATE_AGENT_DOCS_THOUGHTS_TEXT })
    trail.push(agentParagraphs(CREATE_AGENT_DOCS_REPLY_PARAGRAPHS))
    if (snap.docsBuildComplete) {
      trail.push({ kind: 'status', text: 'Analyzed transcripts and built your draft procedures' })
      trail.push({ kind: 'thoughts', text: CREATE_AGENT_POST_BUILD_THOUGHTS_TEXT })
    }
    if (snap.docsDraftReadyDone) {
      trail.push(
        agentParagraphs([
          ...CREATE_AGENT_DRAFT_READY_INTRO,
          'What your callers actually ask for:',
          ...CALLER_JOB_BREAKDOWN.map((j) => `• ${j.label} — ${j.pct}`),
          ...CREATE_AGENT_DRAFT_READY_CLOSING,
        ]),
      )
    }
  }

  if (snap.refillAnswer) {
    trail.push({ kind: 'user', text: snap.refillAnswer })
    if (snap.refillAnswer.startsWith('Add procedure')) {
      trail.push({ kind: 'thoughts', text: CREATE_AGENT_REFILL_THOUGHTS_TEXT })
      trail.push(agentParagraphs(CREATE_AGENT_REFILL_REPLY_PARAGRAPHS))
      if (snap.refillProcedureCreated) {
        trail.push({
          kind: 'status',
          text: `Added procedure "${REFILL_PROCEDURE_NAME}" to your library`,
        })
        trail.push(
          agentParagraphs([
            "Now that I've created the procedure, I can go ahead and create the agent draft. Would you like me to proceed?",
          ]),
        )
      }
    }
  }

  if (snap.createAgentAnswer) {
    trail.push({ kind: 'user', text: snap.createAgentAnswer })
  }

  if (snap.draftBuildReady) {
    trail.push({
      kind: 'draft',
      title: snap.draftTitle,
      description: snap.draftDescription,
      variant: snap.variant === 'reminder' ? 'reminder' : 'frontdesk',
      refillAdded: Boolean(snap.refillAnswer?.startsWith('Add procedure')),
    })
    trail.push({ kind: 'thoughts', text: CREATE_AGENT_REVIEW_THOUGHTS_TEXT })
    trail.push({
      kind: 'agent',
      paragraphs: [FRONTDESK_POST_DRAFT_REPLY],
      choices: snap.reviewFollowUpAnswer ? undefined : [...FRONTDESK_POST_DRAFT_PILLS],
    })
  }

  if (snap.reviewFollowUpAnswer) {
    trail.push({ kind: 'user', text: snap.reviewFollowUpAnswer })
    trail.push({ kind: 'thoughts', text: CREATE_AGENT_TEST_THOUGHTS_TEXT })
    if (snap.testReplyDone) {
      trail.push(agentParagraphs(CREATE_AGENT_TEST_REPLY_PARAGRAPHS))
    }
  }

  for (const answer of snap.testAgentAnswers ?? []) {
    trail.push({ kind: 'user', text: answer })
  }

  // Always end with the draft card if we have a title and haven't already added it
  if (
    snap.draftTitle &&
    !trail.some((t) => t.kind === 'draft') &&
    (snap.draftBuildReady || snap.docsDraftReadyDone || snap.docsBuildComplete)
  ) {
    trail.push({
      kind: 'draft',
      title: snap.draftTitle,
      description: snap.draftDescription,
      variant: snap.variant === 'reminder' ? 'reminder' : 'frontdesk',
      refillAdded: Boolean(snap.refillAnswer?.startsWith('Add procedure')),
    })
  }

  return trail
}

/** Demo: East region Front desk already has the full Create with AI transcript. */
registerBuiltinCreateAiDraft(
  'Front desk agent - East region',
  buildCreateChatTrail({
    variant: 'frontdesk',
    prompt: JOHN_CREATE_PROMPT,
    draftTitle: 'Front desk agent - East region',
    draftDescription: FRONTDESK_BUILD_CARD.description,
    docsFileLabels: DEMO_DOCS_ATTACHMENTS.map((f) => f.label),
    docsProvided: true,
    docsBuildComplete: true,
    docsDraftReadyDone: true,
    refillAnswer: 'Add procedure "Handling refills"',
    refillProcedureCreated: true,
    createAgentAnswer: 'Yes, create the agent',
    draftBuildReady: true,
  }),
)

/** Builds a recent-chat entry from a finished full-page co-pilot session. */
function buildSavedCreateChat(snap: SavedCreateChatSnapshot): ChatHistoryTranscript {
  const trimmed = snap.prompt.trim()
  const title =
    snap.draftTitle.replace(/^New\s+/i, '').trim() ||
    (trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed) ||
    (snap.variant === 'reminder' ? 'Reminder agent' : 'Front desk agent')

  const trail = buildCreateChatTrail(snap)
  const replies = trail
    .filter((t): t is Extract<CreateChatTurn, { kind: 'agent' }> => t.kind === 'agent')
    .map((t) => t.paragraphs)

  return {
    id: `saved-${Date.now()}`,
    title,
    prompt: trimmed,
    draftTitle: snap.draftTitle,
    draftDescription: snap.draftDescription,
    replies:
      replies.length > 0
        ? replies
        : [
            [
              snap.variant === 'reminder'
                ? 'Draft is ready. Unconfirmed patients get a Reminder call that can confirm, cancel, or hand off a reschedule.'
                : 'Your draft is ready. Review the procedures anytime, or reopen this chat from Create with AI.',
            ],
          ],
    trail,
    variant: snap.variant,
  }
}

const FRONTDESK_CHAT_HISTORY: ChatHistoryTranscript[] = [
  {
    id: 'fd-1',
    title: 'Insurance verification and triage agent',
    prompt:
      "I want an agent that verifies insurance up front and triages incoming calls by urgency before booking anything.",
    draftTitle: 'New front desk agent - insurance triage',
    draftDescription: 'Verifies coverage first, then triages urgency before any booking step.',
    replies: [
      [
        'Got it — insurance verification before triage is a strong Front desk pattern.',
        '• Verify insurance eligibility',
        '• Triage by urgency',
        '• Book only after both clear',
        '• Escalate clinical emergencies to a human',
        'I built a draft around that flow. You can open any procedure below to review the steps.',
      ],
      [
        'Your draft is ready. Insurance is checked first, urgent symptoms route out, and routine requests continue to booking.',
      ],
    ],
  },
  {
    id: 'fd-2',
    title: 'After-hours patient triage agent',
    prompt:
      "Build me an agent for after-hours calls — it should triage urgent symptoms and route the rest to voicemail or the next business day.",
    draftTitle: 'New front desk agent - after hours',
    draftDescription: 'Triages after-hours calls, escalates urgent symptoms, and holds routine requests overnight.',
    replies: [
      [
        'After-hours triage is a good fit. I shaped the agent around three paths:',
        '• Urgent symptoms → warm handoff / on-call',
        '• Routine requests → next-business-day callback',
        '• Simple FAQs → answer from your knowledge base',
        'Outside clinic hours it never books same-day visits.',
      ],
      [
        'Draft is ready. The after-hours agent triages first, escalates true urgency, and parks everything else for morning staff.',
      ],
    ],
  },
  {
    id: 'fd-3',
    title: 'Reschedule and cancellation agent',
    prompt:
      "I need an agent focused on reschedules and cancellations — find the existing booking, confirm the change, and update the record.",
    draftTitle: 'New front desk agent - reschedule',
    draftDescription: 'Finds the existing appointment, confirms the change, and updates the record.',
    replies: [
      [
        'A focused reschedule / cancel agent keeps the main Front desk quieter.',
        '• Look up the existing appointment',
        '• Confirm cancel vs reschedule',
        '• Offer new slots when needed',
        '• Update the record and send confirmation',
      ],
      [
        'Draft is ready. Callers can cancel or move an appointment end-to-end without waiting for staff.',
      ],
    ],
  },
]

const REMINDER_CHAT_HISTORY: ChatHistoryTranscript[] = [
  {
    id: 'rm-1',
    title: 'Appointment confirmation reminder',
    prompt: REMINDER_CREATE_PROMPT,
    draftTitle: REMINDER_BUILD_CARD.title,
    draftDescription: REMINDER_BUILD_CARD.description,
    replies: [
      [
        'A multi-step reminder journey works well here — email and text first, then a confirmation call for anyone still unconfirmed.',
        '• 3 weeks before → email + text',
        '• 1 week before → email + text',
        '• 2 days before → call if still unconfirmed',
      ],
      [
        'Draft is ready. Unconfirmed patients get a Reminder call that can confirm, cancel, or hand off a reschedule.',
      ],
    ],
  },
  {
    id: 'rm-2',
    title: 'No-show risk intervention agent',
    prompt:
      "For patients flagged high risk for no-shows, I want extra reminders and a live call the day before to confirm.",
    draftTitle: 'New reminder agent - no-show risk',
    draftDescription: 'Adds extra reminders and a day-before confirmation call for high no-show risk patients.',
    replies: [
      [
        'High no-show risk needs a tighter cadence than the standard reminder.',
        '• Extra SMS the week of the visit',
        '• Live confirmation call the day before',
        '• Escalate to staff if still unconfirmed',
      ],
      [
        'Draft is ready. High-risk patients get denser outreach and a live call before the appointment.',
      ],
    ],
  },
  {
    id: 'rm-3',
    title: 'Pre-visit preparation reminder',
    prompt:
      "Send patients a reminder about pre-visit prep — fasting, forms, insurance card — a few days before their appointment.",
    draftTitle: 'New reminder agent - pre-visit prep',
    draftDescription: 'Reminds patients about fasting, forms, and insurance cards before the visit.',
    replies: [
      [
        'Pre-visit prep reminders are mostly content + timing.',
        '• 3 days before → prep checklist by appointment type',
        '• Day before → quick confirmation of forms / fasting',
        '• Missing items → one follow-up nudge',
      ],
      [
        'Draft is ready. Patients get the right prep instructions for their visit without staff dialing down the list.',
      ],
    ],
  },
]

/** Past-chat reopen: static transcript, no thinking / typing animation. */
function HistoryChatReplay({
  chat,
  onBack,
  pageTitle,
  hideHeaderBack = false,
}: {
  chat: ChatHistoryTranscript
  onBack?: () => void
  pageTitle?: string
  hideHeaderBack?: boolean
}) {
  const trail = chat.trail
  return (
    <div className="relative flex h-full min-h-0 w-full max-w-[1600px] flex-1 justify-center gap-xl self-stretch pr-sm">
      <div className="flex h-full min-h-0 w-full min-w-0 max-w-[720px] flex-col">
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col pb-md">
            {pageTitle && !hideHeaderBack && (
              <div className="sticky top-0 z-20 mb-md flex h-16 shrink-0 items-center gap-sm bg-surface">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                  aria-label="Back"
                >
                  <Icon name="arrow_back" size={20} />
                </button>
                <h1 className="min-w-0 truncate text-h3 text-text-primary">{pageTitle}</h1>
                <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                  Draft
                </span>
              </div>
            )}

            {trail?.length ? (
              trail.map((turn, i) => {
                if (turn.kind === 'user') {
                  return (
                    <div key={i} className="mt-3xl flex justify-end first:pt-md">
                      <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary">
                        {turn.text}
                      </span>
                    </div>
                  )
                }
                if (turn.kind === 'user-files') {
                  return (
                    <div key={i} className="mt-3xl flex justify-end">
                      <div className="flex max-w-[80%] flex-wrap justify-end gap-sm">
                        {turn.labels.map((label) => (
                          <RefChip key={label} kind="file" label={label} />
                        ))}
                      </div>
                    </div>
                  )
                }
                if (turn.kind === 'thoughts') {
                  return (
                    <div key={i} className="mt-3xl flex flex-col gap-sm">
                      <p className="text-small text-text-secondary">{turn.label || 'Thoughts'}</p>
                      <pre className="whitespace-pre-wrap rounded-md bg-surface-hover px-md py-sm font-sans text-small leading-5 text-text-secondary">
                        {turn.text}
                      </pre>
                    </div>
                  )
                }
                if (turn.kind === 'agent') {
                  return (
                    <div key={i}>
                      <div className="chat-turn mt-3xl flex gap-sm">
                        <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col gap-md text-body leading-6 text-text-primary">
                          <TypedParagraphs paragraphs={turn.paragraphs} instant />
                        </div>
                      </div>
                      <MessageActions className="ml-3xl" copyText={turn.paragraphs.join('\n\n')} />
                    </div>
                  )
                }
                if (turn.kind === 'status') {
                  return (
                    <p key={i} className="mt-lg text-small text-text-secondary">
                      {turn.text}
                    </p>
                  )
                }
                if (turn.kind === 'draft') {
                  return (
                    <div key={i} className="mt-3xl flex flex-col gap-md">
                      <p className="text-body leading-6 text-text-primary">
                        {turn.title.includes('reminder') ? 'Reminder' : 'Front desk'} agent draft is ready
                      </p>
                      <div className="rounded-md border border-border bg-surface p-lg">
                        <div className="flex items-start gap-sm">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-sm">
                              <span className="text-body text-text-primary">{turn.title}</span>
                              <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                                Draft
                              </span>
                            </div>
                            <p className="mt-xs text-small text-text-secondary">{turn.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })
            ) : (
              <>
                <div className="flex justify-end pt-md">
                  <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary">
                    {chat.prompt}
                  </span>
                </div>

                {chat.replies.map((paragraphs, replyIndex) => (
                  <div key={replyIndex}>
                    <div className="chat-turn mt-3xl flex gap-sm">
                      <AiAvatarChatIcon size={24} className="mt-[2px] shrink-0" />
                      <div className="flex min-w-0 flex-1 flex-col gap-md text-body leading-6 text-text-primary">
                        <TypedParagraphs paragraphs={paragraphs} instant />
                      </div>
                    </div>
                    <MessageActions className="ml-3xl" copyText={paragraphs.join('\n\n')} />
                  </div>
                ))}

                <div className="mt-3xl flex flex-col gap-md">
                  <p className="text-body leading-6">
                    <span className="text-text-primary">
                      {chat.draftTitle.includes('reminder') ? 'Reminder' : 'Front desk'} agent draft is ready
                    </span>
                  </p>
                  <div className="rounded-md border border-border bg-surface p-lg">
                    <div className="flex items-start gap-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-sm">
                          <span className="text-body text-text-primary">{chat.draftTitle}</span>
                          <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                            Draft
                          </span>
                        </div>
                        <p className="mt-xs text-small text-text-secondary">{chat.draftDescription}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentDetailScreen({ agentName, navId, onEditAgent, onAgentSetupActiveChange, onNavigateToInbox, onOpenIntegrationSettings, product, pendingInstanceView, onPendingInstanceViewConsumed, onFullBleedDetailActiveChange, initialRecommendationFocus, onInitialRecommendationFocusConsumed, autoOpenCreateFlow, onAutoOpenCreateFlowConsumed, routeDeep, onDeepRouteChange }: AgentDetailScreenProps) {
  const isExplorationResponseAgents = isResponseAgentsExplorationChrome(navId)
  const isExplorationFrontDeskAgents = isFrontdeskExplorationChrome(navId)
  const isExplorationAgents = isAgentExplorationChrome(navId)
  const isSep1Agents = Boolean(navId?.includes('sep-1'))
  const useExplorationOutcomesTab = isExplorationAgents && !isSep1Agents
  const [activeTab, setActiveTab] = useState('agents')
  const [agentsViewMode, setAgentsViewMode] = useState<'list' | 'grid'>('grid')
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [agentFilters, setAgentFilters] = useState<Record<string, string[]>>({})
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  /** Review response agent (exploration) grid: 'default' = icon card; 'r1' = metric-forward card. */
  const [cardLayoutOption, setCardLayoutOption] = useState<'default' | 'r1' | 'r2' | 'r3'>('default')
  const [cardLayoutMenuOpen, setCardLayoutMenuOpen] = useState(false)
  const cardLayoutMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardLayoutMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (cardLayoutMenuRef.current && !cardLayoutMenuRef.current.contains(e.target as Node)) {
        setCardLayoutMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [cardLayoutMenuOpen])
  const showExplorationAgentsToggle =
    isExplorationAgents && !isSep1Agents && activeTab === 'agents'
  const useExplorationGrid =
    isExplorationAgents && !isSep1Agents && agentsViewMode === 'grid'
  const [selectedInstance, setSelectedInstance] = useState<string | null>(
    pendingInstanceView?.instanceName ?? null,
  )
  const [selectedInstanceDisplayName, setSelectedInstanceDisplayName] = useState<string | null>(null)
  const [instanceInitialTab, setInstanceInitialTab] = useState(pendingInstanceView?.tab ?? 'outcomes')

  useEffect(() => {
    setActiveTab('agents')
  }, [navId])

  useEffect(() => {
    if (!pendingInstanceView) return
    setSelectedInstance(pendingInstanceView.instanceName)
    setInstanceInitialTab(pendingInstanceView.tab)
    onDeepRouteChange?.({
      instanceSlug: instanceSlugFromName(pendingInstanceView.instanceName),
      tab: pendingInstanceView.tab,
    })
    onPendingInstanceViewConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInstanceView])
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [createFlowKey, setCreateFlowKey] = useState(0)
  const [libraryPreview, setLibraryPreview] = useState<AgentLibraryPreviewData | null>(null)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [createWorkflowOpen, setCreateWorkflowOpen] = useState(false)
  const [createWorkflowMounted, setCreateWorkflowMounted] = useState(false)
  const [createLeftPaneCollapsed, setCreateLeftPaneCollapsed] = useState(false)
  /** Review-response: docked AI Builder on the canvas (replaces the left Create with AI floater). */
  const [createAiBuilderPanelOpen, setCreateAiBuilderPanelOpen] = useState(false)
  const [createAiFullscreen, setCreateAiFullscreen] = useState(false)
  const [createSideTab, setCreateSideTab] = useState<'ai' | 'manual'>('ai')
  /** After prompt send — chat header aligns to content; landing keeps page-left header. */
  const [createFlowSubmitted, setCreateFlowSubmitted] = useState(false)
  const [createDraftAgentName, setCreateDraftAgentName] = useState<string | null>(null)
  const [canvasProcedureId, setCanvasProcedureId] = useState<string | null>(null)
  const [, setInlineProcedureOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  /** Recent-chats rail shown alongside the create-agent flow — null = "All chats" (fresh). */
  const [chatHistorySelectedId, setChatHistorySelectedId] = useState<string | null>(null)
  /** Chats saved via "Save agent" from the full-page co-pilot — prepended to the recent list. */
  const [savedCreateChats, setSavedCreateChats] = useState<ChatHistoryTranscript[]>(() =>
    (['frontdesk', 'reminder'] as const)
      .map((v) => getLastSavedCreateChat(v))
      .filter((c): c is ChatHistoryTranscript => Boolean(c)),
  )
  const { procedures: procedureLibrary } = useProcedureStore()

  const openCreateFlow = () => {
    setCreateFlowKey((k) => k + 1)
    setShowSetupWizard(false)
    setCreateWorkflowOpen(false)
    setCreateWorkflowMounted(false)
    setCreateAiFullscreen(false)
    setCreateSideTab('ai')
    setCreateFlowSubmitted(false)
    setCreateDraftAgentName(null)
    setCanvasProcedureId(null)
    setInlineProcedureOpen(false)
    setShowCreateFlow(true)
  }

  const selectAllChats = () => {
    setChatHistorySelectedId(null)
    setCreateFlowKey((k) => k + 1)
    setShowSetupWizard(false)
    setCreateWorkflowOpen(false)
    setCreateWorkflowMounted(false)
    setCreateFlowSubmitted(false)
    setCreateDraftAgentName(null)
    setCanvasProcedureId(null)
    setInlineProcedureOpen(false)
  }

  const openCreateWorkflow = () => {
    setCreateAiFullscreen(false)
    setCreateSideTab('ai')
    setCreateWorkflowMounted(true)
    // Floating chrome: Create with AI lives on the canvas (sparkle + LHS panel).
    setCreateLeftPaneCollapsed(true)
    setCreateAiBuilderPanelOpen(true)
    setCanvasProcedureId(null)
    setInlineProcedureOpen(false)
    window.requestAnimationFrame(() => setCreateWorkflowOpen(true))
  }

  const closeCreateWorkflow = () => {
    setCreateWorkflowOpen(false)
    setCreateSideTab('ai')
    setCreateLeftPaneCollapsed(false)
    setCreateAiBuilderPanelOpen(false)
    setCanvasProcedureId(null)
    setInlineProcedureOpen(false)
  }

  const expandCreateAiFullscreen = () => {
    setCreateAiFullscreen(true)
    setCreateAiBuilderPanelOpen(false)
    closeCreateWorkflow()
  }

  const handleCreateAgentSuccess = (options?: { publish?: boolean; chat?: ChatHistoryTranscript }) => {
    if (options?.chat) {
      setSavedCreateChats((prev) => [options.chat!, ...prev.filter((c) => c.id !== options.chat!.id)])
      rememberCreateAgentChat(isReminder ? 'reminder' : 'frontdesk', options.chat)
    }
    setShowCreateFlow(false)
    setShowSetupWizard(false)
    setInstanceInitialTab('workflow')
    setSelectedInstance(`${agentName} - North region`)
    setSelectedInstanceDisplayName(
      createDraftAgentName ? `${createDraftAgentName} - North region` : null,
    )
    onDeepRouteChange?.({ instanceSlug: instanceSlugFromName(`${agentName} - North region`), tab: 'workflow' })
    setToastMessage(
      options?.publish ? 'Agent created and published successfully' : 'Agent created successfully',
    )
    setToastVisible(true)
  }

  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [savingsSettings, setSavingsSettings] = useState<EstimateSavingsValues>({
    mode: 'time',
    minutesPerResolution: 5,
    wageCurrency: 'USD',
    hourlyWage: 40,
  })

  const METRICS_BY_AGENT: Record<string, Metric[]> = {
    [FRONTDESK_AGENT_NAME]: [
      { id: 'responded', value: '18,420', label: 'Conversations responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total inbound conversations handled by the agent across all channels in the selected period.' },
      { id: 'resolved', value: '16,230', label: 'Conversations resolved', delta: '2.1%', trend: 'up', info: true, tooltip: 'Conversations closed without requiring human escalation.' },
      { id: 'resolutionRate', value: '88%', label: 'Resolution rate', delta: '1.8%', trend: 'up', info: true, tooltip: 'Percentage of conversations fully resolved by the agent. Calculated as resolved ÷ responded.' },
      { id: 'timeSaved', value: '40h', label: 'Time saved', delta: '12%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved based on average handle time for equivalent human-handled conversations.' },
    ],
    [FRONTDESK_EXPLORATION_AGENT_NAME]: [
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
    [REVIEW_RESPONSE_AGENT_NAME]: [
      { id: 'reviewsResponded', value: '835', label: 'Reviews responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total reviews the agent has replied to across all locations in the selected period.' },
      { id: 'responseRate', value: '92%', label: 'Response rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of eligible reviews that received a reply from the agent.' },
      { id: 'avgResponseTime', value: '20m', label: 'Average response time', delta: '1.3%', trend: 'up', info: true, tooltip: 'Average time from review receipt to published reply across all locations.' },
      { id: 'timeSaved', value: '6h 20m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating review responses.' },
    ],
    [REVIEW_RESPONSE_EXPLORATION_AGENT_NAME]: [
      { id: 'reviewsResponded', value: '835', label: 'Reviews responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total reviews the agent has replied to across all locations in the selected period.' },
      { id: 'responseRate', value: '92%', label: 'Response rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of eligible reviews that received a reply from the agent.' },
      { id: 'avgResponseTime', value: '20m', label: 'Average response time', delta: '1.3%', trend: 'up', info: true, tooltip: 'Average time from review receipt to published reply across all locations.' },
      { id: 'timeSaved', value: '6h 20m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating review responses.' },
    ],
    'Review generation agents': [
      { id: 'reviewsReceived', value: '249', label: 'Reviews received', delta: '16.4%', trend: 'up', info: true, tooltip: 'The number of reviews that the business locations received as a result of the agent.' },
      { id: 'contactsReached', value: '265', label: 'Contacts reached', delta: '2.9%', trend: 'up', info: true, tooltip: 'Total unique contacts who received at least one review request via channel. A contact is counted once, even if they received multiple requests.' },
      { id: 'clickThroughRate', value: '4.9%', label: 'Click-through rate', delta: '0.3%', trend: 'down', info: true, tooltip: 'Percentage of unique contacts who clicked at least once on a review request received across email and text.' },
      { id: 'timeSaved', value: '9h', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Quantify operational efficiency gains from using the agent.' },
    ],
    'Review tagging agents': [
      { id: 'reviewsTagged', value: '0', label: 'Reviews tagged', info: true, tooltip: 'Total reviews the agent has tagged across all locations in the selected period.' },
      { id: 'topicsIdentified', value: '0', label: 'Topics identified', info: true, tooltip: 'Unique topics identified from review comments.' },
      { id: 'highRiskTagged', value: '0', label: 'High-risk reviews tagged', info: true, tooltip: 'Reviews tagged for extreme negative sentiment or critical issues.' },
      { id: 'timeSaved', value: '0m', label: 'Time saved', info: true, tooltip: 'Estimated staff time saved by automating review tagging.' },
    ],
  }

  const DEFAULT_METRICS: Metric[] = [
    { id: 'interactions', value: '2,850', label: 'Interactions handled', info: true, tooltip: 'Total customer interactions managed by the agent in the selected period.' },
    { id: 'fcr', value: '92%', label: 'First contact resolution rate', info: true, tooltip: 'Percentage of interactions resolved on the first contact without follow-up.' },
    { id: 'aht', value: '2m 34s', label: 'Average handle time', info: true, tooltip: 'Average duration of a single interaction from start to resolution.' },
    { id: 'escalation', value: '11%', label: 'Escalation rate', info: true, tooltip: 'Percentage of interactions escalated to a human agent. Lower is generally better.' },
  ]

  const metrics: Metric[] = METRICS_BY_AGENT[agentName] ?? DEFAULT_METRICS

  const isFrontdeskAgent = isFrontdeskAgentName(agentName)
  const displayMetrics: Metric[] = isFrontdeskAgent || isReviewResponseAgentName(agentName)
    ? metrics.map((m) => {
        if (m.id !== 'timeSaved' || savingsSettings.mode === 'time') return m
        const hours = parseTimeSavedHours(String(m.value))
        const cost = hours * savingsSettings.hourlyWage
        const formattedCost = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: savingsSettings.wageCurrency,
          maximumFractionDigits: 0,
        }).format(cost)
        return { ...m, value: formattedCost, label: 'Cost saved' }
      })
    : metrics

  const regions = REGIONS_BY_AGENT[agentName] ?? DEFAULT_REGIONS
  const data: AgentInstance[] = regions.map((r, i) => ({
    name: r.instanceName ?? `${agentName} - ${r.region}`,
    status: r.status,
    channels: r.channels,
    region: r.region,
    locationName: REGION_TO_LOCATION[r.region] ?? r.region,
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
    reviewsResponded: r.reviewsResponded,
    responseRate: r.responseRate,
    avgResponseTime: r.avgResponseTime,
    reviewsReceived: r.reviewsReceived,
    contactsReached: r.contactsReached,
    clickThroughRate: r.clickThroughRate,
    issues: r.issues,
    lastUpdated: r.lastUpdated ?? LAST_UPDATED_SAMPLES[i % LAST_UPDATED_SAMPLES.length],
    updatedBy: r.updatedBy ?? UPDATED_BY_SAMPLES[i % UPDATED_BY_SAMPLES.length],
    hasDraft: r.hasDraft,
  })).sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

  useEffect(() => {
    if (!initialRecommendationFocus) return
    const match = data.find((d) => d.name === initialRecommendationFocus.instanceName)
    if (match) {
      setSelectedInstance(match.name)
      setSelectedInstanceDisplayName(null)
    }
    // Only react to focus-id changes; `data` is derived fresh each render and would otherwise
    // retrigger this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecommendationFocus])

  useEffect(() => {
    if (routeDeep?.listTab) setActiveTab(routeDeep.listTab)
  }, [routeDeep?.listTab, navId])

  useEffect(() => {
    if (!routeDeep?.instanceSlug) {
      if (!pendingInstanceView) setSelectedInstance(null)
      return
    }
    const match = data.find((d) => instanceSlugFromName(d.name) === routeDeep.instanceSlug)
    if (!match) return
    setSelectedInstance(match.name)
    if (routeDeep.tab) setInstanceInitialTab(routeDeep.tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDeep?.instanceSlug, routeDeep?.tab, navId, agentName])

  const isReminder        = agentName === 'Reminder agent'
  const isFrontdesk       = isFrontdeskAgentName(agentName)
  const isWaitlist        = agentName === 'Waitlist agent'
  const isPreVisit        = agentName === 'Pre-visit agent'
  const isRecall          = agentName === 'Recall agent'
  const isRevenue         = agentName === 'Revenue agent'
  const isTreatmentPlan   = agentName === 'Treatment plan agent'
  const isTaggingRouting  = agentName === 'Tagging & routing agent'
  const isReviewResponse  = isReviewResponseAgentName(agentName)
  const isReviewGeneration = agentName === 'Review generation agents'
  const isReviewTagging   = agentName === 'Review tagging agents'
  const hideChannels      = isTaggingRouting || isReviewResponse || isReviewGeneration || isReviewTagging
  /** Illustration + library cards only (no Ghostwriter) — Sep 1 response/reminder, waitlist, pre-visit. */
  const isLibraryOnlyCreate =
    isWaitlist ||
    isPreVisit ||
    Boolean(navId && LIBRARY_ONLY_CREATE_NAV_IDS.has(navId))

  useEffect(() => {
    if (!autoOpenCreateFlow) return
    if (isFrontdesk || isReminder || isWaitlist || isPreVisit || isReviewResponse || isReviewGeneration) {
      openCreateFlow()
    } else {
      onEditAgent?.('')
    }
    onAutoOpenCreateFlowConsumed?.()
    // Only react to the flag flipping true; the effect itself must not be re-triggered by
    // openCreateFlow's own state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreateFlow])

  useEffect(() => {
    if (!showCreateFlow) setCreateAiFullscreen(false)
  }, [showCreateFlow])

  // `AgentInstanceScreen` reports its own full-page states (e.g. an open recommendation) via
  // `instanceSetupActive` — merged here so it and the create-flow/setup-wizard state below don't
  // race to overwrite the same `onAgentSetupActiveChange` callback from App.tsx.
  const [instanceSetupActive, setInstanceSetupActive] = useState(false)

  useEffect(() => {
    // Instance screen owns full-bleed signaling (e.g. View log) while drilled in.
    if (selectedInstance) return
    // Setup wizard / library-only create / review create landings hide L2 while open.
    const isAgentSetupActive =
      ((isFrontdesk || isReminder || isWaitlist || isPreVisit) && (showCreateFlow || showSetupWizard)) ||
      ((isReviewResponse || isReviewGeneration) && showCreateFlow) ||
      instanceSetupActive
    onAgentSetupActiveChange?.(isAgentSetupActive)
    return () => onAgentSetupActiveChange?.(false)
  }, [isFrontdesk, isReminder, isWaitlist, isPreVisit, isReviewResponse, isReviewGeneration, showCreateFlow, showSetupWizard, instanceSetupActive, selectedInstance, onAgentSetupActiveChange])
  const COLUMN_DEFS: Array<Column<AgentInstance> & { locked?: boolean }> = [
    {
      key: 'name',
      label: 'Agent name',
      width: 230,
      sortable: true,
      locked: true,
      truncate: false,
      render: (v, row) => (
        <div className={`flex flex-col ${row.hasDraft ? 'gap-xs' : ''}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openAgentInstanceDetails(row)
            }}
            className={`truncate text-left text-body text-text-primary hover:text-text-action ${
              row.hasDraft ? 'flex h-7 items-center' : ''
            }`}
          >
            {String(v)}
          </button>
          {row.hasDraft ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEditAgent?.(
                  row.name,
                  undefined,
                  undefined,
                  'Draft',
                )
              }}
              className="flex h-7 items-center gap-sm truncate -ml-xs text-left text-body text-text-secondary hover:text-text-action"
            >
              <span className="text-text-tertiary" aria-hidden>
                └
              </span>
              <span className="truncate">{String(v)}</span>
            </button>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 170,
      sortable: true,
      truncate: false,
      render: (v, row) => (
        <div className={`flex flex-col ${row.hasDraft ? 'gap-xs' : ''}`}>
          <div className={`flex items-center gap-sm ${row.hasDraft ? 'h-7' : 'min-h-5'}`}>
            <Chip label={String(v)} variant={STATUS_VARIANT[String(v)] ?? 'neutral'} />
            {row.issues ? (
              <span className="flex items-center gap-xs text-small text-text-secondary">
                <Icon name="error" size={14} className="text-chip-danger-text" />
                {row.issues} {row.issues === 1 ? 'issue' : 'issues'}
              </span>
            ) : null}
          </div>
          {row.hasDraft ? (
            <div className="flex h-7 items-center">
              <Chip label="Draft" variant={STATUS_VARIANT.Draft} />
            </div>
          ) : null}
        </div>
      ),
    },
    ...(hideChannels ? [] : [{ key: 'channels' as keyof AgentInstance, label: 'Channels', width: 140, sortable: true }]),
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
    ] : isReviewResponse ? [
      { key: 'reviewsResponded' as keyof AgentInstance, label: 'Reviews responded', width: 150, sortable: true },
      { key: 'responseRate' as keyof AgentInstance, label: 'Response rate', width: 130, sortable: true },
      { key: 'avgResponseTime' as keyof AgentInstance, label: 'Average response time', width: 170, sortable: true },
      { key: 'timeSaved' as keyof AgentInstance, label: 'Time saved', width: 110, sortable: true },
    ] : isReviewGeneration ? [
      { key: 'reviewsReceived' as keyof AgentInstance, label: 'Reviews received', width: 150, sortable: true },
      { key: 'contactsReached' as keyof AgentInstance, label: 'Contacts reached', width: 150, sortable: true },
      { key: 'clickThroughRate' as keyof AgentInstance, label: 'Click-through rate', width: 150, sortable: true },
      { key: 'timeSaved' as keyof AgentInstance, label: 'Time saved', width: 110, sortable: true },
    ] : [
      { key: 'interactions' as keyof AgentInstance, label: 'Interactions handled', width: 200, sortable: true },
      { key: 'fcr' as keyof AgentInstance, label: 'First contact resolution rate', width: 220, sortable: true },
      { key: 'aht' as keyof AgentInstance, label: 'Average handle time', width: 180, sortable: true },
      { key: 'escalation' as keyof AgentInstance, label: 'Escalation rate', width: 150, sortable: true },
    ]),
    { key: 'lastUpdated', label: 'Last updated', width: 150, sortable: true },
    { key: 'updatedBy', label: 'Updated by', width: 160, sortable: true },
    { key: 'locations', label: 'Locations', width: 120, sortable: true },
  ]

  const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))
  const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
  // Front desk, Pre-visit, Waitlist, and Reminder each report exactly 4 metrics, so all 4
  // are shown by default. Agents with more metrics (Recall, Revenue, Treatment plan, etc.)
  // still default to the first two, with the rest available via Customize columns.
  const trailingKeys = new Set(['lastUpdated', 'updatedBy', 'locations'])
  const metricKeys = COLUMN_DEFS
    .slice(hideChannels ? 2 : 3)
    .map((c) => String(c.key))
    .filter((k) => !trailingKeys.has(k))
  const showAllMetrics = isFrontdesk || isPreVisit || isWaitlist || isReminder || isTaggingRouting || isReviewResponse || isReviewGeneration
  const DEFAULT_VISIBLE = [
    'name',
    'status',
    ...(hideChannels ? [] : ['channels']),
    ...(showAllMetrics ? metricKeys : metricKeys.slice(0, 2)),
    'lastUpdated',
    'updatedBy',
    'locations',
  ]
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)

  // Remount-safe: keep Last updated / Updated by (and the rest of the default set) in sync
  // when switching between Front desk, Reminder, Waitlist, Pre-visit, Reviews, etc.
  useEffect(() => {
    setOrder(DEFAULT_ORDER)
    setVisible(DEFAULT_VISIBLE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentName])

  const columns = useMemo<Column<AgentInstance>[]>(
    () => order.filter((k) => visible.includes(k)).map((k) => DEF_BY_KEY.get(k)!).filter(Boolean),
    // DEF_BY_KEY is rebuilt per agent; include agentName so column defs refresh with the row set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order, visible, agentName],
  )
  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  /**
   * Row menu → Download: exports this agent instance as a JSON file (metadata + workflow)
   * the browser saves locally.
   */
  const handleDownloadAgent = (row: AgentInstance) => {
    const workflows = getAgentWorkflows(product)
    const workflow =
      workflows[row.name]
      ?? workflows[agentName]
      ?? workflows['Review response agent']
      ?? { nodes: [], nodeDetails: {} }

    const instanceFields = Object.fromEntries(
      order
        .map((key) => {
          const value = row[key as keyof AgentInstance]
          return [key, value] as const
        })
        .filter(([, value]) => value !== undefined && value !== null && value !== ''),
    )

    const payload = {
      name: row.name,
      agentType: agentName,
      status: row.status,
      exportedAt: new Date().toISOString(),
      instance: instanceFields,
      nodes: workflow.nodes ?? [],
      nodeDetails: workflow.nodeDetails ?? {},
    }

    const fileName = `${row.name.replace(/\s+/g, '-').toLowerCase() || 'agent'}.json`
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Revoking synchronously can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    setToastMessage(`${fileName} has been downloaded`)
    setToastVisible(true)
  }

  const openAgentInstanceDetails = (row: AgentInstance) => {
    setInstanceInitialTab('outcomes')
    setSelectedInstanceDisplayName(null)
    setSelectedInstance(row.name)
    onDeepRouteChange?.({ instanceSlug: instanceSlugFromName(row.name), tab: 'outcomes' })
  }

  const openAgentInstanceEditor = (row: AgentInstance) => {
    onEditAgent?.(
      row.name,
      undefined,
      undefined,
      isExplorationAgents ? row.status : undefined,
    )
  }

  const agentInstanceRowMenuItems = useMemo<RowMenuItem<AgentInstance>[]>(() => [
    { label: 'Edit', onClick: openAgentInstanceEditor },
    {
      label: 'Deactivate',
      onClick: () => {},
      visible: (row) => row.status === 'Active',
    },
    { label: 'Duplicate', onClick: () => {} },
    { label: 'View details', onClick: openAgentInstanceDetails },
    { label: 'Reports', onClick: () => {} },
    ...(isExplorationAgents
      ? [{ label: 'Download agent', onClick: handleDownloadAgent }]
      : []),
    { label: 'Delete', onClick: () => {}, variant: 'danger' },
  ], [isExplorationAgents, onEditAgent])

  const agentInstanceCardOverflowMenuItems = useMemo(
    () => agentInstanceRowMenuItems.filter(
      (item) => item.label !== 'Edit' && item.label !== 'View details',
    ),
    [agentInstanceRowMenuItems],
  )

  const FILTER_FIELDS: FilterField[] = useMemo(() => {
    const statusSet = new Set<string>()
    const channelSet = new Set<string>()
    const regionSet = new Set<string>()
    const locationSet = new Set<string>()
    const updatedBySet = new Set<string>()
    for (const row of data) {
      statusSet.add(row.status)
      if (row.hasDraft) statusSet.add('Draft')
      row.channels.split(',').forEach((c) => {
        const t = c.trim()
        if (t) channelSet.add(t)
      })
      if (row.region) regionSet.add(row.region)
      if (row.locationName) locationSet.add(row.locationName)
      if (row.updatedBy) updatedBySet.add(row.updatedBy)
    }
    const statusOpts = ['Active', 'Inactive', 'Draft'].filter((s) => statusSet.has(s))
    const channelOpts = [...channelSet].sort()
    const regionOpts = [...regionSet].sort()
    const locationOpts = [...locationSet].sort()
    const updatedByOpts = [...updatedBySet].sort()
    return [
      { id: 'status', label: 'Status', options: opts(...(statusOpts.length ? statusOpts : ['Active', 'Inactive', 'Draft'])) },
      {
        id: 'channels',
        label: 'Channels',
        options: opts(...(channelOpts.length ? channelOpts : ['Voice call', 'Web chat', 'Text', 'Email', 'Facebook'])),
        multi: true,
      },
      {
        id: 'region',
        label: 'Region',
        options: opts(...(regionOpts.length ? regionOpts : ['North region', 'East region', 'South region', 'West region'])),
      },
      {
        id: 'location',
        label: 'Location',
        options: opts(...(locationOpts.length ? locationOpts : ['Mountain View', 'Palo Alto', 'San Jose', 'Sunnyvale'])),
      },
      {
        id: 'updatedBy',
        label: 'Updated by',
        options: opts(...(updatedByOpts.length ? updatedByOpts : [...UPDATED_BY_SAMPLES])),
        multi: true,
      },
    ]
  }, [data])

  const librarySource: CreateLibraryCard[] =
    isReviewResponse
      ? REVIEW_RESPONSE_CREATE_CARDS
      : isReviewGeneration
        ? REVIEW_GENERATION_CREATE_CARDS.map((c) => ({ ...c }))
        : isReviewTagging
          ? REVIEW_TAGGING_CREATE_CARDS
          : isReminder
            ? REMINDER_CREATE_CARDS
            : isWaitlist
              ? WAITLIST_CREATE_CARDS
              : isPreVisit
                ? PREVISIT_CREATE_CARDS
                : isFrontdesk
                  ? HEALTHCARE_FRONTDESK_CREATE_CARDS
                  : (DENTAL_AGENT_LIBRARY[agentName] ?? LIBRARY_TEMPLATES).map((c) => ({ ...c }))
  const libraryCards = librarySource.map((tpl) => ({
    title: tpl.title,
    description: tpl.description,
    glyph: tpl.glyph,
    tone: tpl.tone,
    actionLabel: 'Use agent' as const,
    onAction: () => onEditAgent?.(tpl.title),
    onPreview: () => setLibraryPreview(toLibraryPreviewData(tpl, { product, agentName })),
  }))

  const searchQ = searchQuery.trim().toLowerCase()
  const visibleData = useMemo(() => {
    const filtered = data.filter((row) => {
      if (searchQ && !row.name.toLowerCase().includes(searchQ)) return false
      if (!matchesStatusFilter(row, agentFilters.status ?? [])) return false
      if (!matchesChannelFilter(row.channels, agentFilters.channels ?? [])) return false
      const regionPicked = agentFilters.region ?? []
      if (
        regionPicked.length &&
        !regionPicked.some((r) => r.toLowerCase() === (row.region ?? '').toLowerCase())
      ) {
        return false
      }
      const locationPicked = agentFilters.location ?? []
      if (
        locationPicked.length &&
        !locationPicked.some((l) => l.toLowerCase() === (row.locationName ?? '').toLowerCase())
      ) {
        return false
      }
      const updatedByPicked = agentFilters.updatedBy ?? []
      if (
        updatedByPicked.length &&
        !updatedByPicked.some((u) => u.toLowerCase() === (row.updatedBy ?? '').toLowerCase())
      ) {
        return false
      }
      return true
    })

    return [...filtered].sort(
      (a, b) =>
        parseAgentsUpdatedMs(b.lastUpdated) - parseAgentsUpdatedMs(a.lastUpdated) ||
        a.name.localeCompare(b.name),
    )
  }, [data, searchQ, agentFilters])

  const visibleLibraryCards = searchQ
    ? libraryCards.filter(
        (card) => card.title.toLowerCase().includes(searchQ) || card.description.toLowerCase().includes(searchQ),
      )
    : libraryCards
  const isReviewTaggingFirstTime = isReviewTagging && visibleData.length === 0

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


  if (showCreateFlow && isLibraryOnlyCreate) {
    const chatHistoryTitle = isReviewResponse
      ? 'Reviews AI'
      : isWaitlist
        ? 'Waitlist'
        : isPreVisit
          ? 'Pre-visit'
          : 'Reminder'
    const emptyCards = isReviewResponse
      ? REVIEW_RESPONSE_CREATE_CARDS
      : isWaitlist
        ? WAITLIST_CREATE_CARDS
        : isPreVisit
          ? PREVISIT_CREATE_CARDS
          : REMINDER_CREATE_CARDS
    const scratchName = isReviewResponse
      ? 'Review response agent 1'
      : isWaitlist
        ? 'Waitlist agent 1'
        : isPreVisit
          ? 'Pre-visit agent 1'
          : 'Reminder agent 1'
    const fallbackLibraryName = isReviewResponse
      ? 'Review response agent'
      : isWaitlist
        ? 'Waitlist agent'
        : isPreVisit
          ? 'Pre-visit agent'
          : 'Reminder agent'
    return (
      <div className="flex h-full flex-col">
        <TopNav title={chatHistoryTitle} initials="S" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
          <div className="flex h-16 shrink-0 items-center gap-sm bg-surface px-2xl">
            <button
              type="button"
              onClick={() => setShowCreateFlow(false)}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              aria-label="Back"
            >
              <Icon name="arrow_back" size={20} />
            </button>
            <h1 className="text-h3 text-text-primary">Back</h1>
          </div>
          <div className="scrollbar-subtle flex min-h-0 flex-1 items-start justify-center overflow-auto px-lg pb-lg">
            <CreateAgentEmptyState
              key={createFlowKey}
              cards={emptyCards}
              fromScratchLabel="Create from scratch"
              onCreateFromScratch={() => {
                setShowCreateFlow(false)
                onEditAgent?.(scratchName)
              }}
              onSelectFromLibrary={(templateId) => {
                const card = emptyCards.find((c) => c.id === templateId)
                setShowCreateFlow(false)
                onEditAgent?.(card?.title ?? fallbackLibraryName)
              }}
              onPreview={(card) => setLibraryPreview(toLibraryPreviewData(card, { product, agentName }))}
            />
          </div>
        </div>
        <AgentLibraryPreviewModal
          open={libraryPreview != null}
          data={libraryPreview}
          onClose={() => setLibraryPreview(null)}
          onUseAgent={() => {
            if (!libraryPreview) return
            const name = libraryPreview.name
            setLibraryPreview(null)
            setShowCreateFlow(false)
            onEditAgent?.(name)
          }}
        />
      </div>
    )
  }

  if (showCreateFlow && (isFrontdesk || isReminder || isReviewResponse || isReviewGeneration)) {
    const isHealthcareFrontdesk = product === 'healthcare'
    const chatHistoryTitle = (isReviewResponse || isReviewGeneration) ? 'Reviews AI' : isReminder ? 'Reminder' : 'Front desk'
    const createVariant = isReminder ? 'reminder' : 'frontdesk'
    const staticChatHistory = isFrontdesk ? FRONTDESK_CHAT_HISTORY : REMINDER_CHAT_HISTORY
    const chatHistoryItems = [
      ...savedCreateChats.filter((c) => !c.variant || c.variant === createVariant),
      ...staticChatHistory,
    ]
    const historyChat = chatHistorySelectedId
      ? chatHistoryItems.find((item) => item.id === chatHistorySelectedId) ?? null
      : null
    const createWorkflowAgentName = createDraftAgentName
      ?? (isReviewResponse
        ? REVIEW_RESPONSE_BUILD_CARD.title
        : isReviewGeneration
          ? 'Review generation agent'
          : isReminder
            ? REMINDER_BUILD_CARD.title
            : FRONTDESK_BUILD_CARD.title)
    const isReviewsCreateFlow = isReviewResponse || isReviewGeneration
    const reviewsCreateInnerTitle = isReviewResponse
      ? 'Review response agent 1'
      : isReviewGeneration
        ? 'Review generation agent 1'
        : null
    const showReviewsCreateInnerTitle =
      isReviewsCreateFlow && (createFlowSubmitted || createWorkflowOpen)
    const showGhostwriterShellHeader =
      (createFlowSubmitted || createAiFullscreen) && !createWorkflowOpen
    const ghostwriterShellTitle = isReviewsCreateFlow
      ? (reviewsCreateInnerTitle ?? createWorkflowAgentName)
      : createWorkflowAgentName
    // Canvas uses floating chrome — hide the legacy create-flow LHS when the workflow is open.
    const hideCreateLeftFloater = createWorkflowOpen

    return (
      <div className="flex h-full">
        <div className="flex h-full min-w-0 flex-1 flex-col">
        <TopNav title={chatHistoryTitle} initials="S" />
        <div className="relative flex min-h-0 flex-1 overflow-hidden bg-surface">
          <section
            className={`z-10 shrink-0 transition-[width,top,transform,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
              hideCreateLeftFloater
                ? 'pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0'
                : createWorkflowOpen
                ? `lhs-drawer !absolute bottom-lg left-lg top-[calc(52px+theme(spacing.lg))] !h-auto !w-[360px] ${
                    createLeftPaneCollapsed ? 'pointer-events-none -translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
                  }`
                : 'relative flex h-full w-full flex-col overflow-hidden bg-surface'
            }`}
            aria-label={createWorkflowOpen && !hideCreateLeftFloater ? 'Create with AI conversation' : undefined}
            aria-hidden={hideCreateLeftFloater || (createWorkflowOpen && createLeftPaneCollapsed)}
          >
            {createWorkflowOpen && !hideCreateLeftFloater ? (
              // Match agent-builder LHSDrawer tab chrome exactly.
              <div className="lhs-drawer__tabs lhs-drawer__tabs--visible">
                <div className="lhs-drawer__tabs-list">
                  <button
                    type="button"
                    onClick={() => setCreateSideTab('ai')}
                    className={`lhs-drawer__tab${createSideTab === 'ai' ? ' lhs-drawer__tab--active' : ''}`}
                  >
                    <span className="lhs-drawer__tab-label">Create with AI</span>
                    <span className="lhs-drawer__tab-underline" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateSideTab('manual')}
                    className={`lhs-drawer__tab${createSideTab === 'manual' ? ' lhs-drawer__tab--active' : ''}`}
                  >
                    <span className="lhs-drawer__tab-label">Create manually</span>
                    <span className="lhs-drawer__tab-underline" />
                  </button>
                </div>
                <div className="lhs-drawer__tab-actions">
                  {createSideTab === 'ai' && (
                    <button
                      type="button"
                      onClick={expandCreateAiFullscreen}
                      className="lhs-drawer__collapse-btn"
                      aria-label="Full screen"
                      title="Full screen"
                    >
                      <Icon name="open_in_full" size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Collapse panel"
                    title="Collapse panel"
                    onClick={() => setCreateLeftPaneCollapsed(true)}
                    className="lhs-drawer__collapse-btn"
                  >
                    <Icon name="left_panel_close" size={18} />
                  </button>
                </div>
              </div>
            ) : showGhostwriterShellHeader ? (
              <CreateAiGhostwriterShellHeader
                title={ghostwriterShellTitle}
                onBack={() => {
                  if (createAiFullscreen) {
                    setCreateAiFullscreen(false)
                    if (createWorkflowMounted) openCreateWorkflow()
                    else setShowCreateFlow(false)
                    return
                  }
                  if (chatHistorySelectedId) selectAllChats()
                  else setShowCreateFlow(false)
                }}
                onViewAgentBuilder={openCreateWorkflow}
                showDraftBadge={Boolean(createDraftAgentName)}
                viewAgentBuilderDisabled={!createDraftAgentName}
              />
            ) : isReviewsCreateFlow ? (
              <CreateFlowPageHeader
                onBack={() => setShowCreateFlow(false)}
                title="Back"
              />
            ) : (
              // Landing view — standard flush-left page header.
              <div className="flex h-16 shrink-0 items-center gap-sm bg-surface px-2xl">
                <button
                  type="button"
                  onClick={() => setShowCreateFlow(false)}
                  className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                  aria-label="Back"
                >
                  <Icon name="arrow_back" size={20} />
                </button>
                <h1 className="text-h3 text-text-primary text-left">Back</h1>
              </div>
            )}
            <div
              className={`scrollbar-subtle flex min-h-0 flex-1 pt-0 ${
                createFlowSubmitted || createWorkflowOpen || createAiFullscreen
                  ? 'items-stretch overflow-visible'
                  : 'items-start overflow-auto pb-lg'
              } ${
                createWorkflowOpen
                  ? createSideTab === 'manual'
                    ? 'px-0 py-0'
                    : 'min-h-0'
                  : 'justify-center px-lg'
              }`}
            >
              {createWorkflowOpen && createSideTab === 'manual' && (
                <div className="h-full w-full min-h-0 [&_.lhs-drawer]:!h-full [&_.lhs-drawer]:!w-full [&_.lhs-drawer]:!max-w-none [&_.lhs-drawer]:!gap-0 [&_.lhs-drawer]:!overflow-hidden [&_.lhs-drawer]:!rounded-none [&_.lhs-drawer]:!border-0 [&_.lhs-drawer]:!bg-transparent [&_.lhs-drawer]:!shadow-none [&_.lhs-drawer]:!p-0 [&_.lhs-drawer\_\_body]:!p-0">
                  <LHSDrawer
                    defaultTab="Create manually"
                    defaultOpenSection="Tasks"
                    product={product ?? 'healthcare'}
                    agentName={createWorkflowAgentName}
                    procedures={procedureLibrary as never}
                  />
                </div>
              )}
              {(isReviewResponse || isReviewGeneration || isReminder || (isFrontdesk && isHealthcareFrontdesk)) ? (
                <div
                  className={
                    createWorkflowOpen && createSideTab === 'manual'
                      ? 'hidden'
                      : 'flex h-full min-h-0 w-full min-w-0 justify-center'
                  }
                >
                  <HealthcareFrontdeskCreateAgentScreen
                    key={createFlowKey}
                    onBack={() => {
                      if (chatHistorySelectedId) selectAllChats()
                      else setShowCreateFlow(false)
                    }}
                    onSubmittedChange={setCreateFlowSubmitted}
                    pageTitle={
                      showGhostwriterShellHeader
                        ? undefined
                        : showReviewsCreateInnerTitle
                          ? reviewsCreateInnerTitle ?? undefined
                          : undefined
                    }
                    hideHeaderBack={showGhostwriterShellHeader || isReviewsCreateFlow}
                    onCreateFromScratch={() => {
                      if (isReviewResponse) {
                        setShowCreateFlow(false)
                        onEditAgent?.('Review response agent 1')
                        return
                      }
                      if (isReviewGeneration) {
                        setShowCreateFlow(false)
                        onEditAgent?.('Review generation agent 1')
                        return
                      }
                      setShowSetupWizard(true)
                    }}
                    onSelectFromLibrary={(templateId) => {
                      if (isReviewResponse) {
                        const card = REVIEW_RESPONSE_CREATE_CARDS.find((c) => c.id === templateId)
                        setShowCreateFlow(false)
                        onEditAgent?.(card?.title ?? 'Review response agent')
                        return
                      }
                      if (isReviewGeneration) {
                        const card = REVIEW_GENERATION_CREATE_CARDS.find((c) => c.id === templateId)
                        setShowCreateFlow(false)
                        onEditAgent?.(card?.title ?? 'Review generation agent')
                        return
                      }
                      setShowCreateFlow(false)
                      onEditAgent?.('')
                    }}
                    onCreateAgent={handleCreateAgentSuccess}
                    onViewWorkflow={(isReminder || isFrontdesk || isReviewResponse || isReviewGeneration) ? openCreateWorkflow : undefined}
                    libraryCards={
                      isReminder
                        ? REMINDER_CREATE_CARDS
                        : isReviewResponse
                          ? REVIEW_RESPONSE_CREATE_CARDS
                          : isReviewGeneration
                            ? REVIEW_GENERATION_CREATE_CARDS
                            : undefined
                    }
                    initialPrompt={
                      historyChat?.prompt
                      ?? (isReminder
                        ? REMINDER_CREATE_PROMPT
                        : isReviewResponse
                          ? REVIEW_RESPONSE_CREATE_PROMPT
                          : isReviewGeneration
                            ? REVIEW_GENERATION_CREATE_PROMPT
                            : JOHN_CREATE_PROMPT)
                    }
                    autoStart={false}
                    historyChatId={chatHistorySelectedId}
                    historyChat={historyChat}
                    fromScratchLabel={(isReminder || isReviewResponse || isReviewGeneration) ? 'Create from scratch' : 'Setup manually'}
                    variant={
                      isReminder
                        ? 'reminder'
                        : isReviewResponse
                          ? 'review-response'
                          : isReviewGeneration
                            ? 'review-generation'
                            : 'frontdesk'
                    }
                    workflowVisible={createWorkflowOpen}
                    compactGreeting={(createWorkflowOpen || createAiFullscreen) && !createFlowSubmitted}
                    onDraftReady={setCreateDraftAgentName}
                    onCanvasProcedureChange={isReminder ? setCanvasProcedureId : undefined}
                    onInlineProcedureOpenChange={setInlineProcedureOpen}
                    canvasProcedureId={isReminder ? canvasProcedureId : undefined}
                  />
                </div>
              ) : (
                <CreateAgentEmptyState
                  key={createFlowKey}
                  cards={LIBRARY_TEMPLATES.map((c) => ({ ...c }))}
                  fromScratchLabel="Set up a new agent"
                  onCreateFromScratch={() => setShowSetupWizard(true)}
                  onSelectFromLibrary={(_templateId) => { setShowCreateFlow(false); onEditAgent?.('') }}
                />
              )}
            </div>
          </section>

          {createWorkflowOpen && createLeftPaneCollapsed && !(isReviewResponse || isReviewGeneration || isFrontdesk || isReminder) && (
            <button
              type="button"
              aria-label="Expand panel"
              title="Expand panel"
              onClick={() => setCreateLeftPaneCollapsed(false)}
              className="absolute left-lg top-[calc(52px+theme(spacing.lg))] z-10 flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon shadow-card hover:bg-surface-l2"
            >
              <Icon name="left_panel_open" size={20} />
            </button>
          )}

          {createWorkflowMounted && (isReminder || isFrontdesk || isReviewResponse || isReviewGeneration) && (
            <section
              className={`overflow-hidden transition-[width,opacity,transform] duration-300 ease-in-out motion-reduce:transition-none ${
                createWorkflowOpen
                  ? 'absolute inset-0 translate-x-0 opacity-100'
                  : 'absolute inset-y-0 right-0 w-0 translate-x-full opacity-0 pointer-events-none'
              }`}
              aria-hidden={!createWorkflowOpen}
            >
              <WorkflowEditorScreen
                agentName={
                  isReviewResponse
                    ? 'Review response agent - North Region'
                    : isReviewGeneration
                      ? 'Review generation agent - North Region'
                      : isReminder
                        ? 'Reminder agent - North region'
                        : 'Front desk agent - North region'
                }
                displayName={createWorkflowAgentName}
                agentStatus="Draft"
                product={product ?? 'healthcare'}
                onClose={closeCreateWorkflow}
                hideLhs
                existingAgent={false}
                hideTopIdentity={isExplorationAgents}
                hideCanvasStartNode={isExplorationHideCanvasStartNode(navId)}
                explorationChrome={isExplorationAgents}
                sep1Chrome={isExplorationAgents}
                llmTaskExplorationLayout={isLlmTaskExplorationLayout(navId)}
                createAiPanelOpen={false}
                onOpenAiFullscreen={expandCreateAiFullscreen}
                aiBuilderPanelOpen={createAiBuilderPanelOpen}
                onAiBuilderPanelOpenChange={setCreateAiBuilderPanelOpen}
                previewProcedureId={isReminder ? canvasProcedureId : null}
                previewProcedureDetail={
                  isReminder
                    ? canvasProcedureId === REMINDER_CALL_PROCEDURE_NAME
                      ? REMINDER_CALL_RHS_DETAIL
                      : (() => {
                          const found = HC_PROCEDURES.find((p) => p.name === canvasProcedureId)
                          return found ? procedureToRhsDetail(found) : null
                        })()
                    : null
                }
                onPreviewProcedureIdChange={isReminder ? setCanvasProcedureId : undefined}
              />
            </section>
          )}
        </div>
        </div>
      </div>
    )
  }

  if (selectedInstance) {
    const instanceStatus = data.find((d) => d.name === selectedInstance)?.status
    return (
      <>
        <AgentInstanceScreen
          key={`${selectedInstance}-${selectedInstanceDisplayName ?? ''}`}
          instanceName={selectedInstance}
          displayName={selectedInstanceDisplayName ?? undefined}
          status={instanceStatus}
          initialTab={routeDeep?.tab ?? instanceInitialTab}
          initialLogSlug={routeDeep?.logSlug}
          initialPanel={routeDeep?.panel}
          initialRecommendationIdFromRoute={routeDeep?.recId}
          onDeepRouteChange={(patch) =>
            onDeepRouteChange?.({
              instanceSlug: instanceSlugFromName(selectedInstance),
              tab: 'outcomes',
              ...patch,
            })
          }
          onBack={() => {
            setSelectedInstance(null)
            setSelectedInstanceDisplayName(null)
            setInstanceInitialTab('outcomes')
            onDeepRouteChange?.({})
          }}
          onEditAgent={onEditAgent}
          onNavigateToInbox={onNavigateToInbox}
          onOpenIntegrationSettings={onOpenIntegrationSettings}
          onFullBleedChange={setInstanceSetupActive}
          onFullBleedDetailActiveChange={onFullBleedDetailActiveChange}
          initialRecommendationId={
            initialRecommendationFocus?.instanceName === selectedInstance ? initialRecommendationFocus.recommendationId : null
          }
          initialFeedbackPrefill={
            initialRecommendationFocus?.instanceName === selectedInstance ? initialRecommendationFocus.feedbackPrefill ?? null : null
          }
          onInitialRecommendationConsumed={onInitialRecommendationFocusConsumed}
          product={product}
          workflowButtonOpensEditor={isExplorationAgents}
          hideRecommendationTab={navId === 'response-agents-sep-1'}
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
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <h1 className="text-h3 text-text-primary">{agentName}</h1>
            {!isReviewTaggingFirstTime && (
              <div className="flex items-center gap-sm">
                <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
                {activeTab === 'agents' ? (
                  <>
                    {showExplorationAgentsToggle && (
                      <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm">
                        <button
                          type="button"
                          aria-label="Card view"
                          onClick={() => setAgentsViewMode('grid')}
                          className={`flex size-6 items-center justify-center rounded-sm ${
                            agentsViewMode === 'grid' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
                          }`}
                        >
                          <Icon name="grid_view" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label="List view"
                          onClick={() => setAgentsViewMode('list')}
                          className={`flex size-6 items-center justify-center rounded-sm ${
                            agentsViewMode === 'list' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
                          }`}
                        >
                          <Icon name="table_rows" size={18} />
                        </button>
                      </div>
                    )}
                    {isReviewResponse && useExplorationGrid && (
                      <div className="relative" ref={cardLayoutMenuRef}>
                        <button
                          type="button"
                          onClick={() => setCardLayoutMenuOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={cardLayoutMenuOpen}
                          className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                        >
                          {CARD_LAYOUT_OPTIONS.find((opt) => opt.value === cardLayoutOption)?.label}
                          <Icon name="expand_more" size={18} />
                        </button>
                        {cardLayoutMenuOpen && (
                          <ul
                            role="listbox"
                            className="absolute right-0 top-full z-20 mt-xs min-w-[140px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
                          >
                            {CARD_LAYOUT_OPTIONS.map((opt) => (
                              <li key={opt.value}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={cardLayoutOption === opt.value}
                                  onClick={() => {
                                    setCardLayoutOption(opt.value)
                                    setCardLayoutMenuOpen(false)
                                  }}
                                  className="flex w-full items-center justify-between px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                                >
                                  {opt.label}
                                  {cardLayoutOption === opt.value && <Icon name="check" size={16} />}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        (isFrontdesk || isReminder || isWaitlist || isPreVisit || isReviewResponse || isReviewGeneration)
                          ? openCreateFlow()
                          : onEditAgent?.('')
                      }
                      className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                    >
                      Create agent
                    </button>
                    {(!isExplorationAgents || !useExplorationGrid) && (
                      <button type="button" aria-label="Customize columns" onClick={() => setCustomizeOpen(true)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                        <Columns3 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    )}
                    <button type="button" aria-label="Filters" onClick={() => setFilterOpen((o) => !o)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                      <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {isReviewTaggingFirstTime ? (
            <div className="scrollbar-subtle flex min-h-0 flex-1 items-start justify-center overflow-auto px-lg pb-lg">
              <CreateAgentEmptyState
                layout="build"
                libraryDefaultOpen
                cards={REVIEW_TAGGING_CREATE_CARDS}
                fromScratchLabel="Create from scratch"
                onCreateFromScratch={() => onEditAgent?.('Review tagging agent 1')}
                onSelectFromLibrary={(templateId) => {
                  const card = REVIEW_TAGGING_CREATE_CARDS.find((c) => c.id === templateId)
                  onEditAgent?.(card?.title ?? 'Review tagging agent')
                }}
                onPreview={(card) => setLibraryPreview(toLibraryPreviewData(card, { product, agentName }))}
              />
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="px-2xl">
                <Tabs
                  tabs={useExplorationOutcomesTab ? EXPLORATION_DETAIL_TABS : TABS}
                  activeTab={activeTab}
                  showBaseline={false}
                  onChange={(tabId) => {
                    setActiveTab(tabId)
                    onDeepRouteChange?.({ listTab: tabId })
                  }}
                />
              </div>

              {activeTab === 'outcomes' && useExplorationOutcomesTab ? (
                <>
                  <div className="px-2xl pt-lg">
                    <MetricTiles
                      metrics={displayMetrics}
                      renderTileAction={
                        isFrontdesk || isReviewResponse
                          ? (metric) =>
                              metric.id === 'timeSaved' ? (
                                <button
                                  type="button"
                                  aria-label={isReviewResponse ? 'Configure' : 'Estimate savings'}
                                  onClick={() => setSavingsModalOpen(true)}
                                  className="flex size-8 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                                >
                                  <Icon name="tune" size={18} />
                                </button>
                              ) : null
                          : undefined
                      }
                    />
                  </div>
                  {isReviewResponse ? <ReviewResponseOutcomesCharts /> : null}
                  <EstimateSavingsModal
                    open={savingsModalOpen}
                    onClose={() => setSavingsModalOpen(false)}
                    initialValues={savingsSettings}
                    copy={isReviewResponse ? REVIEW_RESPONSE_SAVINGS_COPY : undefined}
                    onSave={(values) => {
                      setSavingsSettings(values)
                      setSavingsModalOpen(false)
                    }}
                  />
                </>
              ) : activeTab === 'agents' ? (
                <>
                  {!useExplorationOutcomesTab && (
                    <>
                      <div className="px-2xl pt-lg">
                        <MetricTiles
                          metrics={displayMetrics}
                          renderTileAction={
                            isFrontdesk || isReviewResponse
                              ? (metric) =>
                                  metric.id === 'timeSaved' ? (
                                    <button
                                      type="button"
                                      aria-label={isReviewResponse ? 'Configure' : 'Estimate savings'}
                                      onClick={() => setSavingsModalOpen(true)}
                                      className="flex size-8 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                                    >
                                      <Icon name="tune" size={18} />
                                    </button>
                                  ) : null
                              : undefined
                          }
                        />
                      </div>
                      <EstimateSavingsModal
                        open={savingsModalOpen}
                        onClose={() => setSavingsModalOpen(false)}
                        initialValues={savingsSettings}
                        copy={isReviewResponse ? REVIEW_RESPONSE_SAVINGS_COPY : undefined}
                        onSave={(values) => {
                          setSavingsSettings(values)
                          setSavingsModalOpen(false)
                        }}
                      />
                    </>
                  )}
                  {useExplorationGrid ? (
                    // Dropdown: Default = icon card; R1 = metric-forward; R2 = compact + footer meta.
                    <div className="grid grid-cols-1 items-start gap-lg px-2xl py-lg sm:grid-cols-2 lg:grid-cols-3">
                      {visibleData.map((row) => {
                        const cardMetrics = isExplorationFrontDeskAgents
                          ? [
                              { value: row.interactions ?? '—', label: 'Conversations responded' },
                              { value: row.fcr ?? '—', label: 'Conversations resolved' },
                              { value: row.aht ?? '—', label: 'Resolution rate' },
                              { value: row.escalation ?? '—', label: 'Time saved' },
                            ]
                          : cardLayoutOption === 'default'
                            ? [
                                { value: row.reviewsResponded ?? '—', label: 'Reviews responded' },
                                { value: row.responseRate ?? '—', label: 'Response rate' },
                              ]
                            : [
                                { value: row.reviewsResponded ?? '—', label: 'Reviews responded' },
                                { value: row.responseRate ?? '—', label: 'Response rate' },
                                { value: row.avgResponseTime ?? '—', label: 'Average response time' },
                                { value: row.timeSaved ?? '—', label: 'Time saved' },
                              ]
                        // Default + R1: icon + draft under name. R3: View draft in header (no icon).
                        const isDefaultIconCard =
                          cardLayoutOption === 'default' || cardLayoutOption === 'r1'
                        const isR2Card = cardLayoutOption === 'r2'
                        // Default: 2 metrics + updated footer (former R3).
                        const isTwoMetricFooterCard = cardLayoutOption === 'default'
                        const updatedMeta = [
                          row.lastUpdated ? `Updated ${row.lastUpdated}` : null,
                          row.updatedBy ?? null,
                        ].filter(Boolean).join(' · ')

                        if (isR2Card) {
                          return (
                            <div
                              key={`${row.name}-${row.status}`}
                              className="group relative flex min-h-[188px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface p-md transition-colors hover:bg-surface-hover"
                            >
                              <div className="flex items-center justify-between gap-sm">
                                <LibraryCardIcon glyph="autonomous" size="sm" />
                                <div className="flex shrink-0 items-center gap-sm">
                                  {row.hasDraft ? (
                                    <>
                                      <Tooltip content="Draft · Rupa, 2h ago" variant="brief">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onEditAgent?.(row.name, undefined, undefined, 'Draft')
                                          }
                                          className="truncate text-body text-text-action hover:underline"
                                        >
                                          View draft
                                        </button>
                                      </Tooltip>
                                      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
                                    </>
                                  ) : null}
                                  <Chip label={row.status} variant={STATUS_VARIANT[row.status] ?? 'neutral'} />
                                </div>
                              </div>

                              <h3 className="mt-sm mb-lg line-clamp-2 min-w-0 text-body leading-[22px] tracking-[-0.28px] text-text-primary group-hover:text-text-action">
                                {row.name}
                              </h3>

                              <div className="flex content-start gap-2xl">
                                {(isExplorationFrontDeskAgents
                                  ? [
                                      { label: 'Conversations responded', value: row.interactions ?? '—' },
                                      { label: 'Conversations resolved', value: row.fcr ?? '—' },
                                    ]
                                  : [
                                      { label: 'Reviews responded', value: row.reviewsResponded ?? '—' },
                                      { label: 'Response rate', value: row.responseRate ?? '—' },
                                    ]
                                ).map((metric) => (
                                  <div key={metric.label} className="min-w-0 shrink-0">
                                    <div className="text-body text-text-primary">{metric.value}</div>
                                    <div className="text-small text-text-tertiary">{metric.label}</div>
                                  </div>
                                ))}
                              </div>

                              <div className="relative mt-auto min-h-9 pt-md">
                                <div className="flex min-w-0 items-center group-hover:invisible">
                                  <span className="min-w-0 truncate text-small text-text-tertiary">
                                    {updatedMeta || '—'}
                                  </span>
                                </div>
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => openAgentInstanceDetails(row)}
                                    className="flex h-9 flex-1 items-center justify-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                                  >
                                    View details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openAgentInstanceEditor(row)}
                                    className="flex h-9 flex-1 items-center justify-center rounded-sm bg-primary px-lg text-body text-white hover:bg-primary-hover"
                                  >
                                    Edit
                                  </button>
                                  <AgentInstanceMoreMenu row={row} items={agentInstanceCardOverflowMenuItems} />
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={`${row.name}-${row.status}`}
                            className="group relative flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface p-lg transition-colors hover:bg-surface-hover"
                          >
                            <div className="flex min-w-0 items-start justify-between gap-sm">
                              <div className="flex min-w-0 flex-1 flex-col gap-xs">
                                <div className="flex min-w-0 items-start gap-sm">
                                  {isDefaultIconCard && <LibraryCardIcon glyph="autonomous" />}
                                  <div className="flex min-w-0 flex-1 flex-col gap-xs">
                                    <button
                                      type="button"
                                      onClick={() => openAgentInstanceDetails(row)}
                                      className="min-w-0 truncate text-left text-body leading-[22px] tracking-[-0.28px] text-text-primary hover:text-text-action"
                                    >
                                      {row.name}
                                    </button>
                                    {isDefaultIconCard && row.hasDraft ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onEditAgent?.(row.name, undefined, undefined, 'Draft')
                                        }
                                        className="truncate text-left text-small text-text-action hover:underline"
                                      >
                                        Draft · Rupa, 2h ago
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-sm">
                                {!isDefaultIconCard && row.hasDraft ? (
                                  <>
                                    <Tooltip content="Draft · Rupa, 2h ago" variant="brief">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onEditAgent?.(row.name, undefined, undefined, 'Draft')
                                        }
                                        className="truncate text-body text-text-action hover:underline"
                                      >
                                        View draft
                                      </button>
                                    </Tooltip>
                                    <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
                                  </>
                                ) : null}
                                <Chip label={row.status} variant={STATUS_VARIANT[row.status] ?? 'neutral'} />
                              </div>
                            </div>
                            <div
                              className={
                                isTwoMetricFooterCard
                                  ? 'mt-lg grid grid-cols-2 content-start gap-sm'
                                  : isDefaultIconCard
                                    ? 'mt-sm grid grid-cols-3 content-start gap-sm'
                                    : 'mt-md grid grid-cols-3 content-start gap-md'
                              }
                            >
                              {cardMetrics.map((metric) => (
                                <div key={metric.label} className="min-w-0">
                                  <div className={isDefaultIconCard ? 'truncate text-body text-text-primary' : 'truncate text-h3 text-text-primary'}>
                                    {metric.value}
                                  </div>
                                  <div className="truncate text-small text-text-tertiary">{metric.label}</div>
                                </div>
                              ))}
                            </div>
                            {isTwoMetricFooterCard ? (
                              <div className="relative mt-auto min-h-9 pt-md">
                                <div className="flex min-w-0 items-center group-hover:invisible">
                                  <span className="min-w-0 truncate text-small text-text-tertiary">
                                    {updatedMeta || '—'}
                                  </span>
                                </div>
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => openAgentInstanceDetails(row)}
                                    className="flex h-9 flex-1 items-center justify-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                                  >
                                    View details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openAgentInstanceEditor(row)}
                                    className="flex h-9 flex-1 items-center justify-center rounded-sm bg-primary px-lg text-body text-white hover:bg-primary-hover"
                                  >
                                    Edit
                                  </button>
                                  <AgentInstanceMoreMenu row={row} items={agentInstanceCardOverflowMenuItems} />
                                </div>
                              </div>
                            ) : (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-sm bg-surface-hover px-lg pb-lg pt-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openAgentInstanceDetails(row)}
                                  className="flex h-9 flex-1 items-center justify-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                                >
                                  View details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAgentInstanceEditor(row)}
                                  className="flex h-9 flex-1 items-center justify-center rounded-sm bg-primary px-lg text-body text-white hover:bg-primary-hover"
                                >
                                  Edit
                                </button>
                                <AgentInstanceMoreMenu row={row} items={agentInstanceCardOverflowMenuItems} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-lg pb-lg pt-2xl">
                      <DataTable
                        columns={columns}
                        data={visibleData}
                        scrollOnHover
                        onRowClick={(row) => {
                          setInstanceInitialTab('outcomes')
                          setSelectedInstanceDisplayName(null)
                          setSelectedInstance(row.name)
                          onDeepRouteChange?.({ instanceSlug: instanceSlugFromName(row.name), tab: 'outcomes' })
                        }}
                        rowMenuItems={agentInstanceRowMenuItems}
                        rowClassName={(row) =>
                          // Equal inset + shared 24px live-line so metrics sit with Active name/chip.
                          row.hasDraft
                            ? '[&>td]:!h-auto [&>td]:align-top [&>td]:py-sm [&>td>span]:!flex [&>td>span]:h-7 [&>td>span]:items-center'
                            : ''
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-1 gap-lg px-2xl py-lg sm:grid-cols-2 lg:grid-cols-4">
                  {visibleLibraryCards.map((card) => (
                    <InfoCard key={card.title} {...card} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <FilterPanel
          open={filterOpen}
          fields={FILTER_FIELDS}
          selections={agentFilters}
          onSelectionsChange={setAgentFilters}
          onClose={() => setFilterOpen(false)}
        />
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

      <AgentLibraryPreviewModal
        open={libraryPreview != null}
        data={libraryPreview}
        onClose={() => setLibraryPreview(null)}
        onUseAgent={() => {
          if (!libraryPreview) return
          const name = libraryPreview.name
          setLibraryPreview(null)
          onEditAgent?.(name)
        }}
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

    </div>
  )
}
