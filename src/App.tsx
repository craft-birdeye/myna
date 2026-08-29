import { useEffect, useRef, useState } from 'react'
import { FRONT_DESK_INBOX_CONVERSATION_ID } from './data/frontDeskCallConversation'
import { ProcedureStoreProvider } from './data/ProcedureStoreContext'
import { AgentSystemPromptStoreProvider } from './data/AgentSystemPromptStoreContext'
import { FeedbackRecommendationsStoreProvider } from './data/FeedbackRecommendationsStoreContext'
import { RecommendationOverridesStoreProvider } from './data/RecommendationOverridesStoreContext'
import type { WizardAgentDraft } from './data/wizardAgentConfig.types'
import {
  isAgentExplorationChrome,
  isExplorationHideCanvasStartNode,
  isSep1Chrome,
  RESPONSE_AGENTS_SEP1_NAV_ID,
} from './data/agentNavIds'
import { parseDeepSegments, serializeDeep, type DeepRoute } from './appRoutes'
import { AiAssistPanel, Icon, IconRail, Link, RecordDetailScreen, SideNav, Toast, TopNav, type NavSection, type RailGroup, type Product } from './components'
import { AiCoachSparkleIcon } from './assets/AiCoachSparkleIcon'
import { ContentHubL2NavPanel, type ContentHubSubView } from './content-hub/ContentHubL2NavPanel'
import { SearchAIView } from './search-ai/SearchAIView'
import { SearchAIL2NavPanel } from './search-ai/SearchAIL2NavPanel'
import { SocialView } from './social/SocialView'
import { SocialL2NavPanel } from './social/SocialL2NavPanel'
import { SEARCH_AI_L2_DEFAULT_ACTIVE } from './search-ai/searchAIL2Keys'
import { ProjectsView } from './content-hub/ProjectsView'
import { TemplateGallery } from './content-hub/TemplateGallery'
import { CalendarView } from './content-hub/CalendarView'
import { ContentEditorShell } from './content-hub/editor/ContentEditorShell'
import { CreateBlogPage } from './content-hub/blog/CreateBlogPage'
import type { BlogFlowData } from './content-hub/blog/BlogInlineCreationFlow'
import { ManageAppointmentsScreen, buildAppointmentDetailProps, type AppointmentDetailArgs } from './screens/ManageAppointmentsScreen'
import { SalesPipelineScreen, buildLeadDetailProps, type LeadDetailArgs } from './screens/SalesPipelineScreen'
import { ServiceRequestsScreen, buildServiceRequestDetailProps, type ServiceRequestDetailArgs } from './screens/ServiceRequestsScreen'
import { IntakeScreen, type IntakeDetailArgs } from './screens/IntakeScreen'
import { IntakePatientDetailScreen } from './screens/IntakePatientDetailScreen'
import { AppointmentOverviewScreen } from './screens/AppointmentOverviewScreen'
import { SalesScreen } from './screens/SalesScreen'
import { ServiceScreen } from './screens/ServiceScreen'
import { ProvidersScreen } from './screens/ProvidersScreen'
import { AppointmentTypeScreen } from './screens/AppointmentTypeScreen'
import { AvailabilityScreen } from './screens/AvailabilityScreen'
import { AutoAppointmentTypeScreen } from './screens/AutoAppointmentTypeScreen'
import { AutoAvailabilityScreen } from './screens/AutoAvailabilityScreen'
import { HCFrontdeskOverviewScreen } from './screens/HCFrontdeskOverviewScreen'
import { HCNoShowsScreen } from './screens/HCNoShowsScreen'
import { HCWaitlistFilledScreen } from './screens/HCWaitlistFilledScreen'
import { HCIntakesCompletedScreen } from './screens/HCIntakesCompletedScreen'
import { DentalRevenueScreen } from './screens/DentalRevenueScreen'
import { ManageTreatmentPlansScreen } from './screens/ManageTreatmentPlansScreen'
import { AgentDetailScreen, HealthcareFrontdeskCreateAgentScreen, getCreateWithAiSetup, CreateAiGhostwriterShellHeader } from './screens/AgentDetailScreen'
import { WorkflowEditorScreen } from './screens/WorkflowEditorScreen'
import { ProceduresScreen } from './screens/ProceduresScreen'
import { ReviewWaitlistScreen, buildWaitlistDetailProps, type WaitlistDetailArgs } from './screens/ReviewWaitlistScreen'
// PhoneNumberScreen (Phone number 1 — Abhishek's version) is commented out from the UI.
// Do not delete. Restore by uncommenting the import and its route below.
// import { PhoneNumberScreen } from './screens/PhoneNumberScreen'
import { PhoneNumber2Screen } from './screens/PhoneNumberScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { IntegrationDetailScreen } from './screens/IntegrationDetailScreen'
import { WebWidgetsScreen } from './screens/WebWidgetsScreen'
import { AppointmentWidgetsScreen } from './screens/AppointmentWidgetsScreen'
import { UserExperienceImprovementScreen } from './screens/UserExperienceImprovementScreen'
import { InboxScreen } from './screens/InboxScreen'
import { AllReviewsScreen } from './screens/AllReviewsScreen'
import { AgentDirectoryScreen } from './screens/AgentDirectoryScreen'
import { OverviewScreen } from './screens/OverviewScreen'
import { OverviewV2Screen } from './screens/OverviewV2Screen'
import { OverviewV2_1Screen } from './screens/OverviewV2_1Screen'
import { OverviewV3Screen } from './screens/OverviewV3Screen'
import logoSrc from './assets/birdeye-logo.svg'
import jayIcon from './assets/icon-jay.svg'
import mynaIcon from './assets/icon-myna.svg'
import robinIcon from './assets/icon-robin.svg'
import {
  FigmaIconOverview,
  FigmaIconInbox,
  FigmaIconFrontDesk,
  FigmaIconListings,
  FigmaIconReviews,
  FigmaIconSocial,
  FigmaIconContentHub,
  FigmaIconReferrals,
  FigmaIconCampaigns,
  FigmaIconSurveys,
  FigmaIconTicketing,
  FigmaIconInsights,
  FigmaIconReports,
  FigmaIconContacts,
  FigmaIconRecommendations,
} from './components/l1Icons'

function EmptyResourceScreen({ label, title }: { label: string; title?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-body text-text-secondary">
      No {label.toLowerCase()} data yet.
    </div>
  )
}

// ─── L1 rail config ────────────────────────────────────────────────────────

const ICON_SIZE = 18

const RAIL_GROUPS: RailGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview-v2-1', label: 'Overview', icon: <FigmaIconOverview size={ICON_SIZE} />, kind: 'element' },
    ],
  },
  {
    id: 'marketing',
    header: 'Marketing',
    items: [
      { id: 'search',               label: 'AI Search',               icon: <FigmaIconRecommendations size={ICON_SIZE + 2} />, kind: 'element' },
      { id: 'listings',             label: 'Listings AI',             icon: <FigmaIconListings size={ICON_SIZE} />,        kind: 'element' },
      { id: 'reviews',              label: 'Reviews AI',              icon: <FigmaIconReviews size={ICON_SIZE} />,         kind: 'element' },
      { id: 'social',               label: 'Social AI',               icon: <FigmaIconSocial size={ICON_SIZE} />,          kind: 'element' },
      { id: 'content-hub',          label: 'Content Hub',             icon: <FigmaIconContentHub size={ICON_SIZE} />,      kind: 'element' },
      { id: 'referral',             label: 'Referral',                icon: <FigmaIconReferrals size={ICON_SIZE} />,       kind: 'element' },
      { id: 'marketing-automation', label: 'Marketing Automation AI', icon: <FigmaIconCampaigns size={ICON_SIZE} />,       kind: 'element' },
    ],
  },
  {
    id: 'operations',
    header: 'Operations',
    items: [
      { id: 'inbox',     label: 'Inbox',      icon: <FigmaIconInbox size={ICON_SIZE} />,        kind: 'element' },
      { id: 'frontdesk', label: 'Front desk', icon: <FigmaIconFrontDesk size={ICON_SIZE} />, kind: 'element' },
    ],
  },
  {
    id: 'cx',
    header: 'Customer experience',
    items: [
      { id: 'surveys',   label: 'Surveys AI',  icon: <FigmaIconSurveys size={ICON_SIZE} />,   kind: 'element' },
      { id: 'ticketing', label: 'Ticketing',   icon: <FigmaIconTicketing size={ICON_SIZE} />, kind: 'element' },
      { id: 'insights',  label: 'Insights AI', icon: <FigmaIconInsights size={ICON_SIZE} />,  kind: 'element' },
    ],
  },
  {
    id: 'footer',
    items: [
      { id: 'reports',  label: 'Reports',  icon: <FigmaIconReports size={ICON_SIZE} />,  kind: 'element' },
      { id: 'patients', label: 'Patients', icon: <FigmaIconContacts size={ICON_SIZE} />, kind: 'element' },
    ],
  },
]

// ─── L2 nav sections ────────────────────────────────────────────────────────

const AUTOMOTIVE_NAV_SECTIONS: NavSection[] = [
  {
    id: 'human-actions',
    label: 'Human actions',
    items: [
      { id: 'manage-appointments', label: 'Manage appointments' },
      { id: 'sales-pipeline',      label: 'Sales pipeline'      },
      { id: 'service-requests',    label: 'Service requests'    },
    ],
  },
  {
    id: 'agent',
    label: 'Agents',
    badge: 'New',
    items: [
      { id: 'frontdesk-agent-sep-1', label: 'Front desk agent (Sep 1)' },
      { id: 'frontdesk-agent', label: 'Front desk agent' },
      { id: 'frontdesk-agent-exploration', label: 'Front desk agent (exploration)' },
      { id: 'reminder-agent-sep-1', label: 'Reminder agent (Sep 1)' },
      { id: 'reminder-agent',  label: 'Reminder agent'  },
      { id: 'outreach-agent',  label: 'Outreach agent'  },
    ],
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    items: [
      { id: 'auto-frontdesk-overview',   label: 'Front desk overview' },
      { id: 'auto-no-shows',             label: 'No shows prevented' },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { id: 'auto-appointment-type',  label: 'Appointment type'},
      { id: 'auto-availability',      label: 'Availability'    },
      { id: 'procedure-library',      label: 'Procedures'      },
      { id: 'phone-number',           label: 'Phone number'    },
      { id: 'knowledge-base',         label: 'Knowledge base', external: true },
      { id: 'widgets',                label: 'Widgets',        external: true },
    ],
  },
]

const HEALTHCARE_NAV_SECTIONS: NavSection[] = [
  {
    id: 'human-actions',
    label: 'Human actions',
    items: [
      { id: 'manage-appointments', label: 'Manage appointments' },
      { id: 'review-waitlist',     label: 'Review waitlist'     },
      { id: 'manage-intake',       label: 'Manage intake'       },
    ],
  },
  {
    id: 'agent',
    label: 'Agents',
    badge: 'New',
    items: [
      { id: 'frontdesk-agent-sep-1', label: 'Front desk agent (Sep 1)' },
      { id: 'frontdesk-agent',  label: 'Front desk agent'  },
      { id: 'frontdesk-agent-exploration', label: 'Front desk agent (exploration)' },
      { id: 'waitlist-agent',   label: 'Waitlist agent'   },
      { id: 'pre-visit-agent',  label: 'Pre-visit agent'  },
      { id: 'reminder-agent-sep-1', label: 'Reminder agent (Sep 1)' },
      { id: 'reminder-agent',   label: 'Reminder agent'   },
    ],
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    items: [
      { id: 'hc-frontdesk-overview', label: 'Front desk overview' },
      { id: 'hc-no-shows',           label: 'No-shows prevented'      },
      { id: 'hc-waitlist',           label: 'Waitlist filled'    },
      { id: 'hc-intakes',            label: 'Intakes completed'  },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { id: 'providers',         label: 'Providers'          },
      { id: 'appointment-type',  label: 'Appointment type'   },
      { id: 'availability',      label: 'Availability'       },
      { id: 'procedure-library', label: 'Procedures'         },
      { id: 'phone-number',      label: 'Phone number'       },
      { id: 'knowledge-base',    label: 'Knowledge base',    external: true },
      { id: 'widgets',           label: 'Widgets',           external: true },
    ],
  },
]

const DENTAL_NAV_SECTIONS: NavSection[] = [
  {
    id: 'human-actions',
    label: 'Human actions',
    items: [
      { id: 'manage-appointments',   label: 'Manage appointments'   },
      { id: 'review-waitlist',       label: 'Review waitlist'       },
      { id: 'manage-intake',         label: 'Manage intake'         },
      { id: 'manage-treatment-plans', label: 'Manage treatment plans' },
    ],
  },
  {
    id: 'agent',
    label: 'Agents',
    badge: 'New',
    items: [
      { id: 'frontdesk-agent-sep-1',       label: 'Front desk agent (Sep 1)'       },
      { id: 'frontdesk-agent',             label: 'Front desk agent'             },
      { id: 'frontdesk-agent-exploration', label: 'Front desk agent (exploration)' },
      { id: 'waitlist-agent',              label: 'Waitlist agent'              },
      { id: 'pre-visit-agent',             label: 'Pre-visit agent'             },
      { id: 'reminder-agent-sep-1',        label: 'Reminder agent (Sep 1)'      },
      { id: 'reminder-agent',              label: 'Reminder agent'              },
      { id: 'recall-agent',                label: 'Recall agent'                },
      { id: 'revenue-agent',               label: 'Revenue agent'               },
      { id: 'treatment-plan-agent',        label: 'Treatment plan agent'        },
    ],
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    items: [
      { id: 'dental-frontdesk-overview', label: 'Front desk overview'       },
      { id: 'dental-no-shows',           label: 'Appointment confirmation' },
      { id: 'dental-waitlist',           label: 'Waitlist filled'          },
      { id: 'dental-intakes',            label: 'Intakes completed'        },
      { id: 'dental-revenue',            label: 'Revenue generated'        },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { id: 'providers',         label: 'Providers'        },
      { id: 'appointment-type',  label: 'Appointment type' },
      { id: 'availability',      label: 'Availability'     },
      { id: 'procedure-library', label: 'Procedures'       },
      { id: 'phone-number',      label: 'Phone number'     },
      { id: 'knowledge-base',    label: 'Knowledge base', external: true },
      { id: 'widgets',           label: 'Widgets',           external: true },
    ],
  },
]

const NAV_SECTIONS_BY_PRODUCT: Record<string, NavSection[]> = {
  automotive: AUTOMOTIVE_NAV_SECTIONS,
  healthcare:  HEALTHCARE_NAV_SECTIONS,
  dental:      DENTAL_NAV_SECTIONS,
}

const REVIEWS_NAV_SECTIONS: NavSection[] = [
  {
    id: 'human-actions',
    label: 'Human actions',
    defaultExpanded: true,
    items: [
      { id: 'view-all-reviews',      label: 'View all reviews' },
      { id: 'respond-to-reviews',    label: 'Respond to reviews' },
      { id: 'monitor-agent-replies', label: 'Monitor agent replies' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    badge: 'New',
    items: [
      { id: 'response-agents-sep-1',        label: 'Response agents (Sep 1)' },
      { id: 'response-agents',              label: 'Response agents' },
      { id: 'response-agents-exploration',  label: 'Response agents (exploration)' },
      { id: 'generation-agents',       label: 'Generation agents' },
      { id: 'review-tagging-agent',    label: 'Review tagging agents' },
    ],
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    items: [
      { id: 'review-ratings',       label: 'Review & ratings' },
      { id: 'response-rate',        label: 'Response rate' },
      { id: 'reviews-distribution', label: 'Reviews distribution' },
      { id: 'analyze-competitors',  label: 'Analyze competitors' },
      { id: 'all-reports',          label: 'All reports', external: true },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { id: 'monitoring-sites',   label: 'Monitoring sites' },
      { id: 'generation-sites',   label: 'Generation sites' },
      { id: 'response-templates', label: 'Response templates' },
      { id: 'auto-reply-rules',   label: 'Auto-reply rules' },
      { id: 'auto-share-rules',   label: 'Auto-share rules' },
      { id: 'ratings-display',    label: 'Ratings display' },
      { id: 'approvals',          label: 'Approvals' },
      { id: 'qr-codes',           label: 'QR codes' },
      { id: 'widgets',            label: 'Widgets' },
      { id: 'ai-prompts',         label: 'AI prompts' },
    ],
  },
]

const REVIEWS_AGENT_NAV_IDS = new Set([
  'response-agents',
  'response-agents-sep-1',
  'generation-agents',
  'review-response-agents',
])

const REVIEWS_DEFAULT_NAV = 'view-all-reviews'

function getRailForAgentNavId(navId: string): string {
  if (REVIEWS_AGENT_NAV_IDS.has(navId)) return 'reviews'
  return 'frontdesk'
}

const REVIEWS_NAV_LABELS: Record<string, string> = Object.fromEntries(
  REVIEWS_NAV_SECTIONS.flatMap((section) => {
    if (section.items === undefined) return [[section.id, section.label]]
    return (section.items ?? []).map((item) => [item.id, item.label])
  }),
)

const DEFAULT_NAV_BY_PRODUCT: Record<string, string> = {
  automotive: 'manage-appointments',
  healthcare:  'manage-appointments',
  dental:      'manage-appointments',
}

const PRODUCTS: Product[] = [
  { id: 'healthcare', label: 'Birdeye Healthcare' },
  { id: 'dental',     label: 'Birdeye Dental'     },
  { id: 'automotive', label: 'Birdeye Automotive'  },
]

const PRODUCT_BRAND: Record<string, string> = {
  healthcare: 'Birdeye Healthcare',
  dental:     'Birdeye Dental',
  automotive: 'Birdeye Automotive',
}

const AGENT_NAMES: Record<string, string> = {
  'frontdesk-agent':           'Front desk agent',
  'frontdesk-agent-exploration': 'Front desk agent (exploration)',
  'frontdesk-agent-sep-1':     'Front desk agent',
  'reminder-agent-sep-1':      'Reminder agent',
  'reminder-agent':            'Reminder agent',
  'outreach-agent':            'Outreach agent',
  'waitlist-agent':            'Waitlist agent',
  'pre-visit-agent':           'Pre-visit agent',
  'recall-agent':              'Recall agent',
  'revenue-agent':             'Revenue agent',
  'treatment-plan-agent':      'Treatment plan agent',
  'review-response-agents':    'Review response agents',
  'response-agents':           'Review response agents',
  'response-agents-sep-1':     'Review response agents',
  'response-agents-exploration': 'Review response agents (exploration)',
  'generation-agents':         'Review generation agents',
  'review-tagging-agent':      'Review tagging agents',
}

const EXPLORATION_AGENT_NAV_IDS = new Set([
  'response-agents-exploration',
  'frontdesk-agent-exploration',
])

function isExplorationAgentNav(navId: string) {
  return EXPLORATION_AGENT_NAV_IDS.has(navId) || isAgentExplorationChrome(navId)
}

// Map railActive → module title shown in the global TopBar
const RAIL_TITLE: Record<string, string> = {
  frontdesk:             'Front desk',
  inbox:                 'Inbox',
  settings:              'Settings',
  overview:              'Overview',
  'overview-v2':         'Overview v2',
  'overview-v2-1':       'Overview',
  'overview-v3':         'Overview v3',
  agents:                'Co-workers',
  search:                'AI Search',
  listings:              'Listings AI',
  reviews:               'Reviews AI',
  social:                'Social AI',
  'content-hub':         'Content Hub',
  referral:              'Referral',
  'marketing-automation':'Marketing Automation AI',
  surveys:               'Surveys AI',
  ticketing:             'Ticketing',
  insights:              'Insights AI',
  reports:               'Reports',
  patients:              'Patients',
}

// Reverse of AGENT_NAMES — used to resolve a Recommendation's `agentName` (a full instance
// name like "Front desk agent - North region") back to the navActive id that opens it.
const AGENT_NAV_ID_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_NAMES).map(([id, name]) => [name, id]),
)

// ─── "View details" deep links ─────────────────────────────────────────────
// Detail views open in a new browser tab. Since this prototype has no URL
// router, the clicked row's args are JSON-encoded into the URL so the fresh
// tab can reconstruct the exact same detail screen on load.
const DETAIL_VIEW_NAV: Record<string, string> = {
  waitlist:         'review-waitlist',
  lead:             'sales-pipeline',
  'service-request':'service-requests',
  intake:           'manage-intake',
  appointment:      'manage-appointments',
}

function parseInitialDetailView(): { view: string; data: unknown } | null {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  const data = params.get('data')
  if (!view || !data || !DETAIL_VIEW_NAV[view]) return null
  try {
    return { view, data: JSON.parse(data) }
  } catch {
    return null
  }
}

function openDetailInNewTab(view: string, args: unknown) {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin)
  url.searchParams.set('view', view)
  url.searchParams.set('data', JSON.stringify(args))
  window.open(url.toString(), '_blank', 'noopener,noreferrer')
}

// Shareable URLs for every L1 rail page and every L2 nav page.
// Vercel/local use path routes (`/overview`, `/front-desk/frontdesk-agent-sep-1`).
// GitHub Pages (`base: /myna/`) has no SPA rewrite, so the same slugs are stored in the hash.
const RAIL_ID_TO_SLUG: Record<string, string> = {
  'overview-v2-1': 'overview',
  search: 'ai-search',
  listings: 'listings',
  reviews: 'reviews',
  social: 'social',
  'content-hub': 'content-hub',
  referral: 'referral',
  'marketing-automation': 'marketing-automation',
  inbox: 'inbox',
  frontdesk: 'front-desk',
  surveys: 'surveys',
  ticketing: 'ticketing',
  insights: 'insights',
  reports: 'reports',
  patients: 'patients',
  settings: 'settings',
}
const SLUG_TO_RAIL_ID: Record<string, string> = Object.fromEntries(
  Object.entries(RAIL_ID_TO_SLUG).map(([railId, slug]) => [slug, railId]),
)

function navIdsFromSections(sections: NavSection[]): string[] {
  return sections.flatMap((section) => (section.items ?? []).map((item) => item.id))
}

const NAV_IDS_BY_RAIL: Record<string, Set<string>> = {
  frontdesk: new Set([
    ...navIdsFromSections(AUTOMOTIVE_NAV_SECTIONS),
    ...navIdsFromSections(HEALTHCARE_NAV_SECTIONS),
    ...navIdsFromSections(DENTAL_NAV_SECTIONS),
  ]),
  reviews: new Set(navIdsFromSections(REVIEWS_NAV_SECTIONS)),
}

const L2_RAILS = new Set(Object.keys(NAV_IDS_BY_RAIL))

function usesHashRoutes(): boolean {
  return import.meta.env.BASE_URL !== '/'
}

function pathForRoute(railId: string, navId?: string, deep: DeepRoute = {}): string {
  const slug = RAIL_ID_TO_SLUG[railId]
  if (!slug) return '/overview'
  if (L2_RAILS.has(railId) && navId && NAV_IDS_BY_RAIL[railId]?.has(navId)) {
    return `/${slug}/${navId}${serializeDeep(deep)}`
  }
  return `/${slug}`
}

function parsePathSegments(raw: string): { railId: string; navId?: string; deep: DeepRoute } | null {
  const parts = raw.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length === 0) return null
  const railId = SLUG_TO_RAIL_ID[parts[0]]
  if (!railId) {
    for (const [id, navIds] of Object.entries(NAV_IDS_BY_RAIL)) {
      if (navIds.has(parts[0])) {
        return { railId: id, navId: parts[0], deep: parseDeepSegments(parts.slice(1)) }
      }
    }
    return null
  }
  const navId = parts[1]
  if (navId && NAV_IDS_BY_RAIL[railId]?.has(navId)) {
    return { railId, navId, deep: parseDeepSegments(parts.slice(2)) }
  }
  return { railId, deep: {} }
}

function locationPathname(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  let path = window.location.pathname
  if (base && path.startsWith(base)) path = path.slice(base.length) || '/'
  if (path === '/' || path === '') {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return '/'
    return hash.startsWith('/') ? hash : `/${hash}`
  }
  return path.startsWith('/') ? path : `/${path}`
}

function parseAppRoute(): { railId: string; navId?: string; deep: DeepRoute } | null {
  return parsePathSegments(locationPathname())
}

function hrefForRoute(railId: string, navId?: string, deep: DeepRoute = {}): string {
  const path = pathForRoute(railId, navId, deep)
  const search = window.location.search
  if (usesHashRoutes()) {
    return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}#${path}${search}`
  }
  return `${path}${search}`
}

function currentHref(): string {
  if (usesHashRoutes()) {
    return `${window.location.pathname}${window.location.hash}${window.location.search}`
  }
  return `${window.location.pathname}${window.location.search}`
}

// ─── App ────────────────────────────────────────────────────────────────────

export function App() {
  const [initialDetailView] = useState(() => parseInitialDetailView())
  const [railActive, setRailActive] = useState(() => {
    const detailNav = DETAIL_VIEW_NAV[parseInitialDetailView()?.view ?? '']
    if (detailNav) return NAV_IDS_BY_RAIL.reviews.has(detailNav) ? 'reviews' : 'frontdesk'
    return parseAppRoute()?.railId ?? 'overview-v2-1'
  })
  const [navActive, setNavActive] = useState(() => {
    const fromDetail = DETAIL_VIEW_NAV[initialDetailView?.view ?? '']
    if (fromDetail) return fromDetail
    return parseAppRoute()?.navId ?? 'frontdesk-agent'
  })
  const [deepRoute, setDeepRoute] = useState<DeepRoute>(() => parseAppRoute()?.deep ?? {})
  const applyingRoute = useRef(false)
  const didCanonicalizeUrl = useRef(false)
  const [expandOnHover, setExpandOnHover] = useState(true)
  const [searchAIL2Active, setSearchAIL2Active] = useState(SEARCH_AI_L2_DEFAULT_ACTIVE)
  const [socialL2Active, setSocialL2Active] = useState('Publish/Calendar')
  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)
  /** Instance status when opening the editor (e.g. Draft with a live version). */
  const [editingAgentStatus, setEditingAgentStatus] = useState<string | null>(null)
  const [wizardAgentDraft, setWizardAgentDraft] = useState<WizardAgentDraft | null>(null)
  // Set when the canvas eye icon is clicked, so the agent detail screen (remounted after
  // closing the editor) knows which instance + tab to land on instead of its own defaults.
  const [pendingAgentInstanceView, setPendingAgentInstanceView] = useState<{ instanceName: string; tab: string } | null>(null)
  const [editorReturnView, setEditorReturnView] = useState<{ instanceName: string; tab: string } | null>(null)
  // Set by the Agent directory "Create agent" CTA so the freshly-mounted AgentDetailScreen
  // lands directly in its create-agent flow instead of the default Agents-tab table.
  const [autoOpenAgentCreateFlow, setAutoOpenAgentCreateFlow] = useState(false)
  const [workflowAiAssistOpen, setWorkflowAiAssistOpen] = useState(false)
  const [workflowAiCreateFullscreen, setWorkflowAiCreateFullscreen] = useState(false)
  /** Docked "AI Builder" side panel (Reviews AI review-response chrome). */
  const [workflowAiBuilderPanelOpen, setWorkflowAiBuilderPanelOpen] = useState(false)
  /** After exiting Create with AI fullscreen, reopen the canvas LHS on that tab. */
  const [workflowLhsPreferAiTab, setWorkflowLhsPreferAiTab] = useState(false)
  const [isAgentSetupActive, setIsAgentSetupActive] = useState(false)
  const [isViewingFullBleedDetail, setIsViewingFullBleedDetail] = useState(false)
  const [activeProduct, setActiveProduct] = useState('healthcare')
  const [settingsTab, setSettingsTab] = useState<string | null>(null)
  const [settingsSubScreen, setSettingsSubScreen] = useState<string | null>(null)
  // Content Hub sub-navigation state
  const [contentHubView, setContentHubView] = useState<ContentHubSubView>('content-hub-projects')
  const [editorMode, setEditorMode] = useState<'faq' | 'blog' | 'project' | 'social' | 'email' | null>(null)
  const [contentHubL2Active, setContentHubL2Active] = useState<string>('Human actions/View all contents')
  // Blog create page state — mirrors contenthub 2.0's createViewStartAtBlogCanvas pattern
  const [createBlogPageOpen, setCreateBlogPageOpen] = useState(false)
  const [createBlogFlowData, setCreateBlogFlowData] = useState<BlogFlowData | null>(null)
  const [agentToastMessage, setAgentToastMessage] = useState('')
  const [agentToastVisible, setAgentToastVisible] = useState(false)
  const [inboxFocusId, setInboxFocusId] = useState<string | null>(null)
  const [recommendationFocus, setRecommendationFocus] = useState<{ instanceName: string; recommendationId: string; feedbackPrefill?: string } | null>(null)

  // Restore rail + L2 from the address bar (path or leftover hash) on back/forward.
  useEffect(() => {
    const applyLocation = () => {
      const route = parseAppRoute()
      if (!route) return
      applyingRoute.current = true
      setRailActive(route.railId)
      if (route.navId) setNavActive(route.navId)
      setDeepRoute(route.deep)
      queueMicrotask(() => {
        applyingRoute.current = false
      })
    }
    window.addEventListener('popstate', applyLocation)
    window.addEventListener('hashchange', applyLocation)
    return () => {
      window.removeEventListener('popstate', applyLocation)
      window.removeEventListener('hashchange', applyLocation)
    }
  }, [])

  // Keep the address bar in sync: `/overview`, `/front-desk/<nav>`, `/reviews/<nav>`, etc.
  useEffect(() => {
    if (applyingRoute.current) return
    const href = hrefForRoute(railActive, navActive, deepRoute)
    if (currentHref() === href) return
    if (!didCanonicalizeUrl.current) {
      didCanonicalizeUrl.current = true
      window.history.replaceState(null, '', href)
      return
    }
    window.history.pushState(null, '', href)
  }, [railActive, navActive, deepRoute])

  function openIntegrationSettings(integrationId: string) {
    setRailActive('settings')
    setSettingsTab('Integrations')
    setSettingsSubScreen(`integration-${integrationId}`)
  }

  function openUxImprovementSettings() {
    setRailActive('settings')
    setSettingsTab('Account')
    setSettingsSubScreen('user-experience-improvement')
  }

  function openAgentFromOverview(target: { railId: string; navId?: string }) {
    setRailActive(target.railId)
    setDeepRoute({})
    if (target.navId) {
      setNavActive(target.navId)
      return
    }
    if (target.railId === 'reviews') setNavActive(REVIEWS_DEFAULT_NAV)
    if (target.railId === 'frontdesk') setNavActive(DEFAULT_NAV_BY_PRODUCT[activeProduct] ?? 'manage-appointments')
  }

  function openAgentByNavId(navId: string) {
    openAgentFromOverview({ railId: getRailForAgentNavId(navId), navId })
  }

  function handleProductChange(id: string) {
    setActiveProduct(id)
    setNavActive(DEFAULT_NAV_BY_PRODUCT[id] ?? 'manage-appointments')
    setDeepRoute({})
    setEditingAgentName(null)
    setWizardAgentDraft(null)
    setWorkflowAiCreateFullscreen(false)
    setIsAgentSetupActive(false)
    setIntakeDetail(null)
    setAppointmentDetail(null)
    setWaitlistDetail(null)
    setLeadDetail(null)
    setServiceRequestDetail(null)
  }

  function handleEditAgent(
    name: string,
    draft?: WizardAgentDraft,
    returnTo?: { instanceName: string; tab: string },
    status?: string,
  ) {
    // Remembered so closing the editor lands back where editing started (e.g. the instance's
    // Workflow tab) instead of dropping to the agent list.
    setEditorReturnView(returnTo ?? null)
    setWizardAgentDraft(draft ?? null)
    setEditingAgentName(name)
    const inferredDraft =
      name?.includes('Schedule based') || name?.includes('Event trigger based')
    // Draft/live status chrome is exploration-only; other agents keep the prior Schedule/Event rule.
    setEditingAgentStatus(
      isExplorationAgentNav(navActive)
        ? (status ?? (inferredDraft ? 'Draft' : null))
        : (inferredDraft ? 'Draft' : null),
    )
    setWorkflowAiCreateFullscreen(false)
    // Keep the AI Builder closed on land — user opens it via the Create with AI FAB.
    setWorkflowAiBuilderPanelOpen(false)
    if (draft) {
      setAgentToastMessage(`${draft.agentName} created successfully`)
      setAgentToastVisible(true)
    }
  }

  const [intakeDetail, setIntakeDetail] = useState<IntakeDetailArgs | null>(
    () => (initialDetailView?.view === 'intake' ? (initialDetailView.data as IntakeDetailArgs) : null),
  )
  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetailArgs | null>(
    () => (initialDetailView?.view === 'appointment' ? (initialDetailView.data as AppointmentDetailArgs) : null),
  )
  const [waitlistDetail, setWaitlistDetail] = useState<WaitlistDetailArgs | null>(
    () => (initialDetailView?.view === 'waitlist' ? (initialDetailView.data as WaitlistDetailArgs) : null),
  )
  const [leadDetail, setLeadDetail] = useState<LeadDetailArgs | null>(
    () => (initialDetailView?.view === 'lead' ? (initialDetailView.data as LeadDetailArgs) : null),
  )
  const [serviceRequestDetail, setServiceRequestDetail] = useState<ServiceRequestDetailArgs | null>(
    () => (initialDetailView?.view === 'service-request' ? (initialDetailView.data as ServiceRequestDetailArgs) : null),
  )

  const isEditingWorkflow = editingAgentName !== null
  const isViewingDetail =
    intakeDetail !== null ||
    appointmentDetail !== null ||
    waitlistDetail !== null ||
    leadDetail !== null ||
    serviceRequestDetail !== null

  const moduleTitle = RAIL_TITLE[railActive] ?? 'Front desk'

  const showL2 =
    !isEditingWorkflow &&
    !isViewingDetail &&
    !isAgentSetupActive &&
    !isViewingFullBleedDetail &&
    railActive !== 'settings' &&
    railActive !== 'inbox' &&
    railActive !== 'agents' &&
    railActive !== 'overview' &&
    railActive !== 'overview-v2' &&
    railActive !== 'overview-v2-1' &&
    railActive !== 'overview-v3' &&
    railActive !== 'content-hub' &&
    railActive !== 'search' &&
    railActive !== 'social'

  return (
    <ProcedureStoreProvider>
      <AgentSystemPromptStoreProvider>
      {/*
        Shell layout (mirrors contenthub 2.0):
          - Outer: h-screen w-screen flex, bg = shell gray (#e0e5eb)
          - L1 IconRail: transparent, sits on shell gray
          - Right column: flex-col
            - Global TopBar: h-[48px] bg-surface-shell rounded-tr-lg
            - Gutter row: flex-1 bg-surface-shell pr-[10px] pb-[10px]
              - White card: rounded-lg border flex-row
                - L2 SideNav (bg-surface-l2 = #f0f1f5)
                - <main> (bg-surface = #fff)
      */}
      <FeedbackRecommendationsStoreProvider>
      <RecommendationOverridesStoreProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-surface-shell text-text-primary">

        {/* ── L1 Icon rail ── */}
        <IconRail
          logoSrc={logoSrc}
          brand={PRODUCT_BRAND[activeProduct]}
          groups={
            activeProduct === 'healthcare'
              ? RAIL_GROUPS
              : RAIL_GROUPS.map((g) =>
                  g.id === 'main'
                    ? { ...g, items: g.items.map((i) => (i.id === 'agents' ? { ...i, label: 'Agents' } : i)) }
                    : g,
                )
          }
          activeId={railActive}
          onSelect={(id) => {
            setRailActive(id)
            setDeepRoute({})
            setIsAgentSetupActive(false)
            if (id === 'frontdesk') setNavActive('manage-appointments')
            if (id === 'reviews') setNavActive(REVIEWS_DEFAULT_NAV)
          }}
          products={PRODUCTS}
          activeProduct={activeProduct}
          onProductChange={handleProductChange}
          initials="HR"
          userName="Haresh Rajamannar"
          userEmail="haresh.rajamannar@birdeye.com"
          expandOnHover={expandOnHover}
          onExpandOnHoverChange={setExpandOnHover}
          onProfileAction={(action) => {
            if (action === 'settings') setRailActive('settings')
          }}
        />

        {/* ── Right column ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Global TopBar ── same bg as L1 rail so they look merged */}
          <header className="flex h-[48px] shrink-0 items-center justify-between px-4 bg-surface-shell rounded-tr-lg">
            <span className="text-base text-text-primary" style={{ fontWeight: 400 }}>
              {moduleTitle}
            </span>
            <div className="flex items-center gap-[6px]">
              {/* + button — matches contenthub 2.0 QuickCreateLauncher trigger */}
              <button
                type="button"
                aria-label="Create new"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-surface-l2 transition-colors hover:bg-surface-selected"
              >
                <Icon name="add" size={18} className="text-text-primary" />
              </button>

              {/* Ask BirdGPT — matches contenthub 2.0 Button style */}
              <button
                type="button"
                className="group flex h-[30px] items-center gap-[5px] rounded-md bg-surface-l2 px-[10px] transition-colors hover:bg-surface-selected"
              >
                <span
                  className="shrink-0 text-[#9970D7] group-hover:[animation:myna-cta-icon-tilt_360ms_ease-out_1]"
                  aria-hidden
                >
                  <AiCoachSparkleIcon size={14} />
                </span>
                <span
                  className="text-[12px] leading-none bg-gradient-to-r from-[#9970D7] via-[#7f87e8] to-[#2552ED] bg-[length:220%_100%] bg-clip-text text-transparent"
                  style={{ animation: 'l2-nav-shimmer 2.2s linear infinite' }}
                >
                  Ask BirdGPT
                </span>
              </button>

              <button
                type="button"
                aria-label="Menu"
                className="flex size-[30px] items-center justify-center rounded-md bg-surface-l2 transition-colors hover:bg-surface-selected"
              >
                <Icon name="menu" size={18} className="text-text-icon" />
              </button>
            </div>
          </header>

          {/* ── Gutter row — gray bg, padding exposes the rounded card ── */}
          <div className="flex-1 flex min-h-0 overflow-hidden pr-[10px] pb-[10px] bg-surface-shell">

            {/* ── White rounded card (L2 nav + main content) ── */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden rounded-lg border border-border">

              {/* L2 SideNav — frontdesk modules, or Reviews AI's own section list */}
              {showL2 && (
                railActive === 'reviews' ? (
                  <SideNav
                    key="reviews"
                    title="Reviews AI"
                    sections={REVIEWS_NAV_SECTIONS}
                    activeId={navActive}
                    ctaLabel="Send review request"
                    onCtaClick={() => {
                      setDeepRoute({})
                      setNavActive(REVIEWS_DEFAULT_NAV)
                    }}
                    onSelect={(id) => {
                      setDeepRoute({})
                      setNavActive(id)
                    }}
                  />
                ) : (
                  <SideNav
                    key="frontdesk"
                    title="Front desk"
                    sections={NAV_SECTIONS_BY_PRODUCT[activeProduct] ?? AUTOMOTIVE_NAV_SECTIONS}
                    activeId={navActive}
                    onSelect={(id) => {
                      if (id === 'knowledge-base') {
                        setRailActive('settings')
                        setSettingsTab('Knowledge')
                        setDeepRoute({})
                      } else if (id === 'widgets') {
                        setRailActive('settings')
                        setSettingsTab('Widgets')
                        setDeepRoute({})
                      } else {
                        setDeepRoute({})
                        setNavActive(id)
                      }
                    }}
                  />
                )
              )}

              {/* Search AI L2 nav panel */}
              {railActive === 'search' && (
                <SearchAIL2NavPanel
                  activeItem={searchAIL2Active}
                  onActiveItemChange={setSearchAIL2Active}
                />
              )}

              {/* Social L2 nav panel — hidden on Create post full-screen */}
              {railActive === 'social' && socialL2Active !== 'Create post' && (
                <SocialL2NavPanel
                  activeItem={socialL2Active}
                  onActiveItemChange={setSocialL2Active}
                />
              )}

              {/* Content Hub L2 nav panel — hidden when in editor or blog create page */}
              {railActive === 'content-hub' && editorMode === null && !createBlogPageOpen && (
                <ContentHubL2NavPanel
                  activeItem={contentHubL2Active}
                  onActiveItemChange={(key, view) => {
                    setContentHubL2Active(key)
                    setContentHubView(view)
                  }}
                  onCreate={(mode) => {
                    if (mode === 'blog' || mode === 'blogEditor') {
                      // Blog goes to standalone CreateBlogPage first (matches contenthub 2.0)
                      setCreateBlogPageOpen(true)
                    } else {
                      // FAQ + project go directly to ContentEditorShell setup phase
                      const m: 'faq' | 'project' =
                        mode === 'faq' ? 'faq' : 'project'
                      setEditorMode(m)
                    }
                  }}
                />
              )}

              {/* Main content */}
              <main className="flex flex-1 flex-col min-w-0 overflow-hidden bg-background">
                {railActive === 'search' ? (
                  <SearchAIView l2ActiveItem={searchAIL2Active} />
                ) : railActive === 'social' ? (
                  <SocialView activeItem={socialL2Active} onActiveItemChange={setSocialL2Active} />
                ) : railActive === 'content-hub' ? (
                  // Blog create page (standalone step before ContentEditorShell — matches contenthub 2.0)
                  createBlogPageOpen ? (
                    <CreateBlogPage
                      onCancel={() => setCreateBlogPageOpen(false)}
                      onGenerate={(data) => {
                        setCreateBlogFlowData(data)
                        setCreateBlogPageOpen(false)
                        setEditorMode('blog')
                      }}
                    />
                  ) : editorMode !== null ? (
                    <ContentEditorShell
                      mode={editorMode}
                      onBack={() => {
                        setEditorMode(null)
                        setCreateBlogFlowData(null)
                        setContentHubView('content-hub-projects')
                      }}
                      // Blog created via CreateBlogPage skips setup and goes straight to canvas
                      skipSetupPhase={editorMode === 'blog' && createBlogFlowData !== null}
                      initialBlogFlowData={createBlogFlowData ?? undefined}
                    />
                  ) : contentHubView === 'content-hub-projects' || contentHubView === 'content-hub-home' || contentHubView === 'content-hub-assigned' || contentHubView === 'content-hub-approve' || contentHubView === 'content-hub-fix' ? (
                    <ProjectsView onNavigate={() => setContentHubView('content-hub-projects')} />
                  ) : contentHubView === 'content-hub-templates' ? (
                    <TemplateGallery
                      onBack={() => setContentHubView('content-hub-projects')}
                      onSelectTemplate={(tmpl) => {
                        const m: 'faq' | 'blog' = tmpl.type === 'faq' ? 'faq' : 'blog'
                        setEditorMode(m)
                      }}
                    />
                  ) : contentHubView === 'content-hub-calendar' ? (
                    <CalendarView />
                  ) : (
                    <ProjectsView onNavigate={() => setContentHubView('content-hub-projects')} />
                  )
                ) : railActive === 'settings' ? (
                  settingsSubScreen?.startsWith('integration-') ? (
                    <IntegrationDetailScreen
                      integrationId={settingsSubScreen.replace('integration-', '')}
                      onBack={() => {
                        setSettingsSubScreen(null)
                        setSettingsTab('Integrations')
                      }}
                    />
                  ) : settingsSubScreen === 'web-widgets' ? (
                    <WebWidgetsScreen onBack={() => setSettingsSubScreen(null)} />
                  ) : settingsSubScreen === 'appointment-widgets' ? (
                    <AppointmentWidgetsScreen onBack={() => setSettingsSubScreen(null)} />
                  ) : settingsSubScreen === 'user-experience-improvement' ? (
                    <UserExperienceImprovementScreen onBack={() => setSettingsSubScreen(null)} />
                  ) : (
                    <SettingsScreen
                      initialTab={settingsTab}
                      onTabConsumed={() => setSettingsTab(null)}
                      onWebWidgets={() => setSettingsSubScreen('web-widgets')}
                      onAppointmentWidgets={() => setSettingsSubScreen('appointment-widgets')}
                      onUxImprovement={openUxImprovementSettings}
                    />
                  )
                ) : railActive === 'inbox' ? (
                  <InboxScreen
                    initialConversationId={inboxFocusId}
                    onInitialConversationConsumed={() => setInboxFocusId(null)}
                    onNavigateToRecommendation={(instanceName, recommendationId, feedbackPrefill) => {
                      const baseName = instanceName.replace(/ - .+$/, '')
                      const navId = AGENT_NAV_ID_BY_NAME[baseName]
                      if (!navId) return
                      setRecommendationFocus({ instanceName, recommendationId, feedbackPrefill })
                      setNavActive(navId)
                      setRailActive('frontdesk')
                    }}
                  />
                ) : railActive === 'overview' ? (
                  <OverviewScreen
                    key={activeProduct}
                    product={activeProduct}
                    onOpenAgent={openAgentByNavId}
                  />
                ) : railActive === 'overview-v2' ? (
                  <OverviewV2Screen />
                ) : railActive === 'overview-v2-1' ? (
                  <OverviewV2_1Screen onOpenAgent={openAgentFromOverview} />
                ) : railActive === 'overview-v3' ? (
                  <OverviewV3Screen />
                ) : railActive === 'agents' ? (
                  <AgentDirectoryScreen
                    key={activeProduct}
                    product={activeProduct}
                    onOpenAgent={openAgentByNavId}
                    onCreateAgent={() => {
                      setRailActive('frontdesk')
                      setNavActive('frontdesk-agent')
                      setAutoOpenAgentCreateFlow(true)
                    }}
                  />
                ) : isEditingWorkflow ? (
                  workflowAiCreateFullscreen && editingAgentName ? (
                    (() => {
                      const setup = getCreateWithAiSetup(editingAgentName)
                      const exitToAgentBuilder = () => {
                        setWorkflowAiCreateFullscreen(false)
                        setWorkflowLhsPreferAiTab(true)
                        // Keep Create with AI / AI Builder docked panel open on return.
                        setWorkflowAiBuilderPanelOpen(true)
                      }
                      // Shell title matches create-flow naming (drop region suffix when present).
                      const shellTitle = editingAgentName.replace(/ - .+$/, '') || editingAgentName
                      return (
                        <div className="flex h-full w-full overflow-hidden">
                          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                            <CreateAiGhostwriterShellHeader
                              title={shellTitle}
                              onBack={exitToAgentBuilder}
                              onViewAgentBuilder={exitToAgentBuilder}
                            />
                            <div className="scrollbar-subtle flex min-h-0 flex-1 items-stretch justify-center overflow-visible px-lg pt-0">
                              <div className="flex h-full min-h-0 w-full min-w-0 justify-center">
                                <HealthcareFrontdeskCreateAgentScreen
                                  key={`fullscreen-create::${editingAgentName}::welcome`}
                                  onBack={exitToAgentBuilder}
                                  onCreateFromScratch={exitToAgentBuilder}
                                  onSelectFromLibrary={exitToAgentBuilder}
                                  onViewWorkflow={exitToAgentBuilder}
                                  onCreateAgent={exitToAgentBuilder}
                                  pageTitle={editingAgentName}
                                  hideHeaderBack
                                  variant={setup.variant}
                                  initialPrompt={setup.initialPrompt}
                                  libraryCards={setup.libraryCards}
                                  fromScratchLabel={setup.fromScratchLabel}
                                  // Existing agent → expand shows welcome + pills, not a resumed thread.
                                  autoStart={false}
                                  workflowVisible={false}
                                  compactGreeting
                                  existingAgent
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="flex h-full w-full overflow-hidden">
                      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <WorkflowEditorScreen
                          agentName={editingAgentName}
                          onClose={() => {
                            setEditingAgentName(null)
                            setEditingAgentStatus(null)
                            if (editorReturnView) {
                              setPendingAgentInstanceView(editorReturnView)
                              setEditorReturnView(null)
                            }
                            setWizardAgentDraft(null)
                            setWorkflowAiAssistOpen(false)
                            setWorkflowAiCreateFullscreen(false)
                            setWorkflowAiBuilderPanelOpen(false)
                            setWorkflowLhsPreferAiTab(false)
                          }}
                          // Deleted: same teardown as onClose, but the stored return view is
                          // dropped rather than replayed — that view is the deleted agent's
                          // own instance screen, so we land on the agent list instead.
                          onDeleted={() => {
                            setEditingAgentName(null)
                            setEditingAgentStatus(null)
                            setEditorReturnView(null)
                            setPendingAgentInstanceView(null)
                            setWizardAgentDraft(null)
                            setWorkflowAiAssistOpen(false)
                            setWorkflowAiCreateFullscreen(false)
                            setWorkflowAiBuilderPanelOpen(false)
                            setWorkflowLhsPreferAiTab(false)
                          }}
                          product={activeProduct}
                          wizardDraft={wizardAgentDraft}
                          agentStatus={
                            isExplorationAgentNav(navActive)
                              ? (editingAgentStatus ?? undefined)
                              : editingAgentName?.includes('Schedule based') ||
                                  editingAgentName?.includes('Event trigger based')
                                ? 'Draft'
                                : undefined
                          }
                          aiAssistOpen={workflowAiAssistOpen}
                          onAiAssistOpenChange={setWorkflowAiAssistOpen}
                          onOpenAiFullscreen={() => setWorkflowAiCreateFullscreen(true)}
                          aiBuilderPanelOpen={workflowAiBuilderPanelOpen}
                          onAiBuilderPanelOpenChange={setWorkflowAiBuilderPanelOpen}
                          lhsDefaultTab={workflowLhsPreferAiTab ? 'Create with AI' : 'Create manually'}
                          hideTopIdentity={isAgentExplorationChrome(navActive)}
                          hideCanvasStartNode={isExplorationHideCanvasStartNode(navActive)}
                          explorationChrome={isAgentExplorationChrome(navActive)}
                          sep1Chrome={isSep1Chrome(navActive)}
                          inlineRhsFooter={navActive === RESPONSE_AGENTS_SEP1_NAV_ID}
                          onOpenProductResearchSettings={openUxImprovementSettings}
                        />
                      </div>
                      {workflowAiAssistOpen && (
                        <AiAssistPanel onClose={() => setWorkflowAiAssistOpen(false)} />
                      )}
                    </div>
                  )
                ) : railActive === 'reviews' ? (
                  navActive === 'view-all-reviews' || navActive === 'all-reviews' ? (
                    <AllReviewsScreen />
                  ) : navActive === 'respond-to-reviews' ? (
                    <AllReviewsScreen unansweredOnly />
                  ) : navActive === 'monitor-agent-replies' ? (
                    <AllReviewsScreen agentRepliesOnly />
                  ) : AGENT_NAMES[navActive] ? (
                    <AgentDetailScreen
                      key={navActive}
                      agentName={AGENT_NAMES[navActive]}
                      navId={navActive}
                      routeDeep={deepRoute}
                      onDeepRouteChange={setDeepRoute}
                      onEditAgent={handleEditAgent}
                      onAgentSetupActiveChange={setIsAgentSetupActive}
                      onFullBleedDetailActiveChange={setIsViewingFullBleedDetail}
                      pendingInstanceView={pendingAgentInstanceView}
                      onPendingInstanceViewConsumed={() => setPendingAgentInstanceView(null)}
                      onNavigateToInbox={(conversationId) => {
                        setInboxFocusId(conversationId ?? FRONT_DESK_INBOX_CONVERSATION_ID)
                        setRailActive('inbox')
                      }}
                      product={activeProduct}
                    />
                  ) : (
                    <EmptyResourceScreen label={REVIEWS_NAV_LABELS[navActive] ?? 'Reviews'} />
                  )
                ) : navActive === 'review-waitlist' && waitlistDetail ? (
                  <>
                    <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
                      <Link as="button" className="text-body">
                        All contacts
                      </Link>
                      <Icon name="chevron_right" size={16} className="text-text-icon" />
                      <span className="text-body text-text-primary">{waitlistDetail.row.patient}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <RecordDetailScreen {...buildWaitlistDetailProps(waitlistDetail)} />
                    </div>
                  </>
                ) : navActive === 'review-waitlist' ? (
                  <ReviewWaitlistScreen onViewDetail={(args) => openDetailInNewTab('waitlist', args)} />
                ) : navActive === 'sales-pipeline' && leadDetail ? (
                  <>
                    <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
                      <Link as="button" className="text-body">
                        All contacts
                      </Link>
                      <Icon name="chevron_right" size={16} className="text-text-icon" />
                      <span className="text-body text-text-primary">{leadDetail.row.name}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <RecordDetailScreen {...buildLeadDetailProps(leadDetail)} />
                    </div>
                  </>
                ) : navActive === 'sales-pipeline' ? (
                  <SalesPipelineScreen onViewDetail={(args) => openDetailInNewTab('lead', args)} />
                ) : navActive === 'manage-intake' && intakeDetail ? (
                  <>
                    <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
                      <Link
                        as="button"
                        onClick={() => setIntakeDetail(null)}
                        className="text-body"
                      >
                        Manage intake
                      </Link>
                      <Icon name="chevron_right" size={16} className="text-text-icon" />
                      <span className="text-body text-text-primary">{intakeDetail!.detail.patient}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <IntakePatientDetailScreen
                        patient={intakeDetail!.detail}
                        appointmentTime={intakeDetail!.appointmentTime}
                        appointmentType={intakeDetail!.appointmentType}
                        formType={intakeDetail!.row.formType}
                        status={intakeDetail!.detail.status}
                        bookedOn={intakeDetail!.row.bookedOn}
                        insuranceProvider={intakeDetail!.insuranceProvider}
                        sentVia={intakeDetail!.row.sentVia}
                        onBack={() => setIntakeDetail(null)}
                      />
                    </div>
                  </>
                ) : navActive === 'manage-intake' ? (
                  <IntakeScreen onViewDetail={(args) => openDetailInNewTab('intake', args)} />
                ) : navActive === 'service-requests' && serviceRequestDetail ? (
                  <>
                    <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
                      <Link as="button" className="text-body">
                        All contacts
                      </Link>
                      <Icon name="chevron_right" size={16} className="text-text-icon" />
                      <span className="text-body text-text-primary">{serviceRequestDetail.row.customer}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <RecordDetailScreen {...buildServiceRequestDetailProps(serviceRequestDetail)} />
                    </div>
                  </>
                ) : navActive === 'service-requests' ? (
                  <ServiceRequestsScreen onViewDetail={(args) => openDetailInNewTab('service-request', args)} />
                ) : navActive === 'conversations' ? (
                  <AppointmentOverviewScreen />
                ) : navActive === 'sales' ? (
                  <SalesScreen />
                ) : navActive === 'service' ? (
                  <ServiceScreen />
                ) : navActive === 'procedure-library' ? (
                  <ProceduresScreen product={activeProduct} />
                ) : navActive === 'phone-number' ? (
                  // Phone number 1 (Abhishek's version) — commented out, do not delete:
                  // <PhoneNumberScreen />
                  <PhoneNumber2Screen />
                ) : navActive === 'auto-appointment-type' ? (
                  <AutoAppointmentTypeScreen />
                ) : navActive === 'auto-availability' ? (
                  <AutoAvailabilityScreen />
                ) : navActive === 'hc-providers' || navActive === 'providers' ? (
                  <ProvidersScreen />
                ) : navActive === 'hc-appointment-type' || navActive === 'appointment-type' ? (
                  <AppointmentTypeScreen />
                ) : navActive === 'hc-availability' || navActive === 'availability' ? (
                  <AvailabilityScreen />
                ) : navActive === 'hc-frontdesk-overview' || navActive === 'dental-frontdesk-overview' || navActive === 'auto-frontdesk-overview' ? (
                  <HCFrontdeskOverviewScreen isDental={navActive === 'dental-frontdesk-overview'} />
                ) : navActive === 'hc-no-shows' || navActive === 'dental-no-shows' || navActive === 'auto-no-shows' ? (
                  <HCNoShowsScreen isDental={navActive === 'dental-no-shows'} />
                ) : navActive === 'hc-waitlist' || navActive === 'dental-waitlist' ? (
                  <HCWaitlistFilledScreen isDental={navActive === 'dental-waitlist'} />
                ) : navActive === 'hc-intakes' || navActive === 'dental-intakes' ? (
                  <HCIntakesCompletedScreen isDental={navActive === 'dental-intakes'} />
                ) : navActive === 'manage-treatment-plans' ? (
                  <ManageTreatmentPlansScreen />
                ) : navActive === 'dental-revenue' ? (
                  <DentalRevenueScreen />
                ) : AGENT_NAMES[navActive] ? (
                  <AgentDetailScreen
                    key={navActive}
                    agentName={AGENT_NAMES[navActive]}
                    navId={navActive}
                    routeDeep={deepRoute}
                    onDeepRouteChange={setDeepRoute}
                    onEditAgent={handleEditAgent}
                    onOpenIntegrationSettings={openIntegrationSettings}
                    onAgentSetupActiveChange={setIsAgentSetupActive}
                    onFullBleedDetailActiveChange={setIsViewingFullBleedDetail}
                    onNavigateToInbox={(conversationId) => {
                      setInboxFocusId(conversationId ?? FRONT_DESK_INBOX_CONVERSATION_ID)
                      setRailActive('inbox')
                    }}
                    initialRecommendationFocus={recommendationFocus}
                    onInitialRecommendationFocusConsumed={() => setRecommendationFocus(null)}
                    product={activeProduct}
                    pendingInstanceView={pendingAgentInstanceView}
                    onPendingInstanceViewConsumed={() => setPendingAgentInstanceView(null)}
                    autoOpenCreateFlow={autoOpenAgentCreateFlow}
                    onAutoOpenCreateFlowConsumed={() => setAutoOpenAgentCreateFlow(false)}
                  />
                ) : appointmentDetail ? (
                  <>
                    <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
                      <Link as="button" className="text-body">
                        All contacts
                      </Link>
                      <Icon name="chevron_right" size={16} className="text-text-icon" />
                      <span className="text-body text-text-primary">{appointmentDetail.row.name}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <RecordDetailScreen {...buildAppointmentDetailProps(appointmentDetail)} />
                    </div>
                  </>
                ) : (
                  <ManageAppointmentsScreen product={activeProduct} onViewDetail={(args) => openDetailInNewTab('appointment', args)} />
                )}
              </main>

            </div>{/* end white card */}
          </div>{/* end gutter row */}

          <Toast
            message={agentToastMessage}
            visible={agentToastVisible}
            onClose={() => setAgentToastVisible(false)}
          />
        </div>{/* end right column */}
      </div>
      </RecommendationOverridesStoreProvider>
      </FeedbackRecommendationsStoreProvider>
      </AgentSystemPromptStoreProvider>
    </ProcedureStoreProvider>
  )
}
