import { useState } from 'react'
import {
  LEARNING_CALLOUT,
  LEARNING_GUIDELINES,
  LEARNING_HEADER_LABEL,
  LEARNING_STEPS,
  LEARNING_SUMMARY,
  READING_CALLOUT,
  READING_HEADER_LABEL,
  READING_STEPS,
  READING_SUMMARY,
  READING_TABLE_COLUMNS,
  READING_TABLE_ROWS,
  READING_TIMING,
  SOURCES_CONNECTED,
  SOURCES_HEADER_LABEL,
  SOURCES_SKIPPED,
  SOURCES_SKIPPED_INTRO,
  SOURCES_STEPS,
  SOURCES_SUMMARY,
  SPAM_DIGEST_CTA,
  SPAM_DIGEST_PLACEHOLDER,
  SPAM_SCREEN_ALERT,
  SPAM_SCREEN_FOOTNOTE,
  SPAM_SCREEN_HEADER_LABEL,
  SPAM_SCREEN_STEPS,
  PLAN_CARD,
  PLAN_CREATE_CTA,
} from '../../data/ghostwriterReadingBlock'
import {
  PLAYBOOK_HEADER_LABEL,
  PLAYBOOK_REQUIREMENTS,
  PLAYBOOK_STEPS,
  PLAYBOOK_SUMMARY,
  PLAYBOOK_TEMPLATE_DRAFTS,
  PLAYBOOK_TEMPLATE_STATUS_LABELS,
  PLAYBOOK_TEMPLATES,
  PLAYBOOK_VERDICT_LABELS,
  PlaybookTemplateStatus,
  PlaybookVerdict,
  TEMPLATE_DRAFT_CHIP,
  TEMPLATE_DRAFTS_CALLOUT,
  TEMPLATE_DRAFTS_FOOTNOTE,
  TEMPLATE_DRAFTS_HEADER_LABEL,
  TEMPLATE_DRAFTS_STEPS,
  TEMPLATE_DRAFTS_SUMMARY,
  TEMPLATES_CALLOUT,
  TEMPLATES_FOOTNOTE,
  TEMPLATES_HEADER_LABEL,
  TEMPLATES_STEPS,
  TEMPLATES_SUMMARY,
} from '../../data/ghostwriterPlaybookBlock'
import { REVIEW_SOURCE_LOGOS } from '../../data/reviewSourceLogos'
import { ActivityFindingsBlock } from './ActivityFindingsBlock'
import { VERDICT_TONE, VerdictTone } from './verdictTones'

const REQUIREMENT_VERDICT: Record<PlaybookVerdict, { icon: string; tone: VerdictTone }> = {
  clear: { icon: 'check_circle', tone: 'green' },
  detail: { icon: 'help', tone: 'amber' },
  conflict: { icon: 'error', tone: 'red' },
  blocked: { icon: 'block', tone: 'grey' },
  pushback: { icon: 'priority_high', tone: 'blue' },
}

const TEMPLATE_VERDICT: Record<PlaybookTemplateStatus, { icon: string; tone: VerdictTone }> = {
  exists: { icon: 'check_circle', tone: 'green' },
  renamed: { icon: 'change_circle', tone: 'blue' },
  missing: { icon: 'add_circle', tone: 'red' },
}

/** One divided row of a verdict list: glyph, title (+ inline suffix), note, and a chip. */
function VerdictRow({
  icon,
  tone,
  title,
  titleSuffix,
  note,
  chipLabel,
  divided,
  delayMs,
}: {
  icon: string
  tone: VerdictTone
  title: string
  /** Trails the title on the same line — the page ref in the requirements list. */
  titleSuffix?: string
  note?: string
  chipLabel: string
  divided: boolean
  delayMs: number
}) {
  const { color, chip } = VERDICT_TONE[tone]
  return (
    <div
      className={`gw-flow__in flex items-start gap-md px-lg py-md ${divided ? 'border-t border-border' : ''}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className="mt-[2px] flex size-5 shrink-0 items-center justify-center"
        style={{ color }}
        aria-hidden
      >
        <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{icon}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        {/* Inline so the suffix trails the last word instead of dropping below. */}
        <p className="m-0 text-body text-text-primary">
          {title}
          {titleSuffix && (
            <span className="ml-sm whitespace-nowrap text-small text-text-tertiary">{titleSuffix}</span>
          )}
        </p>
        {note && <p className="m-0 text-small text-text-tertiary">{note}</p>}
      </div>
      <span className={`shrink-0 whitespace-nowrap rounded-sm px-sm py-[3px] text-small ${chip}`}>
        {chipLabel}
      </span>
    </div>
  )
}

/** Every requirement the playbook states, each with the agent's verdict on it. */
function RequirementList() {
  return (
    <div className="gw-flow__in overflow-hidden rounded-sm border border-border">
      {PLAYBOOK_REQUIREMENTS.map((req, i) => (
        <VerdictRow
          key={req.id}
          {...REQUIREMENT_VERDICT[req.verdict]}
          title={req.text}
          titleSuffix={req.page}
          note={req.note}
          chipLabel={PLAYBOOK_VERDICT_LABELS[req.verdict]}
          divided={i > 0}
          delayMs={i * READING_TIMING.rowStagger}
        />
      ))}
    </div>
  )
}

/** The six templates the document names, against what the library actually holds. */
function TemplateStatusList() {
  return (
    <div className="gw-flow__in overflow-hidden rounded-sm border border-border">
      {PLAYBOOK_TEMPLATES.map((tpl, i) => (
        <VerdictRow
          key={tpl.id}
          {...TEMPLATE_VERDICT[tpl.status]}
          title={tpl.name}
          note={tpl.note}
          chipLabel={PLAYBOOK_TEMPLATE_STATUS_LABELS[tpl.status]}
          divided={i > 0}
          delayMs={i * READING_TIMING.rowStagger}
        />
      ))}
    </div>
  )
}

/** Brand logo in a soft tile, or the source's initial when we have no asset. */
function SourceLogo({ name, muted = false }: { name: string; muted?: boolean }) {
  const logo = REVIEW_SOURCE_LOGOS[name]
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-surface ${
        muted ? 'opacity-55 grayscale' : ''
      }`}
      aria-hidden
    >
      {logo ? (
        <img src={logo} alt="" className="size-[18px] object-contain" />
      ) : (
        <span className="text-small text-text-secondary">{name.charAt(0)}</span>
      )}
    </span>
  )
}

/** Small green tick in a tinted disc — the "connected" affirmation. */
function ConnectedTick() {
  return (
    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#dcfce7]" aria-hidden>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.3 4.7 8.5 9.5 3.5" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** Broken-link glyph for a source that can't take replies. */
function UnlinkedIcon() {
  return (
    <span className="flex size-[18px] shrink-0 items-center justify-center text-text-tertiary" aria-hidden>
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link_off</span>
    </span>
  )
}

/** Connected sources, then a muted panel for the ones that can't accept replies. */
function SourcesPanel({ onConfigure }: { onConfigure?: () => void }) {
  return (
    <div className="flex flex-col gap-sm">
      {SOURCES_CONNECTED.map((src, i) => (
        <div
          key={src.name}
          className="gw-flow__in gw-source-row flex items-center justify-between gap-md rounded-sm border border-border bg-surface px-lg py-md"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <span className="flex min-w-0 items-center gap-md">
            <SourceLogo name={src.name} />
            <span className="truncate text-body text-text-primary">{src.name}</span>
            <span className="shrink-0 text-small text-text-tertiary">{src.reviews}</span>
          </span>
          <span className="flex shrink-0 items-center gap-sm">
            <ConnectedTick />
            <span className="text-small text-[#15803d]">{src.note}</span>
          </span>
        </div>
      ))}

      <div className="gw-flow__in flex flex-col gap-sm rounded-sm bg-surface-l2 p-lg" style={{ animationDelay: '200ms' }}>
        <p className="m-0 text-small text-text-secondary">{SOURCES_SKIPPED_INTRO}</p>
        {SOURCES_SKIPPED.map((src) => (
          <div key={src.name} className="flex items-center justify-between gap-md">
            <span className="flex min-w-0 items-center gap-md">
              <UnlinkedIcon />
              <SourceLogo name={src.name} muted />
              <span className="truncate text-body text-text-secondary">{src.name}</span>
              <span className="shrink-0 text-small text-text-tertiary">{src.reviews}</span>
            </span>
            <span className="shrink-0 text-small text-text-tertiary">{src.note}</span>
          </div>
        ))}
        <button
          type="button"
          onClick={onConfigure}
          className="mt-xs flex h-9 w-fit items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
        >
          Configure sources
        </button>
      </div>
    </div>
  )
}

/** Template-usage table — the only bordered box in the first beat. */
function TemplateTable() {
  return (
    <div className="gw-flow__in overflow-hidden rounded-sm border border-border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-l2">
            {READING_TABLE_COLUMNS.map((col) => (
              <th key={col} className="px-lg py-md text-small text-text-secondary">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {READING_TABLE_ROWS.map((row, i) => (
            <tr
              key={row.template}
              className="gw-flow__in border-t border-border"
              style={{ animationDelay: `${i * READING_TIMING.rowStagger}ms` }}
            >
              <td className="px-lg py-md text-body text-text-primary">{row.template}</td>
              <td className="px-lg py-md text-body text-text-secondary">{row.usedOn}</td>
              <td className="px-lg py-md text-body text-text-secondary">{row.share}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Numbered guidelines with support counts — the bordered box in the second beat. */
function GuidelineList() {
  return (
    <div className="gw-flow__in rounded-sm border border-border p-lg">
      <ol className="m-0 flex list-none flex-col gap-md p-0">
        {LEARNING_GUIDELINES.map((item, i) => (
          <li
            key={item.text}
            className="gw-flow__in flex items-start gap-md"
            style={{ animationDelay: `${i * READING_TIMING.rowStagger}ms` }}
          >
            <span className="mt-[2px] flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-l2 text-small text-text-secondary">
              {i + 1}
            </span>
            {/* Inline so the count chip trails the last word rather than dropping below. */}
            <p className="m-0 min-w-0 text-body text-text-primary">
              {item.text}{' '}
              <span className="ml-xs whitespace-nowrap rounded-sm bg-surface-l2 px-sm py-[2px] text-small text-text-secondary">
                {item.meta}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export interface GhostwriterReadingBlockProps {
  onComplete?: () => void
}

/**
 * Beat 0 — only when the conversation opened with an attached playbook. Reads the document
 * and plays every requirement back with a verdict. Ends on its body, no callout.
 */
export function GhostwriterPlaybookBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={PLAYBOOK_HEADER_LABEL}
      steps={PLAYBOOK_STEPS}
      summary={PLAYBOOK_SUMMARY}
      body={<RequirementList />}
      calloutExtraMs={PLAYBOOK_REQUIREMENTS.length * READING_TIMING.rowStagger}
      onComplete={onComplete}
    />
  )
}

/** One drafted template: name + Draft chip, the trigger it fires on, then the copy. */
function TemplateDraftCards() {
  return (
    <div className="flex flex-col gap-md">
      {PLAYBOOK_TEMPLATE_DRAFTS.map((draft, i) => (
        <div
          key={draft.id}
          className="gw-flow__in flex flex-col gap-sm rounded-sm border border-border p-lg"
          style={{ animationDelay: `${i * READING_TIMING.rowStagger}ms` }}
        >
          <div className="flex flex-wrap items-center gap-sm">
            <span className="flex size-5 shrink-0 items-center justify-center text-[#7c3aed]" aria-hidden>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>description</span>
            </span>
            <span className="text-body text-text-primary">{draft.name}</span>
            <span className="rounded-sm bg-surface-l2 px-sm py-[2px] text-small text-text-secondary">
              {TEMPLATE_DRAFT_CHIP}
            </span>
          </div>
          <p className="m-0 text-small text-text-tertiary">{draft.trigger}</p>
          <p className="m-0 rounded-sm bg-surface-l2 px-lg py-md text-body text-text-secondary">
            {draft.body}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Playbook beat 3 — the four drafts, shown only when the user asks for all of them. Ends on
 * a green callout confirming they're saved, then points at the still-open questions.
 */
export function GhostwriterTemplateDraftsBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={TEMPLATE_DRAFTS_HEADER_LABEL}
      steps={TEMPLATE_DRAFTS_STEPS}
      summary={TEMPLATE_DRAFTS_SUMMARY}
      body={<TemplateDraftCards />}
      callout={TEMPLATE_DRAFTS_CALLOUT}
      calloutTone="green"
      footnote={TEMPLATE_DRAFTS_FOOTNOTE}
      calloutExtraMs={PLAYBOOK_TEMPLATE_DRAFTS.length * READING_TIMING.rowStagger}
      onComplete={onComplete}
    />
  )
}

/**
 * Playbook beat 2 — whether the six templates the document leans on actually exist. Ends on
 * an amber callout plus the footnote about Spanish coverage.
 */
export function GhostwriterPlaybookTemplatesBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={TEMPLATES_HEADER_LABEL}
      steps={TEMPLATES_STEPS}
      summary={TEMPLATES_SUMMARY}
      body={<TemplateStatusList />}
      callout={TEMPLATES_CALLOUT}
      calloutTone="amber"
      footnote={TEMPLATES_FOOTNOTE}
      calloutExtraMs={PLAYBOOK_TEMPLATES.length * READING_TIMING.rowStagger}
      onComplete={onComplete}
    />
  )
}

/** Beat 1 — what the templates are doing today. */
export function GhostwriterReadingBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={READING_HEADER_LABEL}
      steps={READING_STEPS}
      summary={READING_SUMMARY}
      body={<TemplateTable />}
      callout={READING_CALLOUT}
      calloutTone="amber"
      calloutExtraMs={READING_TABLE_ROWS.length * READING_TIMING.rowStagger}
      onComplete={onComplete}
    />
  )
}

/** Beat 3 — which sources can actually be replied to. Ends on its body, no callout. */
export function GhostwriterSourcesBlock({
  onComplete,
  onConfigure,
}: GhostwriterReadingBlockProps & { onConfigure?: () => void }) {
  return (
    <ActivityFindingsBlock
      label={SOURCES_HEADER_LABEL}
      steps={SOURCES_STEPS}
      summary={SOURCES_SUMMARY}
      body={<SourcesPanel onConfigure={onConfigure} />}
      calloutExtraMs={300}
      onComplete={onComplete}
    />
  )
}

/** Beat 4 — the spam gate. Opens on the risk, then explains the resolution. */
export function GhostwriterSpamScreenBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={SPAM_SCREEN_HEADER_LABEL}
      steps={SPAM_SCREEN_STEPS}
      callout={SPAM_SCREEN_ALERT}
      calloutTone="red"
      footnote={SPAM_SCREEN_FOOTNOTE}
      onComplete={onComplete}
    />
  )
}

/**
 * "Where should the daily spam digest go?" — email field + CTA, disabled until something is
 * typed. Submitting hands the address back so the parent can echo it as a user turn.
 */
export function GhostwriterDigestPrompt({ onSubmit }: { onSubmit?: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const canSubmit = email.trim().length > 0

  return (
    <div className="gw-flow__in ml-3xl mt-sm flex flex-wrap items-center gap-sm">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) onSubmit?.(email.trim())
        }}
        placeholder={SPAM_DIGEST_PLACEHOLDER}
        className="h-10 w-[280px] rounded-sm border border-border bg-surface px-lg text-body text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary"
      />
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit?.(email.trim())}
        className={`flex h-10 items-center rounded-sm px-lg text-body transition-colors ${
          canSubmit
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
        }`}
      >
        {SPAM_DIGEST_CTA}
      </button>
    </div>
  )
}

/**
 * Beat 5 — the drafted plan, then the single action that follows it.
 *
 * "Open plan" is a secondary CTA inside the card; "Create agent" is the only primary action
 * below it (no "Open in agent builder" / "Review the plan first").
 */
export function GhostwriterPlanCard({
  onOpenPlan,
  onCreateAgent,
  planOpen = false,
  agentCreated = false,
  copy,
}: {
  onOpenPlan?: () => void
  onCreateAgent?: () => void
  /** Swaps the CTA for a "Plan open" state while the panel is showing. */
  planOpen?: boolean
  /** Retires the Create agent CTA once it has been used — the agent already exists. */
  agentCreated?: boolean
  /**
   * Per-flow overrides for the two lines that describe where the plan came from — the
   * playbook path cites pages and rules rather than reviews and replies.
   */
  copy?: { meta?: string; description?: string }
}) {
  return (
    <div className="ml-3xl mt-sm flex max-w-full flex-col gap-md">
      <div className="gw-flow__in flex flex-col gap-sm rounded-sm border border-border bg-surface p-lg">
        <div className="flex flex-wrap items-center gap-sm">
          <span className="flex size-5 shrink-0 items-center justify-center text-[#7c3aed]" aria-hidden>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>description</span>
          </span>
          <span className="text-h3 text-text-primary">{PLAN_CARD.title}</span>
          <span className="rounded-sm bg-[#e8f1fc] px-sm py-[2px] text-small text-text-action">
            {PLAN_CARD.badge}
          </span>
        </div>

        <p className="m-0 text-small text-text-tertiary">{copy?.meta ?? PLAN_CARD.meta}</p>
        <p className="m-0 text-body text-text-secondary">{copy?.description ?? PLAN_CARD.description}</p>

        {/* Secondary — the plan is a detour, not the main action. */}
        <button
          type="button"
          onClick={onOpenPlan}
          className={`mt-xs flex h-9 w-fit items-center gap-sm rounded-sm px-lg text-body transition-colors ${
            planOpen
              ? 'bg-surface-selected text-text-primary'
              : 'border border-border-selected bg-surface text-text-primary hover:bg-surface-l2'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>
            {planOpen ? 'check' : 'open_in_new'}
          </span>
          {planOpen ? 'Plan open' : PLAN_CARD.openLabel}
        </button>
      </div>

      {!agentCreated && (
        <button
          type="button"
          onClick={onCreateAgent}
          className="gw-flow__in flex h-9 w-fit items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          {PLAN_CREATE_CTA}
        </button>
      )}
    </div>
  )
}

/** Beat 2 — the method behind the hand-written replies. */
export function GhostwriterGuidelinesBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={LEARNING_HEADER_LABEL}
      steps={LEARNING_STEPS}
      summary={LEARNING_SUMMARY}
      body={<GuidelineList />}
      callout={LEARNING_CALLOUT}
      calloutTone="green"
      calloutExtraMs={LEARNING_GUIDELINES.length * READING_TIMING.rowStagger}
      onComplete={onComplete}
    />
  )
}
