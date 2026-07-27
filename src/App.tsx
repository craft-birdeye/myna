import { useState } from 'react'
import { FRONT_DESK_INBOX_CONVERSATION_ID } from './data/frontDeskCallConversation'
import { ProcedureStoreProvider } from './data/ProcedureStoreContext'
import type { WizardAgentDraft } from './data/wizardAgentConfig.types'
import { Icon, IconRail, Link, RecordDetailScreen, SideNav, Toast, TopNav, type NavSection, type RailGroup, type Product } from './components'
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
import iconMarketing from './assets/icon-marketing.svg'
import iconAgents from './assets/icon-agents.svg'

function EmptyResourceScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />
      <div className="flex flex-1 items-center justify-center text-body text-text-secondary">
        No {label.toLowerCase()} data yet.
      </div>
    </div>
  )
}

const RAIL_GROUPS: RailGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview', label: 'Overview', icon: 'home' },
      { id: 'agents', label: 'Agents', icon: iconAgents, kind: 'image', badge: 'New' },
    ],
  },
  {
    id: 'marketing',
    header: 'Marketing',
    items: [
      { id: 'search', label: 'Search AI', icon: 'lightbulb' },
      { id: 'listings', label: 'Listings AI', icon: 'place' },
      { id: 'reviews', label: 'Reviews AI', icon: 'star' },
      { id: 'social', label: 'Social AI', icon: 'workspaces' },
      { id: 'referral', label: 'Referral', icon: 'featured_seasonal_and_gifts' },
      { id: 'marketing-automation', label: 'Marketing Automation AI', icon: iconMarketing, kind: 'image' },
    ],
  },
  {
    id: 'operations',
    header: 'Operations',
    items: [
      { id: 'inbox', label: 'Inbox', icon: 'sms' },
      { id: 'frontdesk', label: 'Front desk', icon: 'desktop_windows' },
    ],
  },
  {
    id: 'cx',
    header: 'Customer experience',
    items: [
      { id: 'surveys', label: 'Surveys AI', icon: 'assignment_turned_in' },
      { id: 'ticketing', label: 'Ticketing', icon: 'shapes' },
      { id: 'insights', label: 'Insights AI', icon: 'emoji_objects' },
    ],
  },
  {
    id: 'footer',
    items: [
      { id: 'reports', label: 'Reports', icon: 'pie_chart' },
      { id: 'patients', label: 'Patients', icon: 'group' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

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


export function App() {
  const [initialDetailView] = useState(() => parseInitialDetailView())
  const [railActive, setRailActive] = useState('frontdesk')
  const [navActive, setNavActive] = useState(
    () => DETAIL_VIEW_NAV[initialDetailView?.view ?? ''] ?? 'manage-appointments',
  )
  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)
  const [wizardAgentDraft, setWizardAgentDraft] = useState<WizardAgentDraft | null>(null)
  const [isAgentSetupActive, setIsAgentSetupActive] = useState(false)
  const [activeProduct, setActiveProduct] = useState('healthcare')
  const [settingsTab, setSettingsTab] = useState<string | null>(null)
  const [settingsSubScreen, setSettingsSubScreen] = useState<string | null>(null)
  const [agentToastMessage, setAgentToastMessage] = useState('')
  const [agentToastVisible, setAgentToastVisible] = useState(false)
  const [inboxFocusId, setInboxFocusId] = useState<string | null>(null)

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

  return (
    <ProcedureStoreProvider>
    <div className="flex h-screen w-screen overflow-hidden bg-surface text-text-primary">
      <IconRail
        logoSrc={logoSrc}
        brand={PRODUCT_BRAND[activeProduct]}
        groups={RAIL_GROUPS}
        activeId={railActive}
        onSelect={setRailActive}
        products={PRODUCTS}
        activeProduct={activeProduct}
        onProductChange={handleProductChange}
      />
      {!isEditingWorkflow && !isViewingDetail && !isAgentSetupActive && railActive !== 'settings' && railActive !== 'inbox' && (
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
      <main className="flex flex-1 flex-col overflow-hidden">
        {railActive === 'settings' ? (
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
            <SettingsScreen initialTab={settingsTab} onTabConsumed={() => setSettingsTab(null)} onWebWidgets={() => setSettingsSubScreen('web-widgets')} onAppointmentWidgets={() => setSettingsSubScreen('appointment-widgets')} />
          )
        ) : railActive === 'inbox' ? (
          <InboxScreen
            initialConversationId={inboxFocusId}
            onInitialConversationConsumed={() => setInboxFocusId(null)}
          />
        ) : isEditingWorkflow ? (
          <>
            <TopNav title="Front desk" initials="S" />
            <div className="flex-1 overflow-hidden">
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
            </div>
          </>
        ) : navActive === 'review-waitlist' && waitlistDetail ? (
          <>
            <TopNav title="Contacts" initials="S" />
            <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
              <Link
                as="button"
                className="text-body"
              >
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
            <TopNav title="Contacts" initials="S" />
            <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
              <Link
                as="button"
                className="text-body"
              >
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
            <TopNav title="Front desk" initials="S" />
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
            <TopNav title="Contacts" initials="S" />
            <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
              <Link
                as="button"
                className="text-body"
              >
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
        ) : navActive === 'knowledge-base' ? (
          <EmptyResourceScreen label="Knowledge base" />
        ) : navActive === 'phone-number' ? (
          // Phone number 1 (Abhishek's version) — commented out, do not delete:
          // <PhoneNumberScreen />
          <PhoneNumber2Screen />
        ) : navActive === 'voices' ? (
          <EmptyResourceScreen label="Voices" />
        ) : navActive === 'web-widget' ? (
          <EmptyResourceScreen label="Web widget" />
        ) : navActive === 'appointment-widget' ? (
          <EmptyResourceScreen label="Appointment widget" />
        ) : navActive === 'forms' ? (
          <EmptyResourceScreen label="Forms" />
        ) : navActive === 'widgets' ? (
          <EmptyResourceScreen label="Widgets" />
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
            onNavigateToInbox={(conversationId) => {
              setInboxFocusId(conversationId ?? FRONT_DESK_INBOX_CONVERSATION_ID)
              setRailActive('inbox')
            }}
            product={activeProduct}
          />
        ) : appointmentDetail ? (
          <>
            <TopNav title="Contacts" initials="S" />
            <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
              <Link
                as="button"
                className="text-body"
              >
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

      <Toast
        message={agentToastMessage}
        visible={agentToastVisible}
        onClose={() => setAgentToastVisible(false)}
      />
    </div>
    </ProcedureStoreProvider>
  )
}
