/**
 * Prototype: one consistent agent-level navigation for every agent — the same five top-level
 * sections everywhere, with the L1s underneath varying by section (not by agent):
 *
 *   Build      Agent composer · Procedure · Tools · Knowledge · Workflows
 *   Test       Test runs · Test suite
 *   Deploy     Channels · Versioning
 *   Observe    Logs · Human review · Analytics
 *   Optimize   Recommendation · Coaching
 *
 * Shown here for "Review response agent - North Region". Where the app already has the
 * content (workflow canvas, test runs, logs, outcome tiles, coaching) the real thing mounts;
 * the rest are labelled placeholders so the shape of the nav can be judged on its own.
 */
import { useState } from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import { Chip } from '../components/Chip/Chip'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { GhostwriterTestRunPanel } from '../components/GhostwriterTestRunPanel/GhostwriterTestRunPanel'
import { Icon } from '../components/Icon/Icon'
import { MetricTiles } from '../components/MetricTiles/MetricTiles'
import type { Metric } from '../components/MetricTiles/MetricTiles.types'
import { Tabs } from '../components/Tabs/Tabs'
import { DEFAULT_23SEP_TEST_BATCHES, DEFAULT_23SEP_TEST_SUITES } from '../data/ghostwriterTestRuns'
import { REVIEW_COACHING_AGENT, REVIEW_COACHING_SEEDS } from '../data/reviewCoaching'
import { AgentLogsTab } from './AgentLogsTab'
import { RecommendationsTab } from './RecommendationsTab'
import { WorkflowViewerTab } from './WorkflowViewerTab'

export const UNIFIED_NAV_AGENT = 'Review response agent - North Region'

type SectionId = 'build' | 'test' | 'deploy' | 'observe' | 'optimize'

interface Section {
  id: SectionId
  label: string
  items: { id: string; label: string }[]
}

/** The two groups read as "make it" and "run it" — the gap between them is deliberate. */
const SECTION_GROUPS: Section[][] = [
  [
    {
      id: 'build',
      label: 'Build',
      items: [
        { id: 'agent-composer', label: 'Agent composer' },
        { id: 'procedure', label: 'Procedure' },
        { id: 'tools', label: 'Tools' },
        { id: 'knowledge', label: 'Knowledge' },
        { id: 'workflows', label: 'Workflows' },
      ],
    },
    {
      id: 'test',
      label: 'Test',
      items: [
        { id: 'test-runs', label: 'Test runs' },
        { id: 'test-suite', label: 'Test suite' },
      ],
    },
    {
      id: 'deploy',
      label: 'Deploy',
      items: [
        { id: 'channels', label: 'Channels' },
        { id: 'versioning', label: 'Versioning' },
      ],
    },
  ],
  [
    {
      id: 'observe',
      label: 'Observe',
      items: [
        { id: 'logs', label: 'Logs' },
        { id: 'human-review', label: 'Human review' },
        { id: 'analytics', label: 'Analytics' },
      ],
    },
    {
      id: 'optimize',
      label: 'Optimize',
      items: [
        { id: 'recommendation', label: 'Recommendation' },
        { id: 'coaching', label: 'Coaching' },
      ],
    },
  ],
]

const SECTIONS = SECTION_GROUPS.flat()

const REVIEW_METRICS: Metric[] = [
  { id: 'reviewsResponded', value: '835', label: 'Reviews responded', delta: '1.3%', trend: 'up', info: true, tooltip: 'Total reviews the agent has replied to across all locations in the selected period.' },
  { id: 'responseRate', value: '92%', label: 'Response rate', delta: '1.3%', trend: 'up', info: true, tooltip: 'Percentage of eligible reviews that received a reply from the agent.' },
  { id: 'avgResponseTime', value: '20m', label: 'Average response time', delta: '1.3%', trend: 'up', info: true, tooltip: 'Average time from review receipt to published reply across all locations.' },
  { id: 'timeSaved', value: '6h 20m', label: 'Time saved', delta: '1.3%', trend: 'up', info: true, tooltip: 'Estimated staff time saved by automating review responses.' },
]

/* ─── Placeholder content ────────────────────────────────────────────────────── */

interface Row {
  icon: string
  title: string
  meta: string
  chip?: { label: string; variant: 'success' | 'neutral' | 'info' | 'warning' }
}

/** A plain list — enough to show what the L1 holds without building the real screen. */
function RowList({ rows, footnote }: { rows: Row[]; footnote?: string }) {
  return (
    <div className="flex flex-col gap-lg px-2xl py-lg">
      <ul className="m-0 flex list-none flex-col divide-y divide-border rounded-sm border border-border">
        {rows.map((row) => (
          <li key={row.title} className="flex items-center gap-md px-lg py-md">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon">
              <Icon name={row.icon} size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-2xs">
              <span className="text-body text-text-primary">{row.title}</span>
              <span className="text-small text-text-secondary">{row.meta}</span>
            </span>
            {row.chip && <Chip label={row.chip.label} variant={row.chip.variant} />}
          </li>
        ))}
      </ul>
      {footnote && <p className="m-0 text-small text-text-tertiary">{footnote}</p>}
    </div>
  )
}

const PLACEHOLDERS: Record<string, { rows: Row[]; footnote?: string }> = {
  'agent-composer': {
    rows: [
      { icon: 'auto_awesome', title: 'Edit with AI', meta: 'The copilot that built this agent — ask for a change and review it before it lands', chip: { label: 'Prototype', variant: 'info' } },
      { icon: 'flag', title: 'Goals and outcomes', meta: 'Respond to reviews automatically using the right template; hold what can’t post' },
      { icon: 'location_on', title: 'Locations', meta: '104 locations · North Region' },
    ],
    footnote: 'Agent composer is the Ghostwriter chat, docked on the canvas — shown under Build → Workflows in this prototype.',
  },
  procedure: {
    rows: [
      { icon: 'menu_book', title: 'Respond to a negative review', meta: '6 steps · name the problem, acknowledge, one next step, billing to DM, sign off, 60–90 words' },
      { icon: 'menu_book', title: 'Hold a suspected spam review', meta: '3 steps · never reply publicly, queue it, add to the 8am digest' },
      { icon: 'menu_book', title: 'Escalate safety, legal or billing', meta: '4 steps · no public reply, assign to a named person' },
    ],
  },
  tools: {
    rows: [
      { icon: 'shield', title: 'Spam gate', meta: 'Threshold 0.8 · used by Triage review', chip: { label: 'Birdeye', variant: 'neutral' } },
      { icon: 'description', title: 'Select template', meta: '6 templates selected · used by Generate response', chip: { label: 'Birdeye', variant: 'neutral' } },
      { icon: 'publish', title: 'Publish response', meta: 'Auto-post 4–5★, hold 3★ and below', chip: { label: 'Birdeye', variant: 'neutral' } },
      { icon: 'confirmation_number', title: 'Create ticket in Birdeye', meta: '1–2★ reviews about the business · assigned to the location owner', chip: { label: 'Birdeye', variant: 'neutral' } },
      { icon: 'mail', title: 'Send email', meta: 'Daily digest of held reviews, 8am', chip: { label: 'Birdeye', variant: 'neutral' } },
    ],
  },
  knowledge: {
    rows: [
      { icon: 'description', title: 'Review response requirements.pdf', meta: '4 pages · 11 requirements · uploaded Sep 23' },
      { icon: 'rule', title: 'Six writing rules', meta: 'Learned from 31 hand-written replies' },
      { icon: 'record_voice_over', title: 'Brand voice', meta: 'Tone, forbidden phrases, signature' },
      { icon: 'link', title: 'Google and Yelp content policies', meta: '2 links · read by Triage review' },
    ],
  },
  channels: {
    rows: [
      { icon: 'storefront', title: 'Google Business Profile', meta: '4 locations · replies enabled', chip: { label: 'Connected', variant: 'success' } },
      { icon: 'thumb_up', title: 'Facebook', meta: '1 page · replies enabled', chip: { label: 'Connected', variant: 'success' } },
      { icon: 'shop', title: 'Google Play', meta: 'Read only — replies not supported by the source', chip: { label: 'Read only', variant: 'neutral' } },
      { icon: 'verified', title: 'ShopperApproved', meta: 'Read only — replies not supported by the source', chip: { label: 'Read only', variant: 'neutral' } },
    ],
  },
  versioning: {
    rows: [
      { icon: 'history', title: 'v3 — Create ticket for highly negative reviews', meta: 'Published Sep 23 by Rupa · 1 node added', chip: { label: 'Active', variant: 'success' } },
      { icon: 'history', title: 'v2 — Spam guideline update', meta: 'Published Sep 22 by Robin · from coaching' },
      { icon: 'history', title: 'v1 — Initial build', meta: 'Published Aug 6 by Rupa · built with Ghostwriter' },
    ],
    footnote: 'Open a version to compare it with the active one or roll back.',
  },
  'human-review': {
    rows: [
      { icon: 'rate_review', title: '12 replies waiting for approval', meta: '3★ and below, drafted in the last 24 hours', chip: { label: 'Needs review', variant: 'warning' } },
      { icon: 'inbox', title: '4 reviews held by the spam gate', meta: 'In this morning’s 8am digest' },
      { icon: 'assignment_ind', title: '2 reviews assigned to Robin', meta: 'Billing dispute · legal mention' },
    ],
  },
}

/* ─── Screen ─────────────────────────────────────────────────────────────────── */

export interface AgentUnifiedNavScreenProps {
  onBack?: () => void
  /** Build → Workflows → "Edit": open the full workflow editor for this agent. */
  onEditWorkflow?: () => void
  /** Optimize → Coaching row: open the workflow canvas with the coaching copilot docked. */
  onOpenCoaching?: (recommendationId: string) => void
}

export function AgentUnifiedNavScreen({ onBack, onEditWorkflow, onOpenCoaching }: AgentUnifiedNavScreenProps) {
  const [sectionId, setSectionId] = useState<SectionId>('build')
  const [itemBySection, setItemBySection] = useState<Record<SectionId, string>>({
    build: 'workflows',
    test: 'test-runs',
    deploy: 'channels',
    observe: 'logs',
    optimize: 'coaching',
  })
  const section = SECTIONS.find((s) => s.id === sectionId)!
  const itemId = itemBySection[sectionId]
  const fillsHeight = itemId === 'workflows' || itemId === 'test-runs'

  const content = (() => {
    switch (itemId) {
      case 'workflows':
        return (
          <WorkflowViewerTab
            instanceName={UNIFIED_NAV_AGENT}
            displayName={UNIFIED_NAV_AGENT}
            onEdit={() => onEditWorkflow?.()}
            product="healthcare"
          />
        )
      case 'test-runs':
        return (
          <GhostwriterTestRunPanel
            batches={DEFAULT_23SEP_TEST_BATCHES}
            testSuites={DEFAULT_23SEP_TEST_SUITES}
            centerContent={() => null}
            layout="fullpage"
            className="h-full"
          />
        )
      case 'test-suite':
        return (
          <RowList
            rows={DEFAULT_23SEP_TEST_SUITES.map((suite) => ({
              icon: 'checklist',
              title: suite.name,
              meta: `${suite.reviewCount ?? suite.conditions.length} reviews · ${
                suite.reviewsSource === 'upload' ? 'File uploaded' : suite.reviewsSource === 'generate' ? 'Generated by AI' : 'Conditional customer reviews'
              }`,
            }))}
            footnote="A suite is a saved set of reviews to run the agent against — the same one from the Test tab."
          />
        )
      case 'logs':
        return (
          <div className="px-2xl py-lg">
            <AgentLogsTab agentName={UNIFIED_NAV_AGENT} hideLogDuration />
          </div>
        )
      case 'analytics':
        return (
          <div className="flex flex-col gap-lg px-2xl py-lg">
            <MetricTiles metrics={REVIEW_METRICS} />
            <EmptyState
              title="Outcomes by location"
              description="The per-location table from the Outcomes tab lives here, with the same search and filters."
              className="py-3xl"
            />
          </div>
        )
      case 'recommendation':
        return (
          <RecommendationsTab
            agentName="__unified-nav-recommendations__"
            includeGenerated={false}
            onSelect={() => undefined}
            emptyTitle="No recommendations yet"
            emptyDescription="Myna reviews this agent’s logs and proposes changes here — the ones a person didn’t have to ask for."
          />
        )
      case 'coaching':
        return (
          <RecommendationsTab
            agentName={REVIEW_COACHING_AGENT}
            includeGenerated={false}
            extraItems={REVIEW_COACHING_SEEDS}
            onSelect={(id) => onOpenCoaching?.(id)}
            emptyDescription="Coaching appears here whenever someone on your team thumbs-down an agent reply in Reviews and says what was wrong."
          />
        )
      default: {
        const placeholder = PLACEHOLDERS[itemId]
        return placeholder ? (
          <RowList rows={placeholder.rows} footnote={placeholder.footnote} />
        ) : (
          <EmptyState title={section.items.find((i) => i.id === itemId)?.label ?? ''} className="py-3xl" />
        )
      }
    }
  })()

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      {/* Header — same chrome as every agent instance page */}
      <div className="flex shrink-0 items-center justify-between px-2xl py-xl">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <h1 className="text-h3 text-text-primary">{UNIFIED_NAV_AGENT}</h1>
          <Chip label="Active" variant="success" />
        </div>
        <button
          type="button"
          className="flex h-[34px] items-center gap-sm rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
        >
          Actions
          <Icon name="expand_more" size={20} className="text-text-icon" />
        </button>
      </div>

      {/* Top level — five sections, the same for every agent */}
      <div className="flex shrink-0 items-center gap-2xl px-2xl">
        {SECTION_GROUPS.map((group, g) => (
          <div key={g} className="flex items-center gap-sm">
            {group.map((s) => {
              const active = s.id === sectionId
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSectionId(s.id)}
                  className={`flex h-9 items-center rounded-full border px-lg text-body transition-colors ${
                    active
                      ? 'border-border-selected bg-surface-selected text-text-primary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* L1 — varies by section, not by agent */}
      <div className="mt-lg shrink-0 px-2xl">
        <Tabs
          tabs={section.items}
          activeTab={itemId}
          onChange={(id) => setItemBySection((prev) => ({ ...prev, [sectionId]: id }))}
        />
      </div>

      <div className={`min-h-0 flex-1 ${fillsHeight ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>{content}</div>
    </div>
  )
}
