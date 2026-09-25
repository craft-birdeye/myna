/**
 * Jay & Robin's create flow — "build me an agent" → analysis → four questions → a brief plan →
 * the plan executed step by step → the canvas changes offered for review → done. The story
 * itself lives in `data/jayRobinCreateFlow.ts`.
 *
 * Shape of the thread, top to bottom:
 *   user prompt (hover: time · copy · rewind)
 *   one intro line
 *   "Working…" → "Worked for 18s" accordion (narration + "Ran N tools" groups; stays open)
 *   lead-in line, then four question cards, one at a time, each echoed as a user turn
 *   lead-in line, then the plan card (five pointers · Create agent)
 *   "Working…" → "Worked for 12s" accordion (one check-row per pointer, actions on a rail)
 *   "N nodes updated · Undo" docked above the composer
 *   closing line
 *
 * Rewind on any user turn truncates the thread back to that point (the question is asked
 * again). Rewind on messages from before the agent existed is retired once it does.
 * A follow-up sent after that still rewinds, until its changes are applied.
 *
 * Two more stories ride on the same beats (scripts in `data/jayRobinCreateFlow.ts`):
 *   - a requirements doc attached with the prompt switches the analysis, questions and step 4
 *     to the **file variant** (the build creates the two templates the doc names);
 *   - once the agent exists, anything typed into the composer is a **follow-up**: user turn →
 *     Working → one line → a simple proposal card (Apply / Not now) → Working → a reply whose
 *     node names are chips that open the node (and its tool) on the canvas.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTypewriter } from '../../hooks/useTypewriter'
import {
  JR_ANALYSIS_PHASES,
  JR_BUILD_SUMMARY,
  JR_FILE_ANALYSIS_PHASES,
  JR_FILE_INTRO_LINE,
  JR_FILE_PLAN_META,
  JR_FILE_QUESTIONS,
  JR_FILE_QUESTIONS_LEAD_IN,
  JR_FOLLOW_UP_UNDONE_LINE,
  JR_INTRO_LINE,
  JR_PLAN_CARD,
  JR_PLAN_LEAD_IN,
  JR_QUESTIONS,
  JR_QUESTIONS_LEAD_IN,
  JR_UNDONE_LINE,
  buildJrAcceptedLine,
  buildJrBuildPhases,
  buildJrNodeUpdates,
  buildJrPlan,
  jrTemplatesAccepted,
  matchJrFollowUp,
} from '../../data/jayRobinCreateFlow'
import type { JrFlowVariant, JrFollowUpScript, JrPlanStep, JrRichSegment } from '../../data/jayRobinCreateFlow'
import { AgentWorkSequence } from '../AgentActivityHeader/AgentWorkSequence'
import { GhostwriterQuestionCard } from '../GhostwriterQuestionCard/GhostwriterQuestionCard'
import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import { SparkleLoader } from '../SparkleLoader/SparkleLoader'
import { Tooltip } from '../Tooltip/Tooltip'
import { NodesUpdatedCard } from './NodesUpdatedCard'
import type { JayRobinCreateFlowProps, JayRobinFlowAttachment } from './JayRobinCreateFlow.types'

/** Question cards dock flush above the composer, the same way the other create flows do. */
/** The nodes card keeps a full stroke and rounded bottom, matching its top edge. */
const NODES_CARD_CLASS = 'sticky bottom-xs z-10 !ml-0 !mt-md shadow-card'

const ACTION_BTN =
  'flex size-6 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary'

function timeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Copy · good · bad under an agent reply — hidden until the turn is hovered. */
function ReplyActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const copy = () => {
    void navigator.clipboard?.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="clear-left ml-3xl mt-xs flex h-6 items-center gap-xs opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <Tooltip content={copied ? 'Copied' : 'Copy'} variant="brief" side="top">
        <button type="button" aria-label={copied ? 'Copied' : 'Copy'} onClick={copy} className={ACTION_BTN}>
          <Icon name={copied ? 'check' : 'content_copy'} size={15} />
        </button>
      </Tooltip>
      <Tooltip content="Good response" variant="brief" side="top">
        <button
          type="button"
          aria-label="Good response"
          aria-pressed={vote === 'up'}
          onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}
          className={`${ACTION_BTN} ${vote === 'up' ? 'bg-surface-hover text-text-secondary' : ''}`}
        >
          <Icon name="thumb_up" size={15} fill={vote === 'up'} />
        </button>
      </Tooltip>
      <Tooltip content="Bad response" variant="brief" side="top">
        <button
          type="button"
          aria-label="Bad response"
          aria-pressed={vote === 'down'}
          onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}
          className={`${ACTION_BTN} ${vote === 'down' ? 'bg-surface-hover text-text-secondary' : ''}`}
        >
          <Icon name="thumb_down" size={15} fill={vote === 'down'} />
        </button>
      </Tooltip>
    </div>
  )
}

/** One typed line from the copilot — sparkle avatar spins while it types, rests when done. */
function AgentLine({
  text,
  onDone,
  tight = false,
  actions = false,
}: {
  text: string
  onDone?: () => void
  /** 16px instead of 32px right after an accordion — it already reads as a break. */
  tight?: boolean
  /** Show copy/good/bad on hover once typed — for replies worth reacting to, not lead-ins. */
  actions?: boolean
}) {
  const { typed, done } = useTypewriter(text, { charsPerTick: 10, intervalMs: 10, onDone })
  return (
    <div className={`group agent-build-fade flex flex-col ${tight ? 'mt-lg' : 'mt-3xl'}`}>
      <div className="flex gap-sm">
        <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
          <SparkleLoader size={14} spinning={!done} />
        </span>
        <p className="m-0 min-w-0 flex-1 text-body leading-6 text-text-primary">{typed}</p>
      </div>
      {actions && done && <ReplyActions text={text} />}
    </div>
  )
}

/**
 * A typed copilot line with node names in it. The whole sentence types out as one string;
 * segments the typing has passed render as chips — `Create ticket` — that open the node's
 * panel (and its tool) on the canvas. The name of the thing built is the way to reach it.
 */
function AgentRichLine({
  segments,
  onOpenNode,
  onDone,
  tight = false,
  actions = false,
}: {
  segments: JrRichSegment[]
  onOpenNode?: (nodeId: string, tool?: string) => void
  onDone?: () => void
  tight?: boolean
  actions?: boolean
}) {
  const full = segments.map((seg) => (typeof seg === 'string' ? seg : seg.label)).join('')
  const { typed, done } = useTypewriter(full, { charsPerTick: 10, intervalMs: 10, onDone })
  let cursor = 0
  const rendered = segments.map((seg, i) => {
    const label = typeof seg === 'string' ? seg : seg.label
    const start = cursor
    cursor += label.length
    const visible = typed.slice(start, Math.min(cursor, typed.length))
    if (!visible) return null
    if (typeof seg === 'string') return <span key={i}>{visible}</span>
    const complete = typed.length >= cursor
    if (!complete || !onOpenNode) return <span key={i}>{visible}</span>
    return (
      <button
        key={i}
        type="button"
        onClick={() => onOpenNode(seg.nodeId, seg.tool)}
        className="mx-px inline-flex h-6 items-center gap-2xs rounded-sm border border-border bg-surface px-xs align-baseline text-body text-text-action transition-colors hover:bg-surface-hover"
      >
        {seg.label}
        <Icon name="chevron_right" size={14} className="text-text-icon" />
      </button>
    )
  })
  return (
    <div className={`group agent-build-fade flex flex-col ${tight ? 'mt-lg' : 'mt-3xl'}`}>
      <div className="flex gap-sm">
        <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
          <SparkleLoader size={14} spinning={!done} />
        </span>
        <p className="m-0 min-w-0 flex-1 text-body leading-6 text-text-primary">{rendered}</p>
      </div>
      {actions && done && <ReplyActions text={full} />}
    </div>
  )
}

/**
 * A user turn — the bubble, plus an action row that appears on hover: when it was sent, copy,
 * and rewind. Rewind is the one that matters for a demo: it takes the thread back to this
 * message so the question can be answered differently.
 */
function UserTurn({
  text,
  question,
  attachments = [],
  at,
  onRewind,
  first = false,
}: {
  text: string
  /** Kept above the answer once a card's options disappear, so the history still shows what
   *  was asked. */
  question?: string
  /** Files attached with the message — chips above the text, so the doc the build reads from
   *  stays visible in the thread. */
  attachments?: JayRobinFlowAttachment[]
  at: Date
  onRewind?: () => void
  first?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`group flex flex-col items-end ${first ? 'pt-md' : 'mt-[36px]'}`}>
      <div className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm leading-[1.5] text-text-primary">
        {question && <p className="m-0 text-small text-text-tertiary">{question}</p>}
        {attachments.length > 0 && (
          <span className="mb-sm flex flex-wrap justify-end gap-sm">
            {attachments.map((item) => (
              <RefChip key={item.id} kind={item.kind} label={item.label} />
            ))}
          </span>
        )}
        <p className={`m-0 text-body text-text-primary ${question ? 'mt-2xs' : ''}`}>{text}</p>
      </div>
      <div className="mt-xs flex h-6 items-center gap-xs opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <span className="px-xs text-small text-text-tertiary">{timeLabel(at)}</span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <Tooltip content={copied ? 'Copied' : 'Copy'} variant="brief" side="top">
          <button type="button" aria-label={copied ? 'Copied' : 'Copy'} onClick={copy} className={ACTION_BTN}>
            <Icon name={copied ? 'check' : 'content_copy'} size={15} />
          </button>
        </Tooltip>
        {onRewind && (
          <Tooltip content="Rewind to this message" variant="brief" side="top">
            <button type="button" aria-label="Rewind to this message" onClick={onRewind} className={ACTION_BTN}>
              <Icon name="undo" size={15} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

/**
 * Every answered question so far, in one left-aligned card — question in grey, answer in
 * black, stacked — instead of a right-aligned bubble per answer. A card is the summary of a
 * short intake, not a conversation; the bubbles made three answers look like six turns.
 * Hovering a row shows copy + rewind for that answer.
 */
function AnswersSummaryCard({
  answers,
  onRewind,
}: {
  answers: Answer[]
  /** Rewind to just before answer `k`; omitted once the agent exists. */
  onRewind?: (k: number) => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copy = (a: Answer) => {
    void navigator.clipboard?.writeText(a.text)
    setCopiedId(a.id)
    window.setTimeout(() => setCopiedId(null), 1500)
  }
  return (
    <div className="agent-build-fade ml-3xl mt-lg flex max-w-full flex-col gap-md rounded-sm border border-border bg-surface px-lg py-md">
      {answers.map((a, k) => (
        <div key={a.id} className="group gw-flow__in flex items-start gap-sm">
          <div className="flex min-w-0 flex-1 flex-col gap-2xs">
            <p className="m-0 text-small text-text-tertiary">{a.question}</p>
            <p className="m-0 text-body text-text-primary">{a.text}</p>
          </div>
          <div className="flex shrink-0 items-center gap-xs opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Tooltip content={copiedId === a.id ? 'Copied' : 'Copy'} variant="brief" side="top">
              <button
                type="button"
                aria-label={copiedId === a.id ? 'Copied' : 'Copy'}
                onClick={() => copy(a)}
                className={ACTION_BTN}
              >
                <Icon name={copiedId === a.id ? 'check' : 'content_copy'} size={15} />
              </button>
            </Tooltip>
            {onRewind && (
              <Tooltip content="Rewind to this message" variant="brief" side="top">
                <button
                  type="button"
                  aria-label="Rewind to this message"
                  onClick={() => onRewind(k)}
                  className={ACTION_BTN}
                >
                  <Icon name="undo" size={15} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * The plan — five pointers (title + one line of what it does, no markers), a title row that
 * folds the list away, and "Create agent" (primary).
 */
function PlanCard({
  steps,
  meta = JR_PLAN_CARD.meta,
  onCreateAgent,
  agentCreated = false,
}: {
  steps: JrPlanStep[]
  meta?: string
  onOpenDetails?: () => void
  detailsOpen?: boolean
  onCreateAgent?: () => void
  agentCreated?: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="ml-3xl mt-sm flex max-w-full flex-col">
      <div className="gw-flow__in flex flex-col rounded-sm border border-border bg-surface">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center justify-between gap-md px-lg py-md text-left"
        >
          <span className="flex min-w-0 flex-col gap-2xs">
            <span className="text-base text-text-primary">{JR_PLAN_CARD.title}</span>
            <span className="text-small text-text-tertiary">{meta}</span>
          </span>
          <Icon
            name="expand_more"
            size={20}
            className={`shrink-0 text-text-icon transition-transform ${open ? '' : '-rotate-90'}`}
          />
        </button>

        {open && (
          <ol className="m-0 flex list-none flex-col gap-lg px-lg pb-md pt-xs">
            {steps.map((step) => (
              <li key={step.title} className="flex items-start">
                <span className="flex min-w-0 flex-1 flex-col gap-2xs">
                  <span className="text-body text-text-primary">{step.title}</span>
                  <span className="text-small text-text-secondary">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="flex items-center justify-end gap-sm px-lg py-md">
          {!agentCreated && (
            <button
              type="button"
              onClick={onCreateAgent}
              className="flex h-9 w-fit items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              {JR_PLAN_CARD.createLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The follow-up proposal — deliberately smaller than the plan card: a title, two or three
 * lines of what changes, Apply / Not now. Nothing on the canvas moves until Apply.
 */
function ProposalCard({
  script,
  onApply,
  onDecline,
}: {
  script: JrFollowUpScript
  onApply: () => void
  onDecline: () => void
}) {
  const { proposal } = script
  return (
    <div className="gw-flow__in mb-xs ml-3xl mt-sm flex max-w-full flex-col rounded-sm border border-border bg-surface">
      <div className="flex flex-col gap-sm px-lg py-md">
        <span className="text-base text-text-primary">{proposal.title}</span>
        <ul className="m-0 flex list-none flex-col gap-xs">
          {proposal.lines.map((line) => (
            <li key={line} className="flex items-start gap-sm text-body text-text-secondary">
              <span aria-hidden className="mt-[10px] size-1 shrink-0 rounded-full bg-text-tertiary" />
              <span className="min-w-0 flex-1">{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-end gap-sm px-lg py-md">
        <button
          type="button"
          onClick={onDecline}
          className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
        >
          {proposal.declineLabel}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex h-9 w-fit items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          {proposal.applyLabel}
        </button>
      </div>
    </div>
  )
}

interface Answer {
  id: string
  question: string
  text: string
  at: Date
}

type FollowUpStage = 'analysing' | 'lead-in' | 'proposed' | 'applying' | 'applied' | 'declined'

interface FollowUp {
  id: number
  text: string
  at: Date
  script: JrFollowUpScript
  stage: FollowUpStage
  /** The nodes card after Apply, until Undo. */
  nodesDecision: 'pending' | 'undone'
}

/** One follow-up request, start to finish. Owns its own stage so several can stack. */
function FollowUpThread({
  item,
  onStage,
  onOpenNode,
  onRewind,
  onUndoNodes,
  showNodesCard = true,
}: {
  item: FollowUp
  onStage: (stage: FollowUpStage) => void
  onOpenNode?: (nodeId: string, tool?: string) => void
  /** Drops this follow-up. Hidden once Apply has started — the change is landing. */
  onRewind?: () => void
  /** Undo on the nodes card after Apply — the parent drops the canvas extra. */
  onUndoNodes?: () => void
  /** A later message exists, so this change's nodes card is no longer the latest. */
  showNodesCard?: boolean
}) {
  const { script, stage } = item
  const past = (s: FollowUpStage) => {
    const order: FollowUpStage[] = ['analysing', 'lead-in', 'proposed', 'applying', 'applied']
    return stage === 'declined' ? order.indexOf(s) <= order.indexOf('proposed') : order.indexOf(stage) >= order.indexOf(s)
  }
  return (
    <>
      <UserTurn
        text={item.text}
        at={item.at}
        onRewind={stage === 'applying' || stage === 'applied' ? undefined : onRewind}
      />
      <AgentWorkSequence phases={script.analysisPhases} onComplete={() => stage === 'analysing' && onStage('lead-in')} />
      {past('lead-in') && (
        <AgentLine tight text={script.leadIn} onDone={() => stage === 'lead-in' && onStage('proposed')} />
      )}
      {stage === 'proposed' && (
        <ProposalCard script={script} onApply={() => onStage('applying')} onDecline={() => onStage('declined')} />
      )}
      {stage === 'declined' && (
        <>
          <UserTurn text={script.declineEcho} at={item.at} />
          <AgentLine actions text={script.declineLine} />
        </>
      )}
      {past('applying') && (
        <>
          <UserTurn text={script.acceptEcho} at={item.at} />
          <AgentWorkSequence
            phases={script.applyPhases}
            summary={script.applySummary}
            onComplete={() => stage === 'applying' && onStage('applied')}
          />
        </>
      )}
      {stage === 'applied' && <AgentRichLine tight actions segments={script.result} onOpenNode={onOpenNode} />}
      {stage === 'applied' && showNodesCard && item.nodesDecision === 'pending' && script.nodes.length > 0 && (
        <>
          <div className="flex-1" aria-hidden />
          <NodesUpdatedCard
            nodes={script.nodes}
            onAccept={() => {}}
            onUndo={() => onUndoNodes?.()}
            onOpenNode={onOpenNode}
            className={NODES_CARD_CLASS}
          />
        </>
      )}
      {stage === 'applied' && item.nodesDecision === 'undone' && (
        <AgentLine tight actions text={JR_FOLLOW_UP_UNDONE_LINE} />
      )}
    </>
  )
}

export function JayRobinCreateFlow({
  prompt,
  onBuildStart,
  onBuildProgress,
  onCreateAgent,
  onOpenPlan,
  planOpen = false,
  agentCreated = false,
  onAnswerCardOpenChange,
  onNodesCardDockedChange,
  onSuppressComposerChange,
  onBusyChange,
  pendingAnswer,
  onPendingAnswerConsumed,
  onOpenNode,
  onRewindToStart,
  onRewindFollowUp,
  attachments = [],
  onWorkflowExtra,
  onRemoveWorkflowExtra,
}: JayRobinCreateFlowProps) {
  const [promptAt] = useState(() => new Date())
  /** A file attached with the prompt makes this the requirements-doc story. */
  const variant: JrFlowVariant = attachments.some((a) => a.kind === 'file') ? 'file' : 'prompt'
  const introLine = variant === 'file' ? JR_FILE_INTRO_LINE : JR_INTRO_LINE
  const analysisPhases = variant === 'file' ? JR_FILE_ANALYSIS_PHASES : JR_ANALYSIS_PHASES
  const questions = variant === 'file' ? JR_FILE_QUESTIONS : JR_QUESTIONS
  const questionsLeadIn = variant === 'file' ? JR_FILE_QUESTIONS_LEAD_IN : JR_QUESTIONS_LEAD_IN
  const [introDone, setIntroDone] = useState(false)
  const [analysisDone, setAnalysisDone] = useState(false)
  const [questionsLeadInDone, setQuestionsLeadInDone] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [planLeadInDone, setPlanLeadInDone] = useState(false)
  const [buildDone, setBuildDone] = useState(false)
  /** "Create agent" pressed *in this thread*. The parent's `agentCreated` can already be true
   *  from an earlier run in the same session (rewind, new chat), so it can't gate the build
   *  pass on its own — otherwise the build accordion mounts alongside the analysis one. */
  const [createPressed, setCreatePressed] = useState(false)
  const [createPressedAt, setCreatePressedAt] = useState<Date | null>(null)
  /** The "N nodes updated" review: pending until Accept or Undo is pressed. */
  const [nodesDecision, setNodesDecision] = useState<'pending' | 'accepted' | 'undone'>('pending')

  /** Requests typed after the agent exists — each its own mini story. */
  const [followUps, setFollowUps] = useState<FollowUp[]>([])

  const current = questions[answers.length]
  const questionOpen = analysisDone && questionsLeadInDone && !!current
  const allAnswered = analysisDone && answers.length >= questions.length
  /* The build runs off this thread's own click; `agentCreated` only flips at the end. */
  const building = createPressed
  const nodesCardOpen = building && buildDone && nodesDecision === 'pending' && followUps.length === 0
  const followUpNodesDocked = followUps.some(
    (item, index) =>
      index === followUps.length - 1 &&
      item.stage === 'applied' &&
      item.nodesDecision === 'pending' &&
      item.script.nodes.length > 0,
  )

  const answerMap = useMemo(
    () => Object.fromEntries(answers.map((a) => [a.id, a.text])) as Record<string, string>,
    [answers],
  )
  const plan = useMemo(() => buildJrPlan(answerMap, variant), [answerMap, variant])
  const buildPhases = useMemo(() => buildJrBuildPhases(plan), [plan])
  const nodeUpdates = useMemo(() => buildJrNodeUpdates(plan), [plan])
  const templatesCreated = variant === 'file' && jrTemplatesAccepted(answerMap)
  const acceptedLine = useMemo(() => buildJrAcceptedLine(variant, templatesCreated), [variant, templatesCreated])

  /* The agent exists once the build pass has run; from then on the composer talks to it. */
  const agentReady = building && buildDone
  const followUpBusy = followUps.some((f) => f.stage === 'analysing' || f.stage === 'lead-in' || f.stage === 'applying')

  const startFollowUp = (text: string) =>
    setFollowUps((prev) => [
      ...prev,
      { id: Date.now(), text, at: new Date(), script: matchJrFollowUp(text), stage: 'analysing', nodesDecision: 'pending' },
    ])
  /** Drop this follow-up and anything after it, and hand the text back to the composer.
   *  Only offered until Apply starts — earlier messages stay without rewind. */
  const rewindFollowUp = (id: number) => {
    const item = followUps.find((f) => f.id === id)
    if (!item || item.stage === 'applying' || item.stage === 'applied') return
    setFollowUps((prev) => {
      const index = prev.findIndex((f) => f.id === id)
      return index < 0 ? prev : prev.slice(0, index)
    })
    onRewindFollowUp?.(item.text)
  }
  const undoFollowUpNodes = (id: number) => {
    const item = followUps.find((f) => f.id === id)
    if (!item || item.nodesDecision === 'undone') return
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, nodesDecision: 'undone' } : f)))
    if (item.script.extra) onRemoveWorkflowExtra?.(item.script.extra)
  }
  const setFollowUpStage = (id: number, stage: FollowUpStage) => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, stage } : f)))
    if (stage === 'applying') {
      const extra = followUps.find((f) => f.id === id)?.script.extra
      if (extra) onWorkflowExtra?.(extra)
    }
  }

  const answer = (text: string) => {
    if (!current) return
    setAnswers((prev) => [...prev, { id: current.id, question: current.question, text, at: new Date() }])
  }
  const skipAll = () => {
    setAnswers((prev) => [
      ...prev,
      ...questions.slice(prev.length).map((q) => ({
        id: q.id,
        question: q.question,
        text: q.skipAnswer,
        at: new Date(),
      })),
    ])
  }
  /** Back to just before answer `k` — that question asks again, everything after it goes. */
  const rewindTo = (k: number) => {
    setAnswers((prev) => prev.slice(0, k))
    setPlanLeadInDone(false)
  }

  /* Anything typed into the composer while a question is open answers it; once the agent
     exists it's a follow-up request instead. */
  useEffect(() => {
    if (!pendingAnswer?.trim()) return
    if (questionOpen) answer(pendingAnswer.trim())
    else if (agentReady && !followUpBusy) startFollowUp(pendingAnswer.trim())
    onPendingAnswerConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAnswer])

  /* The build created templates — the canvas gets its Select template node with the Accept. */
  useEffect(() => {
    if (nodesDecision === 'accepted' && templatesCreated) onWorkflowExtra?.('templates')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesDecision])

  /* A question sheet owns its own field, so the composer stays hidden until the questions end. */
  useEffect(() => {
    onAnswerCardOpenChange?.(questionOpen || nodesCardOpen || followUpNodesDocked)
    onNodesCardDockedChange?.(nodesCardOpen || followUpNodesDocked)
    onSuppressComposerChange?.(questionOpen)
    return () => {
      onAnswerCardOpenChange?.(false)
      onNodesCardDockedChange?.(false)
      onSuppressComposerChange?.(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionOpen, nodesCardOpen, followUpNodesDocked])

  const busy =
    !introDone
    || !analysisDone
    || (analysisDone && !questionsLeadInDone)
    || (allAnswered && !planLeadInDone)
    || (building && !buildDone)
    || followUpBusy
  useEffect(() => {
    onBusyChange?.(busy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy])

  return (
    <>
      <UserTurn
        first
        text={prompt.trim()}
        attachments={attachments}
        at={promptAt}
        onRewind={!createPressed && onRewindToStart ? () => onRewindToStart(prompt) : undefined}
      />

      <AgentLine text={introLine} onDone={() => setIntroDone(true)} />

      {introDone && (
        <AgentWorkSequence phases={analysisPhases} onComplete={() => setAnalysisDone(true)} />
      )}

      {analysisDone && (
        <AgentLine tight text={questionsLeadIn} onDone={() => setQuestionsLeadInDone(true)} />
      )}

      {answers.length > 0 && (
        <AnswersSummaryCard answers={answers} onRewind={createPressed ? undefined : rewindTo} />
      )}

      {questionOpen && current && (
        <>
          {/* Consumes the slack when the thread is shorter than the viewport, so the card sits
              flush above the composer either way — sticky alone only pins it once the thread
              actually overflows. */}
          <div className="flex-1" aria-hidden />
          <GhostwriterQuestionCard
            key={`${current.id}-${answers.length}`}
            question={current.question}
            hint={current.hint}
            options={current.options}
            freeText={current.freeText}
            index={answers.length + 1}
            total={questions.length}
            onPrev={answers.length > 0 ? () => rewindTo(answers.length - 1) : undefined}
            onPick={answer}
            onSubmitText={answer}
            onSkip={() => answer(current.skipAnswer)}
            onSkipAll={skipAll}
            className="sticky bottom-lg z-10 !ml-0 !mt-md shadow-card"
            dividers={false}
          />
        </>
      )}

      {allAnswered && (
        <AgentLine key={`plan-lead-${answers.length}`} text={JR_PLAN_LEAD_IN} onDone={() => setPlanLeadInDone(true)} />
      )}

      {allAnswered && planLeadInDone && (
        <PlanCard
          steps={plan}
          meta={variant === 'file' ? JR_FILE_PLAN_META : undefined}
          onOpenDetails={onOpenPlan}
          detailsOpen={planOpen}
          onCreateAgent={() => {
            setCreatePressedAt(new Date())
            setCreatePressed(true)
            onBuildStart?.()
          }}
          agentCreated={createPressed}
        />
      )}

      {createPressed && createPressedAt && (
        <UserTurn text={JR_PLAN_CARD.createLabel} at={createPressedAt} />
      )}

      {/* Stays mounted once done — the checked-off steps are part of the history, not a
          transient loader. */}
      {building && (
        <AgentWorkSequence
          phases={buildPhases}
          summary={JR_BUILD_SUMMARY}
          onPhaseDone={(i) => onBuildProgress?.(i + 1)}
          onComplete={() => {
            setBuildDone(true)
            // The agent exists once every step has run — not when the button was pressed.
            if (!agentCreated) onCreateAgent?.()
          }}
        />
      )}

      {nodesCardOpen && (
        <>
          <div className="flex-1" aria-hidden />
          <NodesUpdatedCard
            nodes={nodeUpdates}
            onAccept={() => setNodesDecision('accepted')}
            onUndo={() => setNodesDecision('undone')}
            undoDisabled={followUps.length > 0}
            onOpenNode={onOpenNode}
            className={NODES_CARD_CLASS}
          />
        </>
      )}

      {nodesDecision === 'accepted' && (
        <AgentRichLine tight actions segments={acceptedLine} onOpenNode={onOpenNode} />
      )}
      {nodesDecision === 'undone' && <AgentLine tight actions text={JR_UNDONE_LINE} />}

      {followUps.map((item, index) => (
        <FollowUpThread
          key={item.id}
          item={item}
          onStage={(stage) => setFollowUpStage(item.id, stage)}
          onOpenNode={onOpenNode}
          onRewind={() => rewindFollowUp(item.id)}
          onUndoNodes={() => undoFollowUpNodes(item.id)}
          showNodesCard={index === followUps.length - 1}
        />
      ))}
    </>
  )
}
