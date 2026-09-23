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
    <div className="gw-flow__in flex items-start gap-sm">
      <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
        {isActive ? <ActivityDots /> : <ActivityStepTick />}
      </span>
      <p className="m-0 min-w-0 text-small text-text-tertiary">{tool}</p>
    </div>
  )
}

/** A "Thought" or tool-call group, nested inside the outer "Worked for" accordion and
 *  independently collapsible from it — same chevron treatment as the outer header (reused,
 *  not reinvented), just smaller and without its own running/done state. Defaults open; there
 *  is no auto-collapse here, only the outer accordion collapses on its own. */
function SubAccordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-xs self-start text-small text-text-tertiary"
      >
        {label}
        <span
          className={`gw-activity-chevron${open ? ' gw-activity-chevron--down' : ' gw-activity-chevron--sideways'}`}
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 7.25 6 3.75l3.5 3.5"
              stroke="#717182"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && children}
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
  /** Per-phase Thought/tools sub-accordions — keyed `${phaseIndex}-thought`/`-tools`, absent
   *  from the set (the default) means open. */
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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
    <div className="ml-3xl mt-lg flex max-w-full flex-col">
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

            const thoughtKey = `${phaseIndex}-thought`
            const toolsKey = `${phaseIndex}-tools`

            return (
              <div key={phaseIndex} className="flex flex-col gap-md">
                {showThought && (
                  <SubAccordion
                    label="Thought"
                    open={!collapsedGroups.has(thoughtKey)}
                    onToggle={() => toggleGroup(thoughtKey)}
                  >
                    <div className="flex items-start gap-sm pl-md">
                      <span className="mt-[7px] flex size-[6px] shrink-0 rounded-full bg-text-tertiary" aria-hidden />
                      <p className="m-0 min-w-0 text-small text-text-tertiary">{phase.thought}</p>
                    </div>
                  </SubAccordion>
                )}
                {visibleTools.length > 0 && (
                  <SubAccordion
                    label={phase.toolsLabel}
                    open={!collapsedGroups.has(toolsKey)}
                    onToggle={() => toggleGroup(toolsKey)}
                  >
                    <div className="flex flex-col gap-sm pl-md">
                      {phase.tools.map((tool, i) => {
                        const idx = range.toolIdxs[i]
                        if (idx >= revealed) return null
                        return <ToolRow key={tool} tool={tool} isActive={idx === revealed - 1} />
                      })}
                    </div>
                  </SubAccordion>
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
