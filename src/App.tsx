import { useState } from 'react'
import { ProcedureStoreProvider } from './data/ProcedureStoreContext'
import type { WizardAgentDraft } from './data/wizardAgentConfig.types'
import { Icon, IconRail, Link, RecordDetailScreen, SideNav, type NavSection, type RailGroup, type Product } from './components'
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
import { AgentDetailScreen } from './screens/AgentDetailScreen'
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
import { InboxScreen } from './screens/InboxScreen'
import logoSrc from './assets/birdeye-logo.svg'
import { Monitor } from 'lucide-react'
import {
  FigmaIconBirdAI,
  FigmaIconOverview,
  FigmaIconInbox,
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

// ─── L1 rail config ────────────────────────────────────────────────────────

const ICON_SIZE = 18

const RAIL_GROUPS: RailGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview', label: 'Overview', icon: <FigmaIconOverview size={ICON_SIZE} />, kind: 'element' },
      { id: 'agents',   label: 'Agents',   icon: <FigmaIconBirdAI size={ICON_SIZE} />,   kind: 'element', badge: 'New' },
    ],
  },
  {
    id: 'marketing',
    header: 'Marketing',
    items: [
      { id: 'search',               label: 'Search AI',               icon: <FigmaIconRecommendations size={ICON_SIZE} />, kind: 'element' },
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
      { id: 'frontdesk', label: 'Front desk', icon: <Monitor size={ICON_SIZE} />, kind: 'element' },
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
    items: [
      { id: 'frontdesk-agent', label: 'Front desk agent' },
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
    items: [
      { id: 'frontdesk-agent',  label: 'Front desk agent'  },
      { id: 'waitlist-agent',   label: 'Waitlist agent'   },
      { id: 'pre-visit-agent',  label: 'Pre-visit agent'  },
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
    items: [
      { id: 'frontdesk-agent',             label: 'Front desk agent'             },
      { id: 'waitlist-agent',              label: 'Waitlist agent'              },
      { id: 'pre-visit-agent',             label: 'Pre-visit agent'             },
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
      { id: 'widgets',           label: 'Widgets',        external: true },
    ],
  },
]

const NAV_SECTIONS_BY_PRODUCT: Record<string, NavSection[]> = {
  automotive: AUTOMOTIVE_NAV_SECTIONS,
  healthcare:  HEALTHCARE_NAV_SECTIONS,
  dental:      DENTAL_NAV_SECTIONS,
}

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
  'frontdesk-agent':      'Front desk agent',
  'reminder-agent':       'Reminder agent',
  'outreach-agent':       'Outreach agent',
  'waitlist-agent':       'Waitlist agent',
  'pre-visit-agent':      'Pre-visit agent',
  'recall-agent':         'Recall agent',
  'revenue-agent':        'Revenue agent',
  'treatment-plan-agent': 'Treatment plan agent',
}

// Map railActive → module title shown in the global TopBar
const RAIL_TITLE: Record<string, string> = {
  frontdesk:             'Front desk',
  inbox:                 'Inbox',
  settings:              'Settings',
  overview:              'Overview',
  agents:                'Agents',
  search:                'Search AI',
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

// ─── App ────────────────────────────────────────────────────────────────────

export function App() {
  const [initialDetailView] = useState(() => parseInitialDetailView())
  const [railActive, setRailActive] = useState('frontdesk')
  const [navActive, setNavActive] = useState(
    () => DETAIL_VIEW_NAV[initialDetailView?.view ?? ''] ?? 'manage-appointments',
  )
  const [expandOnHover, setExpandOnHover] = useState(true)
  const [searchAIL2Active, setSearchAIL2Active] = useState(SEARCH_AI_L2_DEFAULT_ACTIVE)
  const [socialL2Active, setSocialL2Active] = useState('Publish/Calendar')
  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)
  const [wizardAgentDraft, setWizardAgentDraft] = useState<WizardAgentDraft | null>(null)
  const [isAgentSetupActive, setIsAgentSetupActive] = useState(false)
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

  function openIntegrationSettings(integrationId: string) {
    setRailActive('settings')
    setSettingsTab('Integrations')
    setSettingsSubScreen(`integration-${integrationId}`)
  }

  function handleProductChange(id: string) {
    setActiveProduct(id)
    setNavActive(DEFAULT_NAV_BY_PRODUCT[id] ?? 'manage-appointments')
    setEditingAgentName(null)
    setWizardAgentDraft(null)
    setIsAgentSetupActive(false)
    setIntakeDetail(null)
    setAppointmentDetail(null)
    setWaitlistDetail(null)
    setLeadDetail(null)
    setServiceRequestDetail(null)
  }

  function handleEditAgent(name: string, draft?: WizardAgentDraft) {
    setWizardAgentDraft(draft ?? null)
    setEditingAgentName(name)
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
    railActive !== 'settings' &&
    railActive !== 'inbox' &&
    railActive !== 'content-hub' &&
    railActive !== 'search' &&
    railActive !== 'social'

  return (
    <ProcedureStoreProvider>
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
      <div className="h-screen w-screen flex overflow-hidden bg-surface-shell text-text-primary">

        {/* ── L1 Icon rail ── */}
        <IconRail
          logoSrc={logoSrc}
          brand={PRODUCT_BRAND[activeProduct]}
          groups={RAIL_GROUPS}
          activeId={railActive}
          onSelect={setRailActive}
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
              {/* SVG gradient def for sparkle icon stroke */}
              <svg aria-hidden className="absolute h-0 w-0 overflow-hidden">
                <defs>
                  <linearGradient id="birdgpt-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#9970D7" />
                    <stop offset="55%"  stopColor="#7f87e8" />
                    <stop offset="100%" stopColor="#2552ED" />
                  </linearGradient>
                </defs>
              </svg>

              {/* + button — matches contenthub 2.0 QuickCreateLauncher trigger */}
              <button
                type="button"
                aria-label="Create new"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-surface-l2 transition-colors hover:bg-surface-selected"
              >
                <Icon name="add" size={18} className="text-text-primary" />
              </button>

              {/* Ask BirdGPT — matches contenthub 2.0 Button style */}
              <button
                type="button"
                className="group flex h-[30px] items-center gap-[5px] rounded-lg bg-surface-l2 px-[10px] transition-colors hover:bg-surface-selected"
              >
                <span
                  className="shrink-0 group-hover:[animation:myna-cta-icon-tilt_360ms_ease-out_1] material-symbols-outlined select-none"
                  style={{ fontSize: 14, color: '#9970D7', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  aria-hidden
                >auto_awesome</span>
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
                className="flex size-[30px] items-center justify-center rounded-lg bg-surface-l2 transition-colors hover:bg-surface-selected"
              >
                <Icon name="menu" size={18} className="text-text-icon" />
              </button>
            </div>
          </header>

          {/* ── Gutter row — gray bg, padding exposes the rounded card ── */}
          <div className="flex-1 flex min-h-0 overflow-hidden pr-[10px] pb-[10px] bg-surface-shell">

            {/* ── White rounded card (L2 nav + main content) ── */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden rounded-lg border border-border">

              {/* L2 SideNav — frontdesk modules */}
              {showL2 && (
                <SideNav
                  title="Front desk"
                  sections={NAV_SECTIONS_BY_PRODUCT[activeProduct] ?? AUTOMOTIVE_NAV_SECTIONS}
                  activeId={navActive}
                  onSelect={(id) => {
                    if (id === 'knowledge-base') {
                      setRailActive('settings')
                      setSettingsTab('Knowledge')
                    } else if (id === 'widgets') {
                      setRailActive('settings')
                      setSettingsTab('Widgets')
                    } else {
                      setNavActive(id)
                    }
                  }}
                />
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
                  ) : (
                    <SettingsScreen
                      initialTab={settingsTab}
                      onTabConsumed={() => setSettingsTab(null)}
                      onWebWidgets={() => setSettingsSubScreen('web-widgets')}
                      onAppointmentWidgets={() => setSettingsSubScreen('appointment-widgets')}
                    />
                  )
                ) : railActive === 'inbox' ? (
                  <InboxScreen />
                ) : isEditingWorkflow ? (
                  <WorkflowEditorScreen
                    agentName={editingAgentName}
                    onClose={() => {
                      setEditingAgentName(null)
                      setWizardAgentDraft(null)
                    }}
                    product={activeProduct}
                    wizardDraft={wizardAgentDraft}
                    agentStatus={
                      editingAgentName?.includes('Schedule based') || editingAgentName?.includes('Event trigger based')
                        ? 'Draft'
                        : undefined
                    }
                  />
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
                    onEditAgent={handleEditAgent}
                    onOpenIntegrationSettings={openIntegrationSettings}
                    onAgentSetupActiveChange={setIsAgentSetupActive}
                    product={activeProduct}
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
        </div>{/* end right column */}
      </div>

    </ProcedureStoreProvider>
  )
}
