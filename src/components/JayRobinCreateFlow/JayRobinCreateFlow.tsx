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
 *   lead-in line, then the plan card (five pointers · See details · Create agent)
 *   "Working…" → "Worked for 12s" accordion (one check-row per pointer, actions on a rail)
 *   "N nodes updated · Accept / Undo" docked above the composer
 *   closing line
 *
 * Rewind on any user turn truncates the thread back to that point (the question is asked
 * again). Rewind is retired once the agent exists — there's nothing to un-build.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTypewriter } from '../../hooks/useTypewriter'
import {
  JR_ACCEPTED_LINE,
  JR_ANALYSIS_PHASES,
  JR_BUILD_SUMMARY,
  JR_INTRO_LINE,
  JR_PLAN_CARD,
  JR_PLAN_LEAD_IN,
  JR_QUESTIONS,
  JR_QUESTIONS_LEAD_IN,
  JR_UNDONE_LINE,
  buildJrBuildPhases,
  buildJrNodeUpdates,
  buildJrPlan,
} from '../../data/jayRobinCreateFlow'
import type { JrPlanStep } from '../../data/jayRobinCreateFlow'
import { AgentWorkSequence } from '../AgentActivityHeader/AgentWorkSequence'
import { GhostwriterQuestionCard } from '../GhostwriterQuestionCard/GhostwriterQuestionCard'
import { Icon } from '../Icon/Icon'
import { SparkleLoader } from '../SparkleLoader/SparkleLoader'
import { Tooltip } from '../Tooltip/Tooltip'
import { NodesUpdatedCard } from './NodesUpdatedCard'
import type { JayRobinCreateFlowProps } from './JayRobinCreateFlow.types'

/** Question cards dock flush above the composer, the same way the other create flows do. */
const DOCKED_CARD_CLASS = 'sticky bottom-0 z-10 !ml-0 !mt-md !rounded-b-none !border-b-0 shadow-card'

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
    <div className="ml-3xl mt-xs flex h-6 items-center gap-xs opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
 * A user turn — the bubble, plus an action row that appears on hover: when it was sent, copy,
 * and rewind. Rewind is the one that matters for a demo: it takes the thread back to this
 * message so the question can be answered differently.
 */
function UserTurn({
  text,
  question,
  at,
  onRewind,
  first = false,
}: {
  text: string
  /** Kept above the answer once a card's options disappear, so the history still shows what
   *  was asked. */
  question?: string
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
 * The plan — a stepper of five pointers (hollow-dot markers on a rail, title + one line of
 * what it does), a title row that folds the list away, and the two things you can do with
 * it: "See details" (text button — the full plan panel) and "Create agent" (primary).
 */
function PlanCard({
  steps,
  onOpenDetails,
  detailsOpen = false,
  onCreateAgent,
  agentCreated = false,
}: {
  steps: JrPlanStep[]
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
            <span className="text-h3 text-text-primary">{JR_PLAN_CARD.title}</span>
            <span className="text-small text-text-tertiary">{JR_PLAN_CARD.meta}</span>
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
              <li key={step.title} className="flex items-start gap-md">
                <span className="mt-[7px] flex size-[11px] shrink-0 rounded-full border border-border-selected bg-surface" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col gap-2xs">
                  <span className="text-body text-text-primary">{step.title}</span>
                  <span className="text-small text-text-secondary">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="flex items-center justify-end gap-sm border-t border-border px-lg py-md">
          <button
            type="button"
            onClick={onOpenDetails}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            {detailsOpen ? JR_PLAN_CARD.detailsOpenLabel : JR_PLAN_CARD.detailsLabel}
          </button>
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

interface Answer {
  id: string
  question: string
  text: string
  at: Date
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
  onBusyChange,
  pendingAnswer,
  onPendingAnswerConsumed,
  onOpenNode,
  onRewindToStart,
}: JayRobinCreateFlowProps) {
  const [promptAt] = useState(() => new Date())
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
  /** The "N nodes updated" review: pending until Accept or Undo is pressed. */
  const [nodesDecision, setNodesDecision] = useState<'pending' | 'accepted' | 'undone'>('pending')

  const current = JR_QUESTIONS[answers.length]
  const questionOpen = analysisDone && questionsLeadInDone && !!current
  const allAnswered = analysisDone && answers.length >= JR_QUESTIONS.length
  /* The build runs off this thread's own click; `agentCreated` only flips at the end. */
  const building = createPressed
  const nodesCardOpen = building && buildDone && nodesDecision === 'pending'

  const answerMap = useMemo(
    () => Object.fromEntries(answers.map((a) => [a.id, a.text])) as Record<string, string>,
    [answers],
  )
  const plan = useMemo(() => buildJrPlan(answerMap), [answerMap])
  const buildPhases = useMemo(() => buildJrBuildPhases(plan), [plan])
  const nodeUpdates = useMemo(() => buildJrNodeUpdates(plan), [plan])

  const answer = (text: string) => {
    if (!current) return
    setAnswers((prev) => [...prev, { id: current.id, question: current.question, text, at: new Date() }])
  }
  /** Back to just before answer `k` — that question asks again, everything after it goes. */
  const rewindTo = (k: number) => {
    setAnswers((prev) => prev.slice(0, k))
    setPlanLeadInDone(false)
  }

  /* Anything typed into the composer while a question is open answers it. */
  useEffect(() => {
    if (!pendingAnswer?.trim()) return
    if (questionOpen) answer(pendingAnswer.trim())
    onPendingAnswerConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAnswer])

  /* Both the question cards and the nodes-updated card dock flush above the composer. */
  useEffect(() => {
    onAnswerCardOpenChange?.(questionOpen || nodesCardOpen)
    return () => onAnswerCardOpenChange?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionOpen, nodesCardOpen])

  const busy =
    !introDone
    || !analysisDone
    || (analysisDone && !questionsLeadInDone)
    || (allAnswered && !planLeadInDone)
    || (building && !buildDone)
  useEffect(() => {
    onBusyChange?.(busy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy])

  return (
    <>
      <UserTurn
        first
        text={prompt.trim()}
        at={promptAt}
        onRewind={!createPressed && onRewindToStart ? () => onRewindToStart(prompt) : undefined}
      />

      <AgentLine text={JR_INTRO_LINE} onDone={() => setIntroDone(true)} />

      {introDone && (
        <AgentWorkSequence phases={JR_ANALYSIS_PHASES} onComplete={() => setAnalysisDone(true)} />
      )}

      {analysisDone && (
        <AgentLine tight text={JR_QUESTIONS_LEAD_IN} onDone={() => setQuestionsLeadInDone(true)} />
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
            onPick={answer}
            onSubmitText={answer}
            onSkip={() => answer(current.skipAnswer)}
            className={DOCKED_CARD_CLASS}
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
          onOpenDetails={onOpenPlan}
          detailsOpen={planOpen}
          onCreateAgent={() => {
            setCreatePressed(true)
            onBuildStart?.()
          }}
          agentCreated={createPressed}
        />
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
            onOpenNode={onOpenNode}
            className={DOCKED_CARD_CLASS}
          />
        </>
      )}

      {nodesDecision === 'accepted' && <AgentLine tight actions text={JR_ACCEPTED_LINE} />}
      {nodesDecision === 'undone' && <AgentLine tight actions text={JR_UNDONE_LINE} />}
    </>
  )
}
