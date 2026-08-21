import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Chip,
  DataTable,
  EmptyState,
  EstimateSavingsModal,
  REVIEW_RESPONSE_SAVINGS_COPY,
  parseTimeSavedHours,
  FilterPanel,
  HeaderSearchField,
  Icon,
  MetricTiles,
  Tabs,
  Toast,
  TopNav,
  type ChipVariant,
  type Column,
  type FilterField,
  type EstimateSavingsValues,
  type Metric,
  type Tab,
} from '../components'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import { AgentLogsTab, getLogFilterFields, getNavigableLogRows } from './AgentLogsTab'
import { OutboundAgentLogsTab } from './OutboundAgentLogsTab'
import { DENTAL_OUTBOUND_LOGS } from '../data/dentalOutboundLogs'
import { AgentSettingsTab } from './AgentSettingsTab'
import { WorkflowViewerTab } from './WorkflowViewerTab'
import { RecommendationsTab } from './RecommendationsTab'
import { RecommendationDetailScreen } from './RecommendationDetailScreen'
import { RunDetailView } from './RunDetailView'
import type { HealthcareLogRow } from '../data/healthcareAgentLogs'
import { AGENT_INSTANCE_ISSUE_COUNTS } from '../data/agentIssues'
import { getAgentWorkflows } from '../data/agentWorkflows'

interface AgentInstanceScreenProps {
  instanceName: string
  /** Overrides the header / start-node label (e.g. newly created draft name). */
  displayName?: string
  status?: string
  onBack: () => void
  /** `returnTo` tells the host where to navigate back to when the editor closes. */
  onEditAgent?: (
    agentName: string,
    draft?: unknown,
    returnTo?: { instanceName: string; tab: string },
    status?: string,
  ) => void
  onNavigateToInbox?: (conversationId?: string) => void
  /** Automotive-only: opens the Settings > Integrations sub-screen for a given integration
   *  (threaded through to `AgentSettingsTab`'s Integrations section). */
  onOpenIntegrationSettings?: (integrationId: string) => void
  /** Hide L2 SideNav while a full-bleed view (e.g. View log) is open. */
  onFullBleedChange?: (active: boolean) => void
  product?: string
  initialTab?: string
  /** Fires whenever a recommendation detail or log detail screen becomes the active view (or
   *  stops being it) — lets the app-level layout hide the secondary sidebar so that screen can go
   *  full-bleed. */
  onFullBleedDetailActiveChange?: (active: boolean) => void
  /** Set when the host app should jump straight to a specific recommendation (e.g. from a
   *  "Track your feedback" link in the Inbox) instead of the default Outcomes tab. */
  initialRecommendationId?: string | null
  onInitialRecommendationConsumed?: () => void
  /** When set alongside `initialRecommendationId`, the recommendation detail page immediately
   *  asks for the feedback itself (see the Taylor Brooks "Coach agent" direct-navigate flow). */
  initialFeedbackPrefill?: string | null
  /** Exploration-only behavior: Workflow action opens editor directly. */
  workflowButtonOpensEditor?: boolean
  /** Sep 1 review response flow hides Recommendation. */
  hideRecommendationTab?: boolean
}

interface LocationRow {
  location: string
  interactions?: string
  fcr?: string
  aht?: string
  escalation?: string
  count: string
  bookings?: string
  confirmed?: string
  confirmRate?: string
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
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'recommendation', label: 'Recommendation' },
  { id: 'logs', label: 'Logs' },
  { id: 'settings', label: 'Settings' },
]

// Exploration keeps Workflow as a separate button-style action.
// Review response exploration also hides Recommendation/Settings; Front desk keeps both.
const EXPLORATION_TABS: Tab[] = TABS.filter(
  (t) => t.id !== 'workflow' && t.id !== 'recommendation' && t.id !== 'settings',
)
const EXPLORATION_FRONTDESK_TABS: Tab[] = TABS.filter((t) => t.id !== 'workflow')

// Tagging & routing agent hides Recommendation and Settings — only Outcomes / Workflow / Logs apply.
const TAGGING_ROUTING_TABS: Tab[] = TABS.filter((t) => t.id !== 'settings' && t.id !== 'recommendation')

// Review response agents hide Settings.
const REVIEW_RESPONSE_TABS: Tab[] = TABS.filter((t) => t.id !== 'settings')
const REVIEW_RESPONSE_NO_RECOMMENDATION_TABS: Tab[] = TABS.filter(
  (t) => t.id !== 'settings' && t.id !== 'recommendation',
)

const METRICS_BY_AGENT: Record<string, Metric[]> = {
  'Front desk agent': [
    { id: 'responded', value: '8,200', label: 'Conversations responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total inbound conversations handled by this location in the selected period.' },
    { id: 'resolved', value: '7,380', label: 'Conversations resolved', delta: '2.1%', trend: 'up', info: true, tooltip: 'Conversations closed without requiring human escalation at this location.' },
    { id: 'resolutionRate', value: '90%', label: 'Resolution rate', delta: '1.8%', trend: 'up', info: true, tooltip: 'Percentage of conversations fully resolved by the agent. Calculated as resolved ÷ responded.' },
    { id: 'timeSaved', value: '18h', label: 'Time saved', delta: '12%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved based on average handle time for equivalent human-handled conversations.' },
  ],
  'Reminder agent': [
    { id: 'bookings', value: '112', label: 'Total bookings', delta: '18%', trend: 'up', info: true, tooltip: 'Total appointments booked at this location in the selected period.' },
    { id: 'confirmed', value: '27', label: 'Appointments confirmed', delta: '40.2%', trend: 'up', info: true, tooltip: 'Number of upcoming appointments confirmed by the patient via automated reminder outreach at this location, reducing the likelihood of a no-show.' },
    { id: 'confirmRate', value: '24.1%', label: 'Confirmation rate', delta: '18.5%', trend: 'up', info: true, tooltip: 'Percentage of total bookings where the patient confirmed attendance at this location. Calculated as appointments confirmed ÷ total bookings.' },
    { id: 'timeSaved', value: '8 min', label: 'Time saved', delta: '5.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved per confirmed appointment by automating reminder outreach and follow-up.' },
  ],
  'Waitlist agent': [
    { id: 'outreachSent', value: '1.4K', label: 'Outreach sent', delta: '12%', trend: 'up', info: true, tooltip: 'Total waitlist outreach messages sent by the agent at this location to fill open slots.' },
    { id: 'slotsFilled', value: '1.9K', label: 'Slots filled', delta: '36.6%', trend: 'up', info: true, tooltip: 'Number of open or cancelled slots successfully filled via waitlist outreach at this location.' },
    { id: 'fillRate', value: '23.7%', label: 'Fill rate', delta: '20%', trend: 'up', info: true, tooltip: 'Percentage of waitlisted patients who booked after receiving outreach. Calculated as slots filled ÷ outreach sent.' },
    { id: 'timeSaved', value: '2.5 hrs', label: 'Time saved', delta: '20%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved by automating waitlist outreach instead of manually calling through the list.' },
  ],
  'Pre-visit agent': [
    { id: 'outreach',   value: '1,000', label: 'Outreach sent',     delta: '1.3%', trend: 'up', info: true, tooltip: 'Total intake reminder outreach sent by the agent at this location in the selected period.' },
    { id: 'intakes',    value: '900',   label: 'Intakes completed',  delta: '1.3%', trend: 'up', info: true, tooltip: 'Number of patient intake forms fully completed following agent outreach at this location.' },
    { id: 'completion', value: '95%',   label: 'Completion rate',    delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of outreach that resulted in a completed intake. Calculated as intakes completed ÷ outreach sent.' },
    { id: 'timeSaved',  value: '32m',   label: 'Time saved',         delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating intake collection instead of manual follow-up calls.' },
  ],
  'Outreach agent': [
    { id: 'leads', value: '2,103', label: 'Leads contacted', delta: '3.7%', trend: 'up', info: true, tooltip: 'Total leads the agent reached out to at this location in the selected period.' },
    { id: 'response', value: '38%', label: 'Response rate', delta: '1.9%', trend: 'up', info: true, tooltip: 'Percentage of contacted leads that replied to the outreach.' },
    { id: 'appointments', value: '641', label: 'Appointments scheduled', delta: '5.4%', trend: 'up', info: true, tooltip: 'Leads that confirmed a visit or test drive after being contacted.' },
    { id: 'conversion', value: '11%', label: 'Conversion rate', delta: '0.7%', trend: 'up', info: true, tooltip: 'Percentage of contacted leads that resulted in a scheduled appointment. Calculated as appointments ÷ leads contacted.' },
  ],
  'Recall agent': [
    { id: 'patientsContacted', value: '852', label: 'Patients contacted', delta: '4.2%', trend: 'up', info: true, tooltip: 'Distinct patients who received at least one successfully delivered agent touch in the period. Base population = patients flagged recall-due (hygiene, dormant, or unscheduled treatment).' },
    { id: 'recallConversion', value: '68%', label: 'Recall conversion rate', delta: '2.1%', trend: 'up', info: true, tooltip: 'Share of contacted patients who booked a recare/recall appointment attributable to the agent within the attribution window.' },
    { id: 'staffHoursSaved', value: '94h', label: 'Staff hours saved', delta: '8.2%', trend: 'up', info: true, tooltip: 'Estimated staff hours saved by automating recall outreach — based on average time-per-manual-contact across converted patients.' },
    { id: 'revenueRecovered', value: '$31K', label: 'Revenue recovered', delta: '5.8%', trend: 'up', info: true, tooltip: 'Production value of attributed recare appointments, recognized on completion.' },
  ],
  'Revenue agent': [
    { id: 'balancesContacted', value: '455', label: 'Balances contacted', delta: '3.1%', trend: 'up', info: true, tooltip: 'Distinct A/R accounts that received ≥1 delivered agent touch about a balance. Base = balance ≥ threshold and aging ≥ threshold days, excluded (active plan / in collections / disputed).' },
    { id: 'amountCollected', value: '$35.5K', label: 'Amount collected', delta: '5.4%', trend: 'up', info: true, tooltip: 'Total payments completed that are attributable to the agent within the window (via agent-sent link or call).' },
    { id: 'arDaysReduced', value: '-28%', label: 'A/R days reduced', delta: '2.3%', trend: 'up', positiveDown: true, info: true, tooltip: 'Reduction in the balance-weighted average age of outstanding A/R versus baseline. Lower is better.' },
    { id: 'staffHoursSaved', value: '62h', label: 'Staff hours saved', delta: '6.4%', trend: 'up', info: true, tooltip: 'Staff time avoided by automating outreach touches.' },
  ],
  'Treatment plan agent': [
    { id: 'plansFollowedUp', value: '535', label: 'Plans followed up', delta: '6.0%', trend: 'up', info: true, tooltip: 'Distinct treatment plans that received ≥1 delivered agent touch. Base = presented, unscheduled plans aged ≥ T+3 days, not opted out / suppressed.' },
    { id: 'acceptanceRate', value: '61%', label: 'Acceptance rate', delta: '3.2%', trend: 'up', info: true, tooltip: 'Share of followed-up plans accepted (agreed + booked, or marked accepted) attributable to the agent within the window.' },
    { id: 'revenueUnlocked', value: '$223K', label: 'Revenue unlocked', delta: '7.1%', trend: 'up', info: true, tooltip: 'Estimated value of accepted + booked plans attributable to the agent.' },
    { id: 'staffHoursSaved', value: '88h', label: 'Staff hours saved', delta: '7.8%', trend: 'up', info: true, tooltip: 'Staff follow-up time avoided by automating outreach.' },
  ],
  'Tagging & routing agent': [
    { id: 'statusUpdated', value: '1000', label: 'Statuses updated', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total conversations that received an updated contact status at this location in the selected period.' },
    { id: 'conversationsAssigned', value: '900', label: 'Conversations assigned', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total conversations assigned to a team or user at this location.' },
    { id: 'conversationsManaged', value: '95%', label: 'Conversations managed', delta: '1.3%', trend: 'up', info: true, tooltip: 'Share of conversations tagged and routed end-to-end at this location.' },
    { id: 'timeSaved', value: '32m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating conversation tagging and routing at this location.' },
  ],
  // Registered under both the plural (agent-group) and singular (per-instance) keys, matching
  // the Review generation pattern below. Without a `timeSaved` tile the drilled-in screen would
  // fall back to DEFAULT_METRICS and have nothing to hang the Configure action on.
  'Review response agents': [
    { id: 'reviewsResponded', value: '835', label: 'Reviews responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total reviews the agent has replied to across all locations in the selected period.' },
    { id: 'responseRate', value: '92%', label: 'Response rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of eligible reviews that received a reply from the agent.' },
    { id: 'avgResponseTime', value: '20m', label: 'Average response time', delta: '1.3%', trend: 'up', info: true, tooltip: 'Average time from review receipt to published reply across all locations.' },
    { id: 'timeSaved', value: '6h 20m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating review responses.' },
  ],
  'Review response agent': [
    { id: 'reviewsResponded', value: '835', label: 'Reviews responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total reviews the agent has replied to across all locations in the selected period.' },
    { id: 'responseRate', value: '92%', label: 'Response rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of eligible reviews that received a reply from the agent.' },
    { id: 'avgResponseTime', value: '20m', label: 'Average response time', delta: '1.3%', trend: 'up', info: true, tooltip: 'Average time from review receipt to published reply across all locations.' },
    { id: 'timeSaved', value: '6h 20m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating review responses.' },
  ],
  'Review generation agents': [
    { id: 'reviewsReceived', value: '137', label: 'Reviews received', delta: '1.3%', trend: 'up', info: true, tooltip: 'The number of reviews that the business locations received as a result of the agent.' },
    { id: 'contactsReached', value: '150', label: 'Contacts reached', delta: '2.9%', trend: 'up', info: true, tooltip: 'Total unique contacts who received at least one review request via channel. A contact is counted once, even if they received multiple requests.' },
    { id: 'clickThroughRate', value: '5.1%', label: 'Click-through rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of unique contacts who clicked at least once on a review request received across email and text.' },
    { id: 'timeSaved', value: '5h', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Quantify operational efficiency gains from using the agent.' },
  ],
  'Review generation agent': [
    { id: 'reviewsReceived', value: '137', label: 'Reviews received', delta: '1.3%', trend: 'up', info: true, tooltip: 'The number of reviews that the business locations received as a result of the agent.' },
    { id: 'contactsReached', value: '150', label: 'Contacts reached', delta: '2.9%', trend: 'up', info: true, tooltip: 'Total unique contacts who received at least one review request via channel. A contact is counted once, even if they received multiple requests.' },
    { id: 'clickThroughRate', value: '5.1%', label: 'Click-through rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of unique contacts who clicked at least once on a review request received across email and text.' },
    { id: 'timeSaved', value: '5h', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Quantify operational efficiency gains from using the agent.' },
  ],
}

const DEFAULT_METRICS: Metric[] = [
  { id: 'interactions', value: '2,850', label: 'Interactions handled', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total customer interactions managed by the agent at this location in the selected period.' },
  { id: 'fcr', value: '92%', label: 'First contact resolution rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of interactions resolved on the first contact without follow-up.' },
  { id: 'aht', value: '2m', label: 'Average handle time', delta: '1.3%', trend: 'up', info: true, tooltip: 'Average duration of a single interaction from start to resolution.' },
  { id: 'escalation', value: '11%', label: 'Escalation rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of interactions escalated to a human agent. Lower is generally better.' },
]

const LOCATIONS_BY_AGENT: Record<string, LocationRow[]> = {
  'Front desk agent': [
    { location: 'Atlanta, GA',      interactions: '2,850', fcr: '2,565', aht: '90%', escalation: '6h', count: '124' },
    { location: 'Chicago, IL',      interactions: '2,140', fcr: '1,926', aht: '90%', escalation: '5h', count: '98'  },
    { location: 'Boston, MA',       interactions: '1,620', fcr: '1,458', aht: '90%', escalation: '4h', count: '76'  },
    { location: 'Philadelphia, PA', interactions: '1,590', fcr: '1,431', aht: '90%', escalation: '3h', count: '60'  },
  ],
  'Reminder agent': [
    { location: 'Atlanta, GA',      interactions: '590', fcr: '79%', aht: '1m 08s', escalation: '9%',  count: '124', bookings: '44', confirmed: '11', confirmRate: '25.0%', timeSaved: '8 min' },
    { location: 'Chicago, IL',      interactions: '440', fcr: '77%', aht: '1m 15s', escalation: '10%', count: '98',  bookings: '32', confirmed: '8',  confirmRate: '25.0%', timeSaved: '8 min' },
    { location: 'Boston, MA',       interactions: '360', fcr: '76%', aht: '1m 20s', escalation: '11%', count: '76',  bookings: '22', confirmed: '5',  confirmRate: '22.7%', timeSaved: '7 min' },
    { location: 'Philadelphia, PA', interactions: '290', fcr: '75%', aht: '1m 24s', escalation: '11%', count: '60',  bookings: '14', confirmed: '3',  confirmRate: '21.4%', timeSaved: '7 min' },
  ],
  'Outreach agent': [
    { location: 'Atlanta, GA',      interactions: '320', fcr: '44%', aht: '2m 40s', escalation: '8%',  count: '124' },
    { location: 'Chicago, IL',      interactions: '242', fcr: '42%', aht: '2m 48s', escalation: '9%',  count: '98'  },
    { location: 'Boston, MA',       interactions: '193', fcr: '40%', aht: '2m 55s', escalation: '10%', count: '76'  },
    { location: 'Philadelphia, PA', interactions: '165', fcr: '38%', aht: '3m 05s', escalation: '10%', count: '60'  },
  ],
  'Waitlist agent': [
    { location: 'Atlanta, GA',      count: '180', outreachSent: '390', slotsFilled: '380', fillRate: '34%', timeSaved: '1.8 hrs' },
    { location: 'Chicago, IL',      count: '140', outreachSent: '310', slotsFilled: '298', fillRate: '30%', timeSaved: '2.1 hrs' },
    { location: 'Boston, MA',       count: '110', outreachSent: '260', slotsFilled: '248', fillRate: '27%', timeSaved: '2.6 hrs' },
    { location: 'Philadelphia, PA', count: '70',  outreachSent: '190', slotsFilled: '178', fillRate: '24%', timeSaved: '3.0 hrs' },
  ],
  'Pre-visit agent': [
    { location: 'Atlanta, GA',      count: '124', interactions: '260', fcr: '238', aht: '95%', escalation: '9h' },
    { location: 'Chicago, IL',      count: '98',  interactions: '220', fcr: '198', aht: '94%', escalation: '8h' },
    { location: 'Boston, MA',       count: '76',  interactions: '280', fcr: '268', aht: '96%', escalation: '8h' },
    { location: 'Philadelphia, PA', count: '60',  interactions: '240', fcr: '196', aht: '93%', escalation: '7h' },
  ],
  'Recall agent': [
    { location: 'Atlanta, GA',      count: '124', patientsContacted: '234', recallConversionRate: '71%', staffHoursSaved: '24h', revenueRecovered: '$8.6K' },
    { location: 'Chicago, IL',      count: '98',  patientsContacted: '198', recallConversionRate: '69%', staffHoursSaved: '20h', revenueRecovered: '$7.2K' },
    { location: 'Boston, MA',       count: '76',  patientsContacted: '232', recallConversionRate: '67%', staffHoursSaved: '28h', revenueRecovered: '$8.4K' },
    { location: 'Philadelphia, PA', count: '60',  patientsContacted: '188', recallConversionRate: '65%', staffHoursSaved: '22h', revenueRecovered: '$6.8K' },
  ],
  'Revenue agent': [
    { location: 'Atlanta, GA',      count: '124', balancesContacted: '128', amountCollected: '$10.2K', arDaysReduced: '-30%', clickToPayRate: '76%', staffHoursSaved: '18h' },
    { location: 'Chicago, IL',      count: '98',  balancesContacted: '107', amountCollected: '$8.8K',  arDaysReduced: '-27%', clickToPayRate: '74%', staffHoursSaved: '14h' },
    { location: 'Boston, MA',       count: '76',  balancesContacted: '118', amountCollected: '$9.6K',  arDaysReduced: '-29%', clickToPayRate: '73%', staffHoursSaved: '16h' },
    { location: 'Philadelphia, PA', count: '60',  balancesContacted: '102', amountCollected: '$6.9K',  arDaysReduced: '-25%', clickToPayRate: '71%', staffHoursSaved: '14h' },
  ],
  'Treatment plan agent': [
    { location: 'Atlanta, GA',      count: '124', plansFollowedUp: '148', acceptanceRate: '63%', revenueUnlocked: '$62K',  callToBookingConversion: '48%', warmTransferRate: '9%',  avgTouchesToAccept: '2.0', staffHoursSaved: '24h' },
    { location: 'Chicago, IL',      count: '98',  plansFollowedUp: '132', acceptanceRate: '61%', revenueUnlocked: '$54K',  callToBookingConversion: '44%', warmTransferRate: '11%', avgTouchesToAccept: '2.1', staffHoursSaved: '20h' },
    { location: 'Boston, MA',       count: '76',  plansFollowedUp: '141', acceptanceRate: '59%', revenueUnlocked: '$58K',  callToBookingConversion: '41%', warmTransferRate: '12%', avgTouchesToAccept: '2.2', staffHoursSaved: '22h' },
    { location: 'Philadelphia, PA', count: '60',  plansFollowedUp: '114', acceptanceRate: '58%', revenueUnlocked: '$49K',  callToBookingConversion: '38%', warmTransferRate: '14%', avgTouchesToAccept: '2.3', staffHoursSaved: '18h' },
  ],
  'Tagging & routing agent': [
    { location: 'Atlanta, GA',     count: '500', statusUpdated: '500', conversationsAssigned: '400', conversationsManaged: '95%', timeSaved: '20m' },
    { location: 'Chicago, IL',     count: '250', statusUpdated: '400', conversationsAssigned: '200', conversationsManaged: '92%', timeSaved: '5m'  },
    { location: 'Los Angeles, CA', count: '200', statusUpdated: '50',  conversationsAssigned: '200', conversationsManaged: '88%', timeSaved: '10m' },
    { location: 'Stamford, CT',    count: '100', statusUpdated: '50',  conversationsAssigned: '100', conversationsManaged: '88%', timeSaved: '2m'  },
  ],
  'Review generation agent': [
    { location: 'Atlanta, GA',      count: '1', reviewsReceived: '30', contactsReached: '30', clickThroughRate: '4.9%', timeSaved: '1h' },
    { location: 'Stamford, CT',     count: '1', reviewsReceived: '20', contactsReached: '20', clickThroughRate: '4.8%', timeSaved: '1h' },
    { location: 'Los Angeles, CA',  count: '1', reviewsReceived: '20', contactsReached: '20', clickThroughRate: '5.3%', timeSaved: '1h' },
    { location: 'New York City, NY', count: '1', reviewsReceived: '20', contactsReached: '20', clickThroughRate: '5.4%', timeSaved: '1h' },
    { location: 'San Diego, CA',    count: '1', reviewsReceived: '20', contactsReached: '20', clickThroughRate: '5.1%', timeSaved: '20m' },
    { location: 'Las Vegas, NV',    count: '1', reviewsReceived: '20', contactsReached: '10', clickThroughRate: '4.7%', timeSaved: '20m' },
    { location: 'Chicago, IL',      count: '1', reviewsReceived: '7',  contactsReached: '10', clickThroughRate: '4.8%', timeSaved: '20m' },
  ],
  'Review response agent': [
    { location: 'Atlanta, GA',       count: '1', reviewsResponded: '19', responseRate: '90%', avgResponseTime: '1h 48m', timeSaved: '4h 20m' },
    { location: 'Stamford, CT',      count: '1', reviewsResponded: '9',  responseRate: '92%', avgResponseTime: '2h 05m', timeSaved: '2h 10m' },
    { location: 'Los Angeles, CA',   count: '1', reviewsResponded: '22', responseRate: '90%', avgResponseTime: '2h 22m', timeSaved: '2h 05m' },
    { location: 'New York City, NY', count: '1', reviewsResponded: '18', responseRate: '90%', avgResponseTime: '2h 10m', timeSaved: '2h 40m' },
    { location: 'San Diego, CA',     count: '1', reviewsResponded: '7',  responseRate: '95%', avgResponseTime: '2h 40m', timeSaved: '3h 05m' },
    { location: 'Las Vegas, NV',     count: '1', reviewsResponded: '3',  responseRate: '94%', avgResponseTime: '3h 05m', timeSaved: '2h 10m' },
    { location: 'Chicago, IL',       count: '1', reviewsResponded: '10', responseRate: '92%', avgResponseTime: '3h 05m', timeSaved: '3h 05m' },
  ],
}

const FRONTDESK_COLUMNS: Column<LocationRow>[] = [
  { key: 'location', label: 'Location', width: 240, sortable: true },
  { key: 'interactions', label: 'Conversations responded', width: 200, sortable: true },
  { key: 'fcr', label: 'Conversations resolved', width: 200, sortable: true },
  { key: 'aht', label: 'Resolution rate', width: 150, sortable: true },
  { key: 'escalation', label: 'Time saved', width: 130, sortable: true },
  {
    key: 'count',
    label: 'Locations',
    width: 150,
    sortable: true,
    render: (v) => (
      <span className="inline-flex items-center gap-xs">
        {String(v)}
        <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </span>
    ),
  },
]

const DEFAULT_COLUMNS: Column<LocationRow>[] = [
  { key: 'location', label: 'Location', width: 240, sortable: true },
  { key: 'interactions', label: 'Interactions handled', width: 190, sortable: true },
  { key: 'fcr', label: 'First contact resolution', width: 200, sortable: true },
  { key: 'aht', label: 'Average handle time', width: 190, sortable: true },
  { key: 'escalation', label: 'Escalation rate', width: 160, sortable: true },
  {
    key: 'count',
    label: 'Locations',
    width: 150,
    sortable: true,
    render: (v) => (
      <span className="inline-flex items-center gap-xs">
        {String(v)}
        <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </span>
    ),
  },
]

const STATUS_VARIANT: Record<string, ChipVariant> = {
  Running: 'success',
  Paused: 'warning',
  Draft: 'neutral',
}

const REMINDER_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',    label: 'Locations',             width: 240, sortable: true },
  { key: 'bookings',    label: 'Total bookings',        width: 160, sortable: true },
  { key: 'confirmed',   label: 'Appointments confirmed',width: 200, sortable: true },
  { key: 'confirmRate', label: 'Confirmation rate',     width: 170, sortable: true },
  { key: 'timeSaved',   label: 'Time saved',            width: 140, sortable: true },
]

const WAITLIST_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',    label: 'Location',           width: 220, sortable: true },
  { key: 'outreachSent',label: 'Outreach sent', width: 180, sortable: true },
  { key: 'slotsFilled', label: 'Slots filled',        width: 150, sortable: true },
  { key: 'fillRate',    label: 'Fill rate',            width: 130, sortable: true },
  { key: 'timeSaved',   label: 'Time saved',           width: 150, sortable: true },
]

const PRE_VISIT_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',     label: 'Location',         width: 220, sortable: true },
  { key: 'interactions', label: 'Outreach sent',    width: 160, sortable: true },
  { key: 'fcr',          label: 'Intakes completed', width: 180, sortable: true },
  { key: 'aht',          label: 'Completion rate',   width: 160, sortable: true },
  { key: 'escalation',   label: 'Time saved',        width: 140, sortable: true },
]

const RECALL_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',             label: 'Location',              width: 220, sortable: true },
  { key: 'patientsContacted',    label: 'Patients contacted',    width: 180, sortable: true },
  { key: 'recallConversionRate', label: 'Recall conversion rate',width: 200, sortable: true },
  { key: 'staffHoursSaved',      label: 'Staff hours saved',      width: 170, sortable: true },
  { key: 'revenueRecovered',     label: 'Revenue recovered',     width: 170, sortable: true },
]

const REVENUE_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',          label: 'Location',          width: 200, sortable: true },
  { key: 'balancesContacted', label: 'Balances contacted', width: 180, sortable: true },
  { key: 'amountCollected',   label: 'Amount collected',  width: 170, sortable: true },
  { key: 'arDaysReduced',     label: 'A/R days reduced',  width: 160, sortable: true },
  { key: 'clickToPayRate',    label: 'Click-to-pay rate', width: 160, sortable: true },
  { key: 'staffHoursSaved',   label: 'Staff hours saved', width: 160, sortable: true },
]

const TREATMENT_PLAN_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',               label: 'Location',                  width: 190, sortable: true },
  { key: 'plansFollowedUp',        label: 'Plans followed up',         width: 160, sortable: true },
  { key: 'acceptanceRate',         label: 'Acceptance rate',           width: 150, sortable: true },
  { key: 'revenueUnlocked',        label: 'Revenue unlocked',          width: 155, sortable: true },
  { key: 'callToBookingConversion',label: 'Call-to-booking conversion', width: 200, sortable: true },
  { key: 'avgTouchesToAccept',     label: 'Avg touches to accept',     width: 180, sortable: true },
  { key: 'staffHoursSaved',        label: 'Staff hours saved',         width: 155, sortable: true },
]

const TAGGING_ROUTING_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',              label: 'Locations',              width: 220, sortable: true },
  { key: 'statusUpdated',         label: 'Statuses updated',       width: 160, sortable: true },
  { key: 'conversationsAssigned', label: 'Conversations assigned', width: 180, sortable: true },
  { key: 'conversationsManaged',  label: 'Conversations managed',  width: 180, sortable: true },
  { key: 'timeSaved',             label: 'Time saved',             width: 140, sortable: true },
]

const REVIEW_GENERATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location', label: 'Location', width: 220, sortable: true },
  { key: 'reviewsReceived', label: 'Reviews received', width: 160, sortable: true },
  { key: 'contactsReached', label: 'Contacts reached', width: 160, sortable: true },
  { key: 'clickThroughRate', label: 'Click-through rate', width: 160, sortable: true },
  { key: 'timeSaved', label: 'Time saved', width: 140, sortable: true },
]

const REVIEW_RESPONSE_COLUMNS: Column<LocationRow>[] = [
  { key: 'location', label: 'Location', width: 220, sortable: true },
  { key: 'reviewsResponded', label: 'Reviews responded', width: 180, sortable: true },
  { key: 'responseRate', label: 'Response rate', width: 150, sortable: true },
  { key: 'avgResponseTime', label: 'Average response time', width: 190, sortable: true },
  { key: 'timeSaved', label: 'Time saved', width: 140, sortable: true },
]

export function AgentInstanceScreen({
  instanceName,
  displayName,
  status = 'Running',
  onBack,
  onEditAgent,
  onNavigateToInbox,
  onOpenIntegrationSettings,
  onFullBleedChange,
  product,
  initialTab = 'outcomes',
  onFullBleedDetailActiveChange,
  initialRecommendationId,
  onInitialRecommendationConsumed,
  initialFeedbackPrefill,
  workflowButtonOpensEditor = false,
  hideRecommendationTab = false,
}: AgentInstanceScreenProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [instanceStatus, setInstanceStatus] = useState(status)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedRun, setSelectedRun] = useState<HealthcareLogRow | null>(null)
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null)
  const [pendingFeedbackPrefill, setPendingFeedbackPrefill] = useState<string | null>(null)

  // Header search + filters. Outcomes and Logs each keep their own state — the two tabs search
  // different tables, so a query typed on one would be meaningless on the other.
  const [outcomesSearchOpen, setOutcomesSearchOpen] = useState(false)
  const [outcomesQuery, setOutcomesQuery] = useState('')
  const [outcomesFilterOpen, setOutcomesFilterOpen] = useState(false)
  const [outcomesFilters, setOutcomesFilters] = useState<Record<string, string[]>>({})
  const [logsSearchOpen, setLogsSearchOpen] = useState(false)
  const [logsQuery, setLogsQuery] = useState('')
  const [logsFilterOpen, setLogsFilterOpen] = useState(false)
  const [logsFilters, setLogsFilters] = useState<Record<string, string[]>>({})

  useEffect(() => {
    onFullBleedDetailActiveChange?.(selectedRecommendationId !== null || selectedRun !== null)
    return () => onFullBleedDetailActiveChange?.(false)
  }, [selectedRecommendationId, selectedRun, onFullBleedDetailActiveChange])

  useEffect(() => {
    if (!initialRecommendationId) return
    setActiveTab('recommendation')
    setSelectedRecommendationId(initialRecommendationId)
    setPendingFeedbackPrefill(initialFeedbackPrefill ?? null)
    onInitialRecommendationConsumed?.()
    // Only react to focus-id changes; consume callback is intentionally unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecommendationId])

  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [savingsSettings, setSavingsSettings] = useState<EstimateSavingsValues>({
    mode: 'time',
    minutesPerResolution: 5,
    wageCurrency: 'USD',
    hourlyWage: 40,
  })

  // Derive agent name from instance name (e.g. "Front desk agent - North region" → "Front desk agent")
  const agentName = instanceName.replace(/ - .+$/, '')
  const shownName = displayName ?? instanceName
  const isReviewResponse = /review response agent/i.test(agentName)
  const isReviewGeneration = /review generation agent/i.test(agentName)
  const reviewGenerationKey = 'Review generation agent'

  const handleDownloadAgent = () => {
    const workflows = getAgentWorkflows(product)
    const workflow =
      workflows[instanceName]
      ?? workflows[agentName]
      ?? workflows['Review response agent']
      ?? { nodes: [], nodeDetails: {} }

    const payload = {
      name: shownName,
      agentType: agentName,
      status: instanceStatus,
      exportedAt: new Date().toISOString(),
      nodes: workflow.nodes ?? [],
      nodeDetails: workflow.nodeDetails ?? {},
    }

    const fileName = `${shownName.replace(/\s+/g, '-').toLowerCase() || 'agent'}.json`
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    setToastMessage(`${fileName} has been downloaded`)
    setToastVisible(true)
  }

  useEffect(() => {
    onFullBleedChange?.(Boolean(selectedRun) && (isReviewResponse || isReviewGeneration))
    return () => onFullBleedChange?.(false)
  }, [selectedRun, isReviewResponse, isReviewGeneration, onFullBleedChange])
  const metrics: Metric[] = (
    isReviewGeneration
      ? METRICS_BY_AGENT[reviewGenerationKey]
      : METRICS_BY_AGENT[agentName]
  ) ?? DEFAULT_METRICS
  const isFrontdeskAgent = agentName === 'Front desk agent'
  const explorationFrontDeskStatus = workflowButtonOpensEditor && isFrontdeskAgent
  const displayMetrics: Metric[] = isFrontdeskAgent || isReviewResponse
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
  const COLUMNS =
    agentName === 'Reminder agent'        ? REMINDER_COLUMNS
    : agentName === 'Front desk agent'    ? FRONTDESK_COLUMNS
    : agentName === 'Waitlist agent'      ? WAITLIST_COLUMNS
    : agentName === 'Pre-visit agent'     ? PRE_VISIT_COLUMNS
    : agentName === 'Recall agent'        ? RECALL_COLUMNS
    : agentName === 'Revenue agent'       ? REVENUE_COLUMNS
    : agentName === 'Treatment plan agent'? TREATMENT_PLAN_COLUMNS
    : agentName === 'Tagging & routing agent' ? TAGGING_ROUTING_COLUMNS
    : isReviewGeneration                  ? REVIEW_GENERATION_COLUMNS
    : isReviewResponse                    ? REVIEW_RESPONSE_COLUMNS
    : DEFAULT_COLUMNS
  const locations = (
    isReviewGeneration
      ? LOCATIONS_BY_AGENT[reviewGenerationKey]
      : isReviewResponse
        ? LOCATIONS_BY_AGENT['Review response agent']
        : LOCATIONS_BY_AGENT[agentName]
  ) ?? LOCATIONS_BY_AGENT['Front desk agent']

  /* ─── Header search + filters (Outcomes and Logs tabs only) ─── */
  // Front desk and the two review agents get the header controls; other agents are unchanged.
  const supportsHeaderSearch = isFrontdeskAgent || isReviewResponse || isReviewGeneration
  const isOutcomesTab = activeTab === 'outcomes'
  const isLogsTab = activeTab === 'logs'
  const showHeaderSearch = supportsHeaderSearch && (isOutcomesTab || isLogsTab)

  // Outcomes filters by location, sourced from the rows actually on screen.
  const outcomesFilterFields: FilterField[] = [
    {
      id: 'location',
      label: 'Location',
      options: Array.from(new Set(locations.map((l) => String(l.location)))).map((v) => ({
        value: v,
        label: v,
      })),
    },
  ]
  const outcomesQ = outcomesQuery.trim().toLowerCase()
  const visibleLocations = locations.filter((row) => {
    if (
      outcomesQ &&
      !Object.values(row).some((v) => typeof v === 'string' && v.toLowerCase().includes(outcomesQ))
    ) {
      return false
    }
    const picked = outcomesFilters.location
    return !picked?.length || picked.includes(String(row.location))
  })

  const isTaggingRouting = agentName === 'Tagging & routing agent'
  const tabs = workflowButtonOpensEditor
    ? (isFrontdeskAgent ? EXPLORATION_FRONTDESK_TABS : EXPLORATION_TABS)
    : isTaggingRouting
    ? TAGGING_ROUTING_TABS
    : isReviewResponse || isReviewGeneration
      ? hideRecommendationTab
        ? REVIEW_RESPONSE_NO_RECOMMENDATION_TABS
        : REVIEW_RESPONSE_TABS
      : TABS

  const isWorkflowTab = activeTab === 'workflow'
  const isRecommendationTab = activeTab === 'recommendation'
  const hideRecommendations = isReviewResponse || isReviewGeneration
  // A Draft instance hasn't handled any real conversations yet, so there's nothing to log.
  const isDraftInstance = instanceStatus === 'Draft'
  const isFullBleedDetail = selectedRecommendationId !== null || selectedRun !== null
  // TopNav product title only when L2 SideNav is hidden (full-bleed run / recommendation).
  const topNavTitle = isFullBleedDetail
    ? (hideRecommendations ? 'Reviews AI' : 'Front desk')
    : undefined
  const issueCount = AGENT_INSTANCE_ISSUE_COUNTS[instanceName] ?? 0
  const showHealthcareLogs =
    activeTab === 'logs' && !isDraftInstance && product === 'healthcare' && (agentName === 'Front desk agent' || agentName === 'Reminder agent' || agentName === 'Pre-visit agent' || agentName === 'Waitlist agent' || agentName === 'Tagging & routing agent' || isReviewResponse || isReviewGeneration)
  const dentalOutboundLogRows = DENTAL_OUTBOUND_LOGS[agentName]
  const showDentalOutboundLogs =
    activeTab === 'logs' && !isDraftInstance && product === 'dental' && Boolean(dentalOutboundLogRows)
  const showEmptyDraftLogs = activeTab === 'logs' && isDraftInstance

  if (selectedRun) {
    const navigableRuns = getNavigableLogRows(agentName, logsQuery, logsFilters, {
      explorationFrontDeskStatus,
    })
    return (
      <div className="flex h-full flex-col">
        <TopNav title={topNavTitle} initials="S" />
        <div className="min-h-0 flex-1 overflow-hidden">
          <RunDetailView
            row={selectedRun}
            instanceName={instanceName}
            runs={navigableRuns}
            onSelectRun={setSelectedRun}
            onBack={() => setSelectedRun(null)}
            onEditAgent={() => onEditAgent?.(instanceName)}
            explorationFrontDeskStatus={explorationFrontDeskStatus}
            onTrackFeedback={(recommendationId) => {
              setSelectedRun(null)
              setActiveTab('recommendation')
              setSelectedRecommendationId(recommendationId)
            }}
          />
        </div>
      </div>
    )
  }

  if (selectedRecommendationId) {
    return (
      <div className="flex h-full flex-col">
        <TopNav title={topNavTitle} initials="S" />
        <div className="min-h-0 flex-1 overflow-hidden">
          <RecommendationDetailScreen
            recommendationId={selectedRecommendationId}
            onBack={() => setSelectedRecommendationId(null)}
            autoOpenFeedbackPrefill={pendingFeedbackPrefill}
            onAutoOpenFeedbackConsumed={() => setPendingFeedbackPrefill(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav title={topNavTitle} initials="S" />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
            <div className="flex items-center gap-sm">
              <button
                type="button"
                aria-label="Back"
                onClick={onBack}
                className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
              >
                <BackArrowIcon />
              </button>
              <h1 className="text-h3 text-text-primary">{shownName}</h1>
              <Chip label={instanceStatus} variant={STATUS_VARIANT[instanceStatus] ?? 'neutral'} />
            </div>
            <div className="flex items-center gap-sm">
              {isWorkflowTab && issueCount > 0 && (
                <span className="flex items-center gap-xs text-small text-text-secondary">
                  <Icon name="error" size={14} className="text-chip-danger-text" />
                  {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
                </span>
              )}
              {showHeaderSearch && (
                <HeaderSearchField
                  open={isOutcomesTab ? outcomesSearchOpen : logsSearchOpen}
                  value={isOutcomesTab ? outcomesQuery : logsQuery}
                  onOpenChange={isOutcomesTab ? setOutcomesSearchOpen : setLogsSearchOpen}
                  onChange={isOutcomesTab ? setOutcomesQuery : setLogsQuery}
                />
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((open) => !open)}
                  className="flex h-[34px] items-center gap-sm rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                >
                  Actions
                  {actionsOpen ? <ChevronUp className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth /> : <ChevronDown className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
                </button>
                {actionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[105]"
                      onClick={() => setActionsOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                      <button
                        type="button"
                        className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                        onClick={() => {
                          setActionsOpen(false)
                          onEditAgent?.(
                            instanceName,
                            undefined,
                            { instanceName, tab: activeTab },
                            workflowButtonOpensEditor ? instanceStatus : undefined,
                          )
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                        onClick={() => {
                          setInstanceStatus('Paused')
                          setActionsOpen(false)
                        }}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                        onClick={() => setActionsOpen(false)}
                      >
                        Duplicate
                      </button>
                      {workflowButtonOpensEditor && (
                        <button
                          type="button"
                          className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                          onClick={() => {
                            setActionsOpen(false)
                            handleDownloadAgent()
                          }}
                        >
                          Download agent
                        </button>
                      )}
                      <button
                        type="button"
                        className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
                        onClick={() => {
                          setActionsOpen(false)
                          onBack()
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
              {activeTab === 'settings' && (
                <button
                  type="button"
                  className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                >
                  Save
                </button>
              )}
              {/* Filters always sits last in the header row. */}
              {showHeaderSearch && (
                <button
                  type="button"
                  aria-label="Filters"
                  onClick={() =>
                    isOutcomesTab ? setOutcomesFilterOpen((o) => !o) : setLogsFilterOpen((o) => !o)
                  }
                  className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                >
                  <Icon name="filter_list" size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex shrink-0 items-center justify-between px-2xl">
            {workflowButtonOpensEditor ? (
              <div className="flex items-end gap-md">
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={(tabId) => {
                    setActiveTab(tabId)
                  }}
                />
                <span aria-hidden="true" className="mb-[10px] h-4 w-px shrink-0 self-end bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    if (onEditAgent) {
                      onEditAgent(instanceName, undefined, { instanceName, tab: 'outcomes' }, instanceStatus)
                      return
                    }
                    setActiveTab('workflow')
                  }}
                  className={`flex h-[34px] items-center rounded-md px-sm text-body transition-colors ${
                    isWorkflowTab
                      ? 'bg-surface-selected text-text-primary'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  Workflow
                </button>
              </div>
            ) : (
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(tabId) => {
                  setActiveTab(tabId)
                }}
              />
            )}
          </div>

          {/* Tab content — workflow and recommendation tabs fill remaining height, others scroll */}
          {isWorkflowTab ? (
            <WorkflowViewerTab
              instanceName={instanceName}
              displayName={shownName}
              onEdit={() =>
                onEditAgent?.(
                  instanceName,
                  undefined,
                  { instanceName, tab: workflowButtonOpensEditor ? 'outcomes' : 'workflow' },
                  workflowButtonOpensEditor ? instanceStatus : undefined,
                )
              }
              product={product}
            />
          ) : isRecommendationTab ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RecommendationsTab
                agentName={instanceName}
                onSelect={setSelectedRecommendationId}
                isDraft={isDraftInstance}
                empty={hideRecommendations}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {activeTab === 'outcomes' ? (
                <>
                  <div className="px-2xl pt-lg">
                    <MetricTiles
                      metrics={displayMetrics}
                      renderTileAction={
                        isFrontdeskAgent || isReviewResponse
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
                  <div className="px-lg py-lg">
                    <DataTable
                      columns={COLUMNS}
                      data={visibleLocations}
                      scrollOnHover
                      initialSortKey={isReviewResponse ? 'reviewsResponded' : undefined}
                      initialSortDir={isReviewResponse ? 'desc' : undefined}
                    />
                  </div>
                </>
              ) : showEmptyDraftLogs ? (
                <div className="flex h-full items-center justify-center px-lg py-lg">
                  <EmptyState
                    title="No logs yet"
                    description="This agent is still in draft and hasn't handled any conversations yet, so there's nothing to log."
                  />
                </div>
              ) : showHealthcareLogs ? (
                <AgentLogsTab
                  agentName={agentName}
                  onNavigateToInbox={onNavigateToInbox}
                  onViewRun={setSelectedRun}
                  searchQuery={supportsHeaderSearch ? logsQuery : ''}
                  filters={supportsHeaderSearch ? logsFilters : undefined}
                  explorationFrontDeskStatus={explorationFrontDeskStatus}
                />
              ) : showDentalOutboundLogs ? (
                <OutboundAgentLogsTab rows={dentalOutboundLogRows!} />
              ) : activeTab === 'settings' ? (
                <AgentSettingsTab
                  product={product}
                  agentName={agentName}
                  onOpenIntegrationSettings={onOpenIntegrationSettings}
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-body text-text-secondary">
                  No {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} data yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Push-panel filter, sibling of the content column so it squeezes rather than overlays. */}
        {showHeaderSearch && (
          <FilterPanel
            open={isOutcomesTab ? outcomesFilterOpen : logsFilterOpen}
            fields={isOutcomesTab ? outcomesFilterFields : getLogFilterFields(agentName, { explorationFrontDeskStatus })}
            selections={isOutcomesTab ? outcomesFilters : logsFilters}
            onSelectionsChange={isOutcomesTab ? setOutcomesFilters : setLogsFilters}
            onClose={() =>
              isOutcomesTab ? setOutcomesFilterOpen(false) : setLogsFilterOpen(false)
            }
          />
        )}
      </div>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  )
}
