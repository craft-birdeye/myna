/**
 * The copilot conversation for one review coaching item, docked on the workflow canvas.
 *
 *   user turn      — the feedback + the trace (review, reply)
 *   Working…       — reads the trace, checks the node that decided
 *   finding        — what went wrong, in one paragraph
 *   question card  — how to fix it (options + "Other…")   ← nothing changes before this
 *   Working…       — the fix, step by step (check-rows)
 *   nodes updated  — Accept / Undo, rows open the node on the canvas
 *   closing line
 *
 * Owns its own scroller and composer: `AiBuilderPanel`'s `content` slot replaces the panel's
 * default body wholesale. Script and copy come from `data/reviewCoaching.ts`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AgentWorkSequence } from '../AgentActivityHeader/AgentWorkSequence'
import type { WorkPhase } from '../AgentActivityHeader/AgentWorkSequence'
import { GhostwriterQuestionCard } from '../GhostwriterQuestionCard/GhostwriterQuestionCard'
import { NodesUpdatedCard } from '../JayRobinCreateFlow/NodesUpdatedCard'
import { PromptComposer } from '../PromptComposer/PromptComposer'
import { SparkleLoader } from '../SparkleLoader/SparkleLoader'
import { useTypewriter } from '../../hooks/useTypewriter'
import { buildReviewCoachingScript, REVIEW_COACHING_COPY } from '../../data/reviewCoaching'
import type { ReviewCoachingItem, ReviewCoachingOption } from '../../data/reviewCoaching'
import type { JrNodeUpdate } from '../../data/jayRobinCreateFlow'
import type { ReviewCoachingFlowProps } from './ReviewCoachingFlow.types'

const DOCKED_CARD_CLASS = '!ml-0 !mt-md'

function AgentLine({ text, onDone, tight = false }: { text: string; onDone?: () => void; tight?: boolean }) {
  const { typed, done } = useTypewriter(text, { charsPerTick: 10, intervalMs: 10, onDone })
  return (
    <div className={`agent-build-fade flex gap-sm ${tight ? 'mt-lg' : 'mt-3xl'}`}>
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
        <SparkleLoader size={14} spinning={!done} />
      </span>
      <p className="m-0 min-w-0 flex-1 whitespace-pre-line text-body leading-6 text-text-primary">{typed}</p>
    </div>
  )
}

function UserTurn({ text, first = false }: { text: string; first?: boolean }) {
  return (
    <div className={`flex justify-end ${first ? 'pt-md' : 'mt-[36px]'}`}>
      <p className="m-0 max-w-[88%] whitespace-pre-line rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary">
        {text}
      </p>
    </div>
  )
}

interface Chosen {
  label: string
  ack: string
  applyPhases?: WorkPhase[]
  nodes?: JrNodeUpdate[]
  acceptedLine?: string
}

export function ReviewCoachingFlow({ item, onOpenNode, onResolved }: ReviewCoachingFlowProps) {
  const script = useMemo(() => buildReviewCoachingScript(item), [item])
  const [analysisDone, setAnalysisDone] = useState(false)
  const [findingDone, setFindingDone] = useState(false)
  const [chosen, setChosen] = useState<Chosen | null>(null)
  const [ackDone, setAckDone] = useState(false)
  const [applyDone, setApplyDone] = useState(false)
  const [decision, setDecision] = useState<'pending' | 'accepted' | 'undone'>('pending')
  const [composer, setComposer] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  /* Follow the conversation as it grows. */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const id = window.setInterval(() => {
      el.scrollTo({ top: el.scrollHeight })
    }, 400)
    return () => window.clearInterval(id)
  }, [])

  const questionOpen = analysisDone && findingDone && !chosen
  const hasChanges = !!chosen?.applyPhases?.length
  const busy = !analysisDone || (analysisDone && !findingDone) || (!!chosen && !ackDone) || (hasChanges && !applyDone)

  const pick = (option: ReviewCoachingOption) =>
    setChosen({ label: option.label, ack: option.ack, applyPhases: option.applyPhases, nodes: option.nodes, acceptedLine: option.acceptedLine })

  const pickCustom = (text: string) =>
    setChosen({
      label: text,
      ack: script.customInstructionAck,
      applyPhases: script.customApplyPhases,
      nodes: script.customNodes,
      acceptedLine: script.customAcceptedLine,
    })

  const decide = (next: 'accepted' | 'undone') => {
    setDecision(next)
    onResolved?.(next === 'accepted' ? 'accepted' : 'rejected')
  }

  const sendComposer = () => {
    const text = composer.trim()
    if (!text || !questionOpen) return
    setComposer('')
    pickCustom(text)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-lg pb-md">
        <UserTurn first text={script.userMessage} />

        <AgentWorkSequence
          phases={script.analysisPhases}
          onComplete={() => setAnalysisDone(true)}
          className="ml-3xl mt-lg"
        />

        {analysisDone && <AgentLine tight text={script.findingLine} onDone={() => setFindingDone(true)} />}

        {questionOpen && (
          <GhostwriterQuestionCard
            question={script.question}
            options={script.options}
            freeText={{ placeholder: 'Other…', submitLabel: 'Submit' }}
            onPick={(label) => {
              const option = script.options.find((o) => o.label === label)
              if (option) pick(option)
            }}
            onSubmitText={pickCustom}
            className={DOCKED_CARD_CLASS}
          />
        )}

        {chosen && (
          <>
            <UserTurn text={chosen.label} />
            <AgentLine text={chosen.ack} onDone={() => setAckDone(true)} />
          </>
        )}

        {chosen && ackDone && hasChanges && (
          <AgentWorkSequence
            phases={chosen.applyPhases!}
            summary={REVIEW_COACHING_COPY.applyingSummary}
            onComplete={() => setApplyDone(true)}
          />
        )}

        {chosen && ackDone && hasChanges && applyDone && decision === 'pending' && chosen.nodes && (
          <NodesUpdatedCard
            nodes={chosen.nodes}
            onAccept={() => decide('accepted')}
            onUndo={() => decide('undone')}
            onOpenNode={onOpenNode}
            className={DOCKED_CARD_CLASS}
          />
        )}

        {chosen && ackDone && !hasChanges && <AgentLine tight text={script.leaveLine} onDone={() => onResolved?.('rejected')} />}
        {decision === 'accepted' && <AgentLine tight text={chosen?.acceptedLine ?? script.customAcceptedLine} />}
        {decision === 'undone' && <AgentLine tight text={script.undoneLine} />}
      </div>

      <div className="shrink-0 bg-surface px-lg pb-md pt-sm">
        <PromptComposer
          value={composer}
          onChange={setComposer}
          onSend={sendComposer}
          placeholder={REVIEW_COACHING_COPY.composerPlaceholder}
          sendDisabled={busy || !questionOpen}
        />
      </div>
    </div>
  )
}
