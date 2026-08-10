import React, { useEffect, useState } from 'react'
import { Globe, LayoutGrid, Navigation, Search, type LucideProps } from 'lucide-react'
import { Link, TopNav } from '../components'
import iconQrCode from '../assets/icon-qr-code.svg'
import iconSetupStatus from '../assets/icon-setup-status.svg'
import iconMediaLibrary from '../assets/icon-media-library.svg'
import iconFaqs from '../assets/icon-faqs.svg'
import iconLinks from '../assets/icon-links.svg'
import iconFiles from '../assets/icon-files.svg'
import iconDashboard from '../assets/icon-dashboard.svg'
import iconEmailText from '../assets/icon-email-text.svg'
import iconGoogle from '../assets/icon-google.svg'
import iconFacebook from '../assets/icon-facebook.svg'
import iconInstagram from '../assets/icon-instagram.svg'
import iconTwitter from '../assets/icon-twitter.svg'
import iconLinkedin from '../assets/icon-linkedin.svg'
import iconYoutube from '../assets/icon-youtube.svg'
import iconAppfolio from '../assets/icon-appfolio.svg'
import iconAllApps from '../assets/icon-all-apps.svg'
import iconApi from '../assets/icon-api.svg'
import iconAi from '../assets/icon-ai.svg'
import iconResponseTemplates from '../assets/icon-response-templates.svg'
import iconAutoReplyRules from '../assets/icon-auto-reply-rules.svg'
import iconAutoShareRules from '../assets/icon-auto-share-rules.svg'
import iconCategories from '../assets/icon-categories.svg'
import iconKeywords from '../assets/icon-keywords.svg'
import iconManageCompetitors from '../assets/icon-manage-competitors.svg'
import iconWebWidgets from '../assets/icon-web-widgets.svg'
import iconPayments from '../assets/icon-payments.svg'
import iconUsers from '../assets/icon-users.svg'
import iconEmployees from '../assets/icon-employees.svg'
import iconSupport from '../assets/icon-support.svg'
import iconBilling from '../assets/icon-billing.svg'
import iconAppointments from '../assets/icon-appointments.svg'
import iconTeams from '../assets/icon-teams.svg'

interface SettingItem {
  icon: string
  iconSrc?: string
  label: string
  subtext?: string
  status?: string
  statusColor?: string
}

interface SettingsSection {
  id: string
  title: string
  titleBadge?: string
  description: string
  learnMore?: boolean
  items: SettingItem[]
}

const SETTINGS_NAV = [
  'Business info',
  'Knowledge',
  'Branding',
  'Integrations',
  'BirdAI',
  'Reviews',
  'Insights',
  'Competitors',
  'Widgets',
  'Payments',
  'Account',
]

const SECTIONS: SettingsSection[] = [
  {
    id: 'business-info',
    title: 'Business info',
    description: 'Add all your business locations and unlock the power of Birdeye.',
    learnMore: true,
    items: [
      { icon: 'near_me',   label: 'Business', subtext: 'Manage your business details, contact information, and operating hours' },
      { icon: '', iconSrc: iconSetupStatus, label: 'Setup status', subtext: 'View setup progress and configuration status across locations' },
      { icon: '', iconSrc: iconQrCode, label: 'QR codes', subtext: 'Create QR codes to drive customer engagement and actions' },
    ],
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    description: 'Manage knowledge sources used by AI agents and automations.',
    items: [
      { icon: '', iconSrc: iconMediaLibrary, label: 'Media library', subtext: 'Upload and organize images, videos, and brand assets' },
      { icon: '', iconSrc: iconFaqs,  label: 'FAQs', subtext: 'Create and manage answers to frequently asked customer questions' },
      { icon: '', iconSrc: iconLinks, label: 'Links', subtext: 'Manage links shared across customer-facing experiences and channels' },
      { icon: '', iconSrc: iconFiles, label: 'Files', subtext: 'Upload and manage files used across your account' },
    ],
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Customize business-specific branding like color themes and brand names.',
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconDashboard,  label: 'Dashboard appearance', subtext: 'Customize your dashboard name, branding, and appearance settings' },
      { icon: '', iconSrc: iconEmailText, label: 'Email and text', subtext: 'Customize email and text templates, branding, and content' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect your social media pages to help promote brand content.',
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconGoogle,    label: 'Google',      subtext: 'Manage your Google Business Profile and customer interactions', status: '9 pages disconnected', statusColor: 'text-chip-danger-text' },
      { icon: '', iconSrc: iconFacebook,  label: 'Facebook',    subtext: 'Publish content and respond to messages from one place', status: 'Permission needed',    statusColor: 'text-chip-danger-text' },
      { icon: '', iconSrc: iconInstagram, label: 'Instagram',   subtext: 'Publish posts, manage comments, and respond to direct messages', status: '1 of 16 connected',    statusColor: 'text-accent-positive' },
      { icon: '', iconSrc: iconTwitter,   label: 'X (Twitter)', subtext: 'Publish content, monitor conversations, and manage direct messages', status: '1 page disconnected',  statusColor: 'text-chip-danger-text' },
      { icon: '', iconSrc: iconLinkedin,  label: 'LinkedIn',    subtext: "Publish content and manage your company's LinkedIn presence", status: '6 of 14 connected',    statusColor: 'text-accent-positive' },
      { icon: '', iconSrc: iconYoutube,   label: 'YouTube',     subtext: 'Upload and manage videos across connected YouTube channels', status: '6 of 14 connected',    statusColor: 'text-accent-positive' },
      { icon: '', iconSrc: iconAppfolio,  label: 'AppFolio',    subtext: 'Connect AppFolio to streamline communication with tenants', status: '1 of 2 connected',     statusColor: 'text-accent-positive' },
      { icon: '', iconSrc: iconAllApps,   label: 'All apps',    subtext: 'Discover and connect apps to extend your workflows' },
      { icon: '', iconSrc: iconApi,       label: 'API',         subtext: 'Integrate external systems and automate data exchange securely' },
    ],
  },
  {
    id: 'birdai',
    title: 'BirdAI',
    titleBadge: 'BETA',
    description: 'Optimize everyday tasks and boost your productivity with BirdAI.',
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconAi, label: 'Manage BirdAI', subtext: 'Configure AI features, summaries, and automated assistance' },
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews',
    description: 'Manage and cross-promote reviews on your social sites.',
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconResponseTemplates, label: 'Response templates', subtext: 'Create reusable response templates for customer communications' },
      { icon: '', iconSrc: iconAutoReplyRules,   label: 'Auto-reply rules', subtext: 'Automate responses using custom rules and triggers' },
      { icon: '', iconSrc: iconAutoShareRules,   label: 'Auto-share rules', subtext: 'Automatically share reviews across your social channels' },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    description: "Reveal meaningful and actionable insights via customers' feedback.",
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconCategories, label: 'Categories', subtext: 'Organize categories to measure business performance and insights' },
      { icon: '', iconSrc: iconKeywords,  label: 'Keywords and adjectives', subtext: 'Track keywords and sentiment across customer feedback' },
    ],
  },
  {
    id: 'competitors',
    title: 'Competitors',
    description: "Evaluate your competitors' strengths and weaknesses to reinforce your market strategy.",
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconManageCompetitors, label: 'Manage competitors', subtext: 'Add competitors and compare performance and customer sentiment' },
    ],
  },
  {
    id: 'widgets',
    title: 'Widgets',
    description: 'Manage and customize your web and appointment widgets.',
    items: [
      { icon: '', iconSrc: iconWebWidgets, label: 'Web widgets', subtext: 'Customize your widget in order to maximize conversions through webchat' },
      { icon: '', iconSrc: iconAppointments, label: 'Appointment widgets', subtext: 'Follow easy steps to customize the appointment widget and add it to your website' },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Get paid faster, improve customer satisfaction and track funds via Birdeye Payments.',
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconPayments, label: 'Set up payments', subtext: 'Add banking details and manage payment request settings' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Manage your account including users, employees, support and more.',
    learnMore: true,
    items: [
      { icon: '', iconSrc: iconUsers,     label: 'Users', subtext: 'Add users and manage roles, permissions, and notifications' },
      { icon: '', iconSrc: iconTeams,     label: 'Teams', subtext: 'Organize users into teams for efficient collaboration' },
      { icon: '', iconSrc: iconEmployees, label: 'Employees', subtext: 'Add employees and manage customer-facing interactions' },
      { icon: '', iconSrc: iconBilling,   label: 'Billing', subtext: 'View invoices, subscriptions, and payment information' },
      { icon: '', iconSrc: iconSupport,   label: 'Support', subtext: 'Access help resources and contact the support team' },
      { icon: 'language',                 label: 'Timezone', subtext: "Configure your account's timezone and regional settings" },
      { icon: 'grid_view',                label: 'Products', subtext: 'Manage active and inactive products available in your account' },
    ],
  },
]

export function SettingsScreen({ initialTab, onTabConsumed, onWebWidgets, onAppointmentWidgets }: { initialTab?: string | null; onTabConsumed?: () => void; onWebWidgets?: () => void; onAppointmentWidgets?: () => void }) {
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState(initialTab ?? SETTINGS_NAV[0])

  useEffect(() => {
    if (!initialTab) return
    setActiveNav(initialTab)
    const sectionId = SECTIONS.find((s) => s.title === initialTab)?.id
    if (!sectionId) return
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    onTabConsumed?.()
  }, [initialTab, onTabConsumed])

  const filtered = query.trim()
    ? SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.items.some((item) => item.label.toLowerCase().includes(query.toLowerCase())),
      )
    : SECTIONS

  return (
    <div className="flex h-full">
      {/* Left settings nav — matches SideNav styling */}
      <aside className="flex h-full w-[222px] flex-col border-r border-border bg-surface-l2">
        <div className="flex h-[52px] shrink-0 flex-col justify-center px-lg">
          <h1 className="text-h3 text-text-primary">Settings</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-xs overflow-y-auto px-lg py-sm">
          {SETTINGS_NAV.map((item) => {
            const isActive = activeNav === item
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveNav(item)
                  const sectionId = SECTIONS.find((s) => s.title === item)?.id
                  if (sectionId) {
                    const el = document.getElementById(sectionId)
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className={`flex h-7 w-full items-center rounded-sm px-sm py-[6px] text-left text-body font-light text-text-primary transition-colors ${
                  isActive ? 'bg-surface-selected' : 'hover:bg-surface-selected'
                }`}
              >
                {item}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Right side — TopNav + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav initials="S" />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Sticky search bar */}
          <div className="shrink-0 px-2xl pt-2xl pb-md" style={{ backgroundColor: '#F5F5F5' }}>
            <div className="flex items-center gap-sm rounded-sm border border-border bg-surface px-lg py-md">
              <Search className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search settings"
                className="flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {/* Scrollable section cards */}
          <div className="flex-1 overflow-y-auto px-2xl pb-2xl" style={{ backgroundColor: '#F5F5F5' }}>
          <div className="flex flex-col gap-md">
            {filtered.map((section) => (
              <div key={section.id} id={section.id} className="rounded-sm bg-surface">
                {/* Section header — 24px padding */}
                <div className="px-2xl pt-2xl">
                  <div className="flex items-center gap-sm">
                    <h3 className="text-h3 text-text-primary">{section.title}</h3>
                    {section.titleBadge && (
                      <span className="rounded-sm border border-border px-xs py-[1px] text-[10px] text-text-secondary">
                        {section.titleBadge}
                      </span>
                    )}
                  </div>
                  <p className="mt-xs text-body text-text-secondary">
                    {section.description}
                    {section.learnMore && (
                      <>{' '}<Link as="button">Learn more</Link></>
                    )}
                  </p>
                </div>

                {/* Items — 3 col grid, each item 88px tall */}
                {section.items.length > 0 && (
                  <div className="grid grid-cols-3 px-2xl pb-2xl pt-lg">
                    {section.items.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.label === 'Web widgets' ? onWebWidgets : item.label === 'Appointment widgets' ? onAppointmentWidgets : undefined}
                        className="group flex h-[88px] items-center gap-md overflow-hidden rounded-sm px-sm text-left hover:bg-surface-hover"
                      >
                        {item.iconSrc
                          ? <img src={item.iconSrc} alt="" className="size-[22px] shrink-0 text-text-icon" />
                          : (() => { const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = { near_me: Navigation, language: Globe, grid_view: LayoutGrid }; const I = ICON_MAP[item.icon]; return I ? <I className="size-[22px] shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth /> : null })()
                        }
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-sm">
                            <span className="text-body text-text-primary">{item.label}</span>
                            {item.status && (
                              <span className="flex shrink-0 items-center gap-xs text-small whitespace-nowrap text-[#8F8F8F]">
                                <span className={`inline-block size-[6px] shrink-0 rounded-full bg-current ${item.statusColor ?? 'text-accent-positive'}`} />
                                {item.status}
                              </span>
                            )}
                          </div>
                          {item.subtext && (
                            <p className="mt-0 max-h-0 overflow-hidden text-small text-text-secondary opacity-0 transition-all duration-200 group-hover:mt-[3px] group-hover:max-h-[2rem] group-hover:opacity-100">
                              {item.subtext}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
