import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { READING_TIMING } from '../../data/ghostwriterReadingBlock'
import { ActivityDots, ActivityStepTick, AgentActivityHeader } from './AgentActivityHeader'

export interface WorkPhase {
  /** The reasoning before this phase's tool calls — omitted for phases with no separate
   *  lead-in (their `toolsLabel` alone frames the tool calls). */
  thought?: string
  /** Heading for this phase's tool-call group — the beat's own former header text. */
  toolsLabel: string
  /** Each becomes one tool-call row, revealed in sequence. */
  tools: string[]
  /** The phase's findings — what used to be shown as permanent chat prose (summary/footnote)
   *  now reads as part of the thinking, tucked inside the accordion instead. */
  findings?: string[]
  /** Extra content revealed alongside `findings` (e.g. an interactive link). */
  body?: ReactNode
}

export interface AgentWorkSequenceProps {
  /** Walked start to finish inside ONE continuous "Worked for #s" header — unlike
   *  `AgentWorkBlock`, which is one phase with its own header, this runs every phase back to
   *  back with no intermediate collapse, so multiple beats of thinking read as a single
   *  block of work instead of several small ones. */
  phases: WorkPhase[]
  onComplete?: () => void
}

type EventKind = 'thought' | 'tool' | 'findings'
interface PhaseRange {
  thoughtIdx: number | null
  toolIdxs: number[]
  findingsIdx: number | null
}

function buildRanges(phases: WorkPhase[]): { ranges: PhaseRange[]; total: number } {
  let cursor = 0
  const ranges = phases.map((phase) => {
    const thoughtIdx = phase.thought ? cursor++ : null
    const toolIdxs = phase.tools.map(() => cursor++)
    const findingsIdx = phase.findings?.length || phase.body ? cursor++ : null
    return { thoughtIdx, toolIdxs, findingsIdx }
  })
  return { ranges, total: cursor }
}

/** One event's row — the "current" (most recently revealed) tool gets the dot-grid loader,
 *  everything older gets a tick. Thought/findings don't get this treatment; they're prose,
 *  not discrete calls, so they just fade in once revealed. */
function ToolRow({ tool, isActive }: { tool: string; isActive: boolean }) {
  return (
    <div className="gw-flow__in flex items-start gap-sm pl-md">
      <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
        {isActive ? <ActivityDots /> : <ActivityStepTick />}
      </span>
      <p className="m-0 min-w-0 text-small text-text-tertiary">{tool}</p>
    </div>
  )
}

/**
 * Jay & Robin's unified "Worked for #s" accordion — every reading/testing beat runs inside
 * ONE header instead of each beat getting its own, so the whole account-analysis pass reads
 * as one block of thinking. Per-beat findings that used to stay visible as permanent chat
 * prose (summary/footnote) render inside here too — the only text left outside this block is
 * whatever leads into a question or the final plan, per the "only show text before an input
 * or a final output" rule.
 */
export function AgentWorkSequence({ phases, onComplete }: AgentWorkSequenceProps) {
  const { ranges, total } = useMemo(() => buildRanges(phases), [phases])
  const [thinking, setThinking] = useState(true)
  const [revealed, setRevealed] = useState(0)
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const doneRef = useRef(onComplete)
  doneRef.current = onComplete

  const allDone = revealed >= total
  const collapsed = manualCollapsed ?? (!thinking && allDone)

  useEffect(() => {
    const t = READING_TIMING
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    at(t.thinking, () => setThinking(false))

    let cursor = t.thinking
    for (let i = 0; i < total; i++) {
      cursor += t.stepInterval
      at(cursor, () => setRevealed(i + 1))
    }

    cursor += t.summaryDelay
    at(cursor, () => doneRef.current?.())

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  useEffect(() => {
    if (allDone) return undefined
    const started = Date.now() - elapsedMs
    const id = setInterval(() => setElapsedMs(Date.now() - started), 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  return (
    <div className="ml-3xl mt-sm flex max-w-full flex-col">
      <AgentActivityHeader
        running={!allDone}
        seconds={`${Math.round(elapsedMs / 1000)}s`}
        collapsed={collapsed}
        onToggle={() => setManualCollapsed(!collapsed)}
        toggleDisabled={thinking}
        label="Worked for"
        pill={false}
        chevronStyle="rightdown"
      />

      {!thinking && !collapsed && (
        <div className="gw-activity-steps mt-sm flex flex-col gap-lg">
          {phases.map((phase, phaseIndex) => {
            const range = ranges[phaseIndex]
            const showThought = range.thoughtIdx !== null && range.thoughtIdx < revealed
            const showFindings = range.findingsIdx !== null && range.findingsIdx < revealed
            const visibleTools = range.toolIdxs.filter((idx) => idx < revealed)
            if (!showThought && visibleTools.length === 0) return null

            return (
              <div key={phaseIndex} className="flex flex-col gap-md">
                {showThought && (
                  <div className="flex items-start gap-sm">
                    <span className="mt-[7px] flex size-[6px] shrink-0 rounded-full bg-text-tertiary" aria-hidden />
                    <p className="m-0 min-w-0 text-small text-text-tertiary">{phase.thought}</p>
                  </div>
                )}
                {visibleTools.length > 0 && (
                  <div className="flex flex-col gap-sm">
                    <p className="m-0 text-small text-text-tertiary">{phase.toolsLabel}</p>
                    {phase.tools.map((tool, i) => {
                      const idx = range.toolIdxs[i]
                      if (idx >= revealed) return null
                      return <ToolRow key={tool} tool={tool} isActive={idx === revealed - 1} />
                    })}
                  </div>
                )}
                {showFindings && (
                  <div className="flex flex-col gap-sm pl-md">
                    {phase.findings?.map((line, i) => (
                      <p key={i} className="gw-flow__in m-0 text-small text-text-tertiary">
                        {line}
                      </p>
                    ))}
                    {phase.body}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
