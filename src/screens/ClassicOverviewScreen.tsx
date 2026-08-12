import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Chip, DataTable, DatePickerModal, Icon, InfoTooltip, StackedBarChart, Tooltip, TopNav, TrendLineChart, type Column } from '../components'
import iconGoogle from '../assets/icon-google.svg'
import iconGooglePlay from '../assets/icon-google-play.svg'
import {
  OVERVIEW_APPOINTMENTS_STATS,
  OVERVIEW_BIRDEYE_SCORE,
  OVERVIEW_INBOX_ACTIVITY_STATS,
  OVERVIEW_INBOX_ALERT_STATS,
  OVERVIEW_LISTINGS_GOOGLE_REPORT,
  OVERVIEW_LISTINGS_QA,
  OVERVIEW_MEDIAN_RESPONSE_TREND,
  OVERVIEW_REFERRALS_STATS,
  OVERVIEW_REVIEWS_BREAKDOWN,
  OVERVIEW_REVIEWS_RATING,
  OVERVIEW_REVIEWS_STATS,
  OVERVIEW_REVIEW_SOURCES,
  OVERVIEW_SOCIAL_DATA,
  OVERVIEW_SOCIAL_NEW_FOLLOWERS,
  OVERVIEW_SOCIAL_SERIES,
  OVERVIEW_TOP_LOCATIONS,
  OVERVIEW_UNDERSTANDING_SCORES,
  type OverviewLocationScoreRow,
  type OverviewStat,
} from '../data/overviewData'

interface ClassicOverviewScreenProps {
  userName?: string
  /** Shows a "Switch to agentic overview" button in the welcome header; called on click. */
  onSwitchToAgentic?: () => void
}

// Every KPI tile across the page (every widget's StatGroup/OutcomeKpiGroup) floors at 250px, but
// grows wider when its own value/label text needs more room (nowrap, so long text stretches the
// tile instead of wrapping to a second line). There's no fixed per-row count — however many tiles
// actually fit across the card's width stay on that line, and the rest wrap to the next one.
const KPI_TILE_CLASS = 'min-w-[250px] shrink-0'
const KPI_ROW_CLASS = 'flex flex-wrap gap-sm'

function StatGroup({
  stats,
  big = false,
}: {
  stats: OverviewStat[]
  /** Uses the 24px `text-display` token instead of the default 18px `text-h3` — Overview (mixed) only. */
  big?: boolean
}) {
  return (
    <div className={KPI_ROW_CLASS}>
      {stats.map((s) => (
        <div key={s.id} className={KPI_TILE_CLASS}>
          <p
            className={`m-0 whitespace-nowrap ${big ? 'text-display' : 'text-h3'} ${
              s.danger ? 'text-chip-danger-text' : s.muted ? 'text-text-tertiary' : 'text-text-primary'
            }`}
          >
            {s.value}
          </p>
          <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
            {s.label}
            {s.tooltip && <InfoTooltip text={s.tooltip} variant="detail" />}
          </p>
        </div>
      ))}
    </div>
  )
}

// "16,230" → 16230, "7.9K" → 7900 — agentDirectoryData.ts mixes both formats.
function parseOutcomeNumber(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed.toUpperCase().endsWith('K')) return parseFloat(trimmed) * 1000
  return parseFloat(trimmed.replace(/,/g, ''))
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${parseFloat((n / 1000).toFixed(1))}K`
  return String(Math.round(n))
}

interface OutcomeKpi {
  id: string
  value: string
  label: string
  agentName: string
  agentPct?: string
  danger?: boolean
}

// Same tile shape as StatGroup, with a small violet agent-contribution badge next to the value —
// hovering it explains which agent and how much of the total that share represents.
function OutcomeKpiGroup({ stats, big = true }: { stats: OutcomeKpi[]; big?: boolean }) {
  return (
    <div className={KPI_ROW_CLASS}>
      {stats.map((s) => {
        const pctNum = s.agentPct ? parseFloat(s.agentPct) : null
        const contribution = pctNum != null ? formatNumber((parseOutcomeNumber(s.value) * pctNum) / 100) : null
        return (
          <div key={s.id} className={KPI_TILE_CLASS}>
            <p
              className={`m-0 flex items-baseline gap-xs whitespace-nowrap ${big ? 'text-display' : 'text-h3'} ${
                s.danger ? 'text-chip-danger-text' : 'text-text-primary'
              }`}
            >
              {s.value}
              {s.agentPct && (
                <Tooltip
                  variant="detail"
                  content={`${s.agentName} handled ${contribution} of ${s.value} ${s.label.toLowerCase()}.`}
                >
                  <span className="text-[14px] leading-none text-ai-brand">{s.agentPct}</span>
                </Tooltip>
              )}
            </p>
            <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function InboxSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      <StatGroup stats={OVERVIEW_INBOX_ALERT_STATS} big />
    </>
  )
}

const REVIEW_SOURCE_LOGOS: Record<string, string> = {
  google: iconGoogle,
  'google-play': iconGooglePlay,
}

function ReviewsSection() {
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set())
  const maxCount = Math.max(...OVERVIEW_REVIEWS_BREAKDOWN.map((b) => b.count))

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Reviews</h3>

      <div className="flex items-center gap-sm">
        <span className="text-display text-text-primary">{OVERVIEW_REVIEWS_RATING}</span>
        <div className="flex items-center gap-[2px] text-[#f5a623]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="star" size={18} fill />
          ))}
        </div>
      </div>

      <div className="mt-lg flex flex-wrap items-start gap-3xl">
        <div className="flex min-w-[320px] max-w-[50%] flex-1 flex-col gap-sm">
          {OVERVIEW_REVIEWS_BREAKDOWN.map((b) => (
            <div key={b.stars} className="flex items-center gap-md">
              <span className="w-[28px] shrink-0 text-small text-text-secondary">{b.stars} ★</span>
              <div className="flex flex-1 items-center gap-sm">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-selected">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#f5a623]"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-[64px] shrink-0 text-right text-small text-text-secondary">
                  {b.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-w-[280px] max-w-[380px] flex-col gap-md">
          {OVERVIEW_REVIEW_SOURCES.map((s) => {
            const logo = !brokenLogos.has(s.id) ? REVIEW_SOURCE_LOGOS[s.id] : undefined
            return (
              <div key={s.id} className="flex items-center gap-md rounded-sm border border-border px-lg py-md">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-body ${logo ? '' : s.iconColorClassName}`}>
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="size-6"
                      onError={() => setBrokenLogos((prev) => new Set(prev).add(s.id))}
                    />
                  ) : (
                    <Icon name={s.icon} size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-small text-text-tertiary">{s.name}</p>
                  <p className="m-0 flex items-center gap-xs text-body text-text-primary">
                    {s.rating}
                    <Icon name="star" size={14} fill className="text-[#f5a623]" />
                    <span className="text-small text-text-tertiary">{s.reviewCount}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-x-3xl gap-y-xl pl-xl pr-xl">
          {OVERVIEW_REVIEWS_STATS.map((s) => (
            <div key={s.id}>
              <p className={`m-0 whitespace-nowrap text-display ${s.danger ? 'text-chip-danger-text' : 'text-text-primary'}`}>{s.value}</p>
              <p className="m-0 mt-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function ListingsSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Listings</h3>
      <h3 className="m-0 mb-lg text-body text-text-primary">Google report</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_GOOGLE_REPORT} big />

      <h3 className="m-0 mb-lg mt-3xl text-body text-text-primary">Google Q&A · By location</h3>
      <StatGroup stats={OVERVIEW_LISTINGS_QA} big />
    </>
  )
}

function ReferralsSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Referrals</h3>
      <StatGroup stats={OVERVIEW_REFERRALS_STATS} big />
    </>
  )
}

function AppointmentsSection() {
  const totalAppointments = OVERVIEW_APPOINTMENTS_STATS.find((s) => s.id === 'total-appointments')!
  const restStats = OVERVIEW_APPOINTMENTS_STATS.filter((s) => s.id !== 'total-appointments')
  const appointmentsKpis: OutcomeKpi[] = [
    { id: totalAppointments.id, value: totalAppointments.value, label: totalAppointments.label, agentName: 'Appointment agent', agentPct: '65%' },
    { id: 'confirmed-appointments', value: '2.4K', label: 'Confirmed appointments', agentName: 'Reminder agent', agentPct: '78%' },
    ...restStats.map((s) => ({ id: s.id, value: s.value, label: s.label, agentName: '', danger: s.danger })),
  ]

  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Appointments</h3>
      <OutcomeKpiGroup stats={appointmentsKpis} big hideIcon />
    </>
  )
}

function InboxActivitySection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Inbox</h3>
      <StatGroup stats={OVERVIEW_INBOX_ACTIVITY_STATS} big />
      <div className="mt-2xl">
        <TrendLineChart data={OVERVIEW_MEDIAN_RESPONSE_TREND} height={260} />
      </div>
    </>
  )
}

function SocialSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Social</h3>
      <div>
        <p className="m-0 text-display text-text-primary">{OVERVIEW_SOCIAL_NEW_FOLLOWERS}</p>
        <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">New followers</p>
      </div>
      <div className="mt-2xl">
        <StackedBarChart data={OVERVIEW_SOCIAL_DATA} series={OVERVIEW_SOCIAL_SERIES} xKey="month" height={280} grouped />
      </div>
    </>
  )
}


// Wraps a single business-metric section (Inbox, Reviews, Listings...) in a bordered card.
function CoworkerSectionsCard({ sections }: { sections: ReactNode[] }) {
  return (
    <div className="rounded-md border border-border bg-surface p-xl pb-[36px]">
      {sections.map((section, i) => (
        <div key={i} className={i !== 0 ? 'mt-2xl' : undefined}>
          {section}
        </div>
      ))}
    </div>
  )
}

const LOCATION_SCORE_COLUMNS: Column<OverviewLocationScoreRow>[] = [
  { key: 'location', label: 'Locations', width: 260, sortable: true },
  {
    key: 'birdeyeScore',
    label: 'Birdeye Score',
    width: 160,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant="success" />,
  },
  { key: 'sentimentScore', label: 'Sentiment Score', width: 160, sortable: true },
  { key: 'reputationScore', label: 'Reputation Score', width: 160, sortable: true },
  { key: 'listingScore', label: 'Listing Score', width: 160, sortable: true },
]

function InsightsAiSection() {
  return (
    <>
      <h3 className="m-0 mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Insights AI</h3>
      <div className={KPI_ROW_CLASS}>
        <div className={KPI_TILE_CLASS}>
          <p className="m-0 whitespace-nowrap text-display text-text-primary">{OVERVIEW_BIRDEYE_SCORE.value}</p>
          <p className="m-0 mt-xs flex items-center gap-xs whitespace-nowrap text-small uppercase tracking-wide text-text-tertiary">
            {OVERVIEW_BIRDEYE_SCORE.label}
            {OVERVIEW_BIRDEYE_SCORE.tooltip && <InfoTooltip text={OVERVIEW_BIRDEYE_SCORE.tooltip} variant="detail" />}
          </p>
        </div>
      </div>

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg flex items-center gap-xs text-body text-text-primary">
        Understanding the Birdeye Score
        <InfoTooltip text="How each underlying signal contributes to the overall Birdeye Score." variant="detail" />
      </p>
      <div className="grid grid-cols-3 gap-3xl">
        {OVERVIEW_UNDERSTANDING_SCORES.map((score) => (
          <div key={score.id}>
            <p className="m-0 text-display text-text-primary">{score.value}</p>
            <p className="m-0 mt-xs text-small uppercase tracking-wide text-text-tertiary">{score.label}</p>
          </div>
        ))}
      </div>

      <div className="my-2xl border-t border-border" />

      <p className="m-0 mb-lg text-body text-text-primary">Top performing locations</p>
      <DataTable columns={LOCATION_SCORE_COLUMNS} data={OVERVIEW_TOP_LOCATIONS} />
    </>
  )
}

const DATE_RANGE_OPTIONS = ['Today', 'Last week', 'Last month', 'Last quarter']

// Keeps a dropdown panel mounted through its fade/scale-out before removing it, so closing eases
// out instead of snapping away.
function useOpenTransition(open: boolean, duration = 150) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  useEffect(() => {
    let raf1: number
    let raf2: number
    let timer: ReturnType<typeof setTimeout>
    if (open) {
      setMounted(true)
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true))
      })
    } else {
      setEntered(false)
      timer = setTimeout(() => setMounted(false), duration)
    }
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(timer)
    }
  }, [open, duration])

  return { mounted, entered }
}

const DROPDOWN_TRANSITION = 'transition-all duration-150 ease-out'
const DROPDOWN_HIDDEN = 'opacity-0 scale-95 -translate-y-1'
const DROPDOWN_SHOWN = 'opacity-100 scale-100 translate-y-0'

// Same trigger + preset-list + "Custom" calendar row as the date-range dropdown on the Overview
// (Co-workers directory) page, restyled with this repo's rounded-md chrome.
function DateRangeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarAnchor, setCalendarAnchor] = useState<{ top: number; left: number } | null>(null)
  const { mounted, entered } = useOpenTransition(open)
  const customRowRef = useRef<HTMLButtonElement>(null)
  const isCustomActive = !DATE_RANGE_OPTIONS.includes(value)

  function openCalendar() {
    if (!customRowRef.current) return
    const rect = customRowRef.current.getBoundingClientRect()
    setCalendarAnchor({ top: rect.bottom + 4, left: rect.left })
    setCalendarOpen(true)
  }

  function closeAll() {
    setOpen(false)
    setCalendarOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {value}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>

      {mounted && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={closeAll} />
          <div
            className={`absolute right-0 top-full z-[110] mt-xs min-w-[200px] origin-top-right rounded-sm border border-border bg-surface p-md shadow-dropdown ${DROPDOWN_TRANSITION} ${
              entered ? DROPDOWN_SHOWN : DROPDOWN_HIDDEN
            }`}
          >
            {DATE_RANGE_OPTIONS.map((opt) => {
              const isSel = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseEnter={() => setCalendarOpen(false)}
                  onClick={() => {
                    onChange(opt)
                    closeAll()
                  }}
                  className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                    isSel ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">{opt}</span>
                  {isSel && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
                </button>
              )
            })}

            <button
              ref={customRowRef}
              type="button"
              onClick={openCalendar}
              className={`flex w-full items-center gap-sm rounded-sm px-md py-sm text-left ${
                isCustomActive ? 'bg-surface-selected' : 'hover:bg-surface-hover'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-text-primary">Custom</span>
                {isCustomActive && <span className="block truncate text-small text-text-tertiary">{value}</span>}
              </span>
              <Icon name="chevron_right" size={18} className="shrink-0 text-text-icon" />
            </button>
          </div>
        </>
      )}

      <DatePickerModal
        open={calendarOpen}
        anchor={calendarAnchor}
        onClose={() => setCalendarOpen(false)}
        onApply={(label) => {
          onChange(label)
          closeAll()
        }}
      />
    </div>
  )
}

// "Classic overview" — the business-metrics dashboard (Inbox/Reviews/Listings/Referrals/
// Appointments/Social/Insights AI) ported from Akhil-myna-repo's OverviewFinalScreen, restyled
// with this repo's own chrome (rounded-md dropdown/CTA buttons). Reached only via the Overview
// page's "Switch to classic overview" toggle — never routed to directly.
export function ClassicOverviewScreen({ userName = 'Rupa', onSwitchToAgentic }: ClassicOverviewScreenProps) {
  const [dateRange, setDateRange] = useState('Last month')

  return (
    <div className="flex h-full flex-col">
      <TopNav
        title="Overview"
        initials="S"
        afterAvatar={
          <button
            type="button"
            className="flex h-7 items-center gap-xs rounded-full bg-ai-brand px-md text-small text-white hover:opacity-90"
          >
            <Icon name="auto_awesome" size={16} />
            Ask BirdGPT
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto bg-surface-l2 px-2xl py-xl">
        <div className="flex flex-col gap-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="m-0 text-display text-text-primary">Welcome, {userName}</h1>
              <p className="m-0 mt-xs text-body text-text-secondary">Here are the things which need your attention</p>
            </div>
            <div className="flex items-center gap-sm">
              {onSwitchToAgentic && (
                <button
                  type="button"
                  onClick={onSwitchToAgentic}
                  className="flex h-9 items-center gap-sm rounded-md border border-ai-brand bg-surface px-lg text-body text-ai-brand hover:bg-ai-summary"
                >
                  <Icon name="swap_horiz" size={18} className="text-ai-brand" />
                  Switch to agentic overview
                </button>
              )}
              <DateRangeDropdown value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          <CoworkerSectionsCard sections={[<InboxSection />]} />
          <CoworkerSectionsCard sections={[<ReviewsSection />]} />
          <CoworkerSectionsCard sections={[<ListingsSection />]} />
          <CoworkerSectionsCard sections={[<ReferralsSection />]} />
          <CoworkerSectionsCard sections={[<AppointmentsSection />]} />
          <CoworkerSectionsCard sections={[<InboxActivitySection />]} />
          <CoworkerSectionsCard sections={[<SocialSection />]} />
          <CoworkerSectionsCard sections={[<InsightsAiSection />]} />
        </div>
      </div>
    </div>
  )
}
