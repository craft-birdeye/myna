import {
  LEARNING_FOOTNOTE,
  LEARNING_HEADER_LABEL,
  LEARNING_STEPS,
  LEARNING_SUMMARY,
  READING_FOOTNOTE,
  READING_HEADER_LABEL,
  READING_STEPS,
  READING_SUMMARY,
  READING_TIMING,
  SOURCES_CONFIGURE_CTA,
  SOURCES_HEADER_LABEL,
  SIM_FIX_FOOTNOTE,
  SIM_FIX_HEADER_LABEL,
  SIM_FIX_STEPS,
  SIM_FIX_SUMMARY,
  SIM_RUN_FOOTNOTE,
  SIM_RUN_HEADER_LABEL,
  SIM_RUN_STEPS,
  SIM_RUN_SUMMARY,
  SOURCES_STEPS,
  SOURCES_SUMMARY,
  SPAM_DIGEST_CTA,
  SPAM_DIGEST_QUESTION,
  SPAM_DIGEST_PLACEHOLDER,
  SPAM_SCREEN_FOOTNOTE,
  SPAM_SCREEN_HEADER_LABEL,
  SPAM_SCREEN_STEPS,
  SPAM_SCREEN_SUMMARY,
  PLAN_CARD,
  PLAN_CREATE_CTA,
} from '../../data/ghostwriterReadingBlock'
import {
  PLAYBOOK_HEADER_LABEL,
  PLAYBOOK_STEPS,
  PLAYBOOK_SUMMARY,
  PLAYBOOK_TEMPLATE_DRAFTS,
  TEMPLATE_DRAFTS_FOOTNOTE,
  TEMPLATE_DRAFTS_HEADER_LABEL,
  TEMPLATE_DRAFTS_STEPS,
  TEMPLATE_DRAFTS_SUMMARY,
  TEMPLATES_FOOTNOTE,
  TEMPLATES_HEADER_LABEL,
  TEMPLATES_STEPS,
  TEMPLATES_SUMMARY,
} from '../../data/ghostwriterPlaybookBlock'
import { GhostwriterQuestionCard } from '../GhostwriterQuestionCard/GhostwriterQuestionCard'
import { ActivityFindingsBlock } from './ActivityFindingsBlock'
import { VERDICT_TONE, VerdictTone } from './verdictTones'

/** The one action this beat offers — a text link, not a panel. */
function ConfigureSourcesLink({ onConfigure }: { onConfigure?: () => void }) {
  return (
    <button
      type="button"
      onClick={onConfigure}
      className="gw-flow__in w-fit text-body text-text-action transition-colors hover:underline"
    >
      {SOURCES_CONFIGURE_CTA}
    </button>
  )
}

export interface GhostwriterReadingBlockProps {
  onComplete?: () => void
}

/**
 * Beat 0 — only when the conversation opened with an attached playbook. Confirms the rules
 * it can build in one sentence and hands straight to the templates; the per-rule verdict
 * list this used to render was removed.
 */
export function GhostwriterPlaybookBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={PLAYBOOK_HEADER_LABEL}
      steps={PLAYBOOK_STEPS}
      summary={PLAYBOOK_SUMMARY}
      onComplete={onComplete}
    />
  )
}

/** One drafted template: name + Draft chip, the trigger it fires on, then the copy. */
/**
 * The four drafts. This copy *is* the deliverable — the user has to read it — so unlike the
 * audit lists it can't collapse into prose. The card, the purple glyph, the Draft chip and
 * the filled body panel all go; a single hairline rule marks the quoted copy instead.
 */
function TemplateDraftCards() {
  return (
    <div className="flex flex-col gap-xl">
      {PLAYBOOK_TEMPLATE_DRAFTS.map((draft, i) => (
        <div
          key={draft.id}
          className="gw-flow__in flex flex-col gap-xs"
          style={{ animationDelay: `${i * READING_TIMING.rowStagger}ms` }}
        >
          <p className="m-0 text-body text-text-primary">
            {draft.name}
            <span className="ml-sm text-small text-text-tertiary">{draft.trigger}</span>
          </p>
          <p className="m-0 border-l-2 border-border-strong pl-md text-body text-text-secondary">
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
      footnote={TEMPLATES_FOOTNOTE}
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
      footnote={READING_FOOTNOTE}
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
      body={<ConfigureSourcesLink onConfigure={onConfigure} />}
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
      summary={SPAM_SCREEN_SUMMARY}
      footnote={SPAM_SCREEN_FOOTNOTE}
      onComplete={onComplete}
    />
  )
}

/**
 * Beat 5 — the agent tests the draft before showing the plan. Scenarios come from the
 * plan's own rules, so a failure names the rule it broke. Text only, no panel.
 */
export function GhostwriterSimulationRunBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={SIM_RUN_HEADER_LABEL}
      steps={SIM_RUN_STEPS}
      summary={SIM_RUN_SUMMARY}
      footnote={SIM_RUN_FOOTNOTE}
      onComplete={onComplete}
    />
  )
}

/** Beat 6 — both failures fixed, the same suite re-run, then it hands off to the plan. */
export function GhostwriterSimulationFixBlock({ onComplete }: GhostwriterReadingBlockProps) {
  return (
    <ActivityFindingsBlock
      label={SIM_FIX_HEADER_LABEL}
      steps={SIM_FIX_STEPS}
      summary={SIM_FIX_SUMMARY}
      footnote={SIM_FIX_FOOTNOTE}
      onComplete={onComplete}
    />
  )
}

/**
 * "Where should the daily spam digest go?" — the free-text flavour of the shared question
 * card. Submitting hands the address back so the parent can echo it as a user turn.
 */
export function GhostwriterDigestPrompt({
  onSubmit,
  className,
  dividers,
}: {
  onSubmit?: (email: string) => void
  className?: string
  dividers?: boolean
}) {
  return (
    <GhostwriterQuestionCard
      question={SPAM_DIGEST_QUESTION}
      freeText={{ placeholder: SPAM_DIGEST_PLACEHOLDER, submitLabel: SPAM_DIGEST_CTA }}
      onSubmitText={(email) => onSubmit?.(email)}
      className={className}
      dividers={dividers}
    />
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
      footnote={LEARNING_FOOTNOTE}
      onComplete={onComplete}
    />
  )
}
