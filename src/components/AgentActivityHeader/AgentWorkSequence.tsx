import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { READING_TIMING } from '../../data/ghostwriterReadingBlock'
import { Icon } from '../Icon/Icon'
import { AgentActivityHeader } from './AgentActivityHeader'

/** One tool call. A bare string is just the label; the object form adds an optional `detail`
 *  line the row expands to (rows with detail get a `›`). `icon` is accepted for data
 *  compatibility but not rendered — a glyph per row read as noise inside the thinking state. */
export type WorkTool = string | { label: string; icon?: string; detail?: string }

export interface WorkPhase {
  /** `work` (default): narration + a "Ran N tools" group, the shape the account-analysis
   *  pass uses. `step`: one item of the plan being executed — `toolsLabel` becomes a
   *  full-strength row with its own spinner→check, and the tool calls hang underneath it as
   *  the concrete actions that row took. */
  kind?: 'work' | 'step'
  /** What the agent says before this phase's tool calls — body text, read as narration. */
  thought?: string
  /** Heading for this phase — used as the step row for `step` phases; for `work` phases the
   *  tool group header reads "Running/Ran N tools" instead, so this is only a fallback for
   *  the `status` shown in the accordion header. */
  toolsLabel: string
  /** What the header says while this phase's tool calls are running — "Fetching templates",
   *  "Analysing replies" — in place of the generic `runningLabel`. Thoughts and findings fall
   *  back to `runningLabel`, so the header reads Working → status → Working → status… */
  status?: string
  /** Each becomes one tool-call row, revealed in sequence. */
  tools: WorkTool[]
  /** What the phase found — said after the tools, before the next phase's narration. */
  findings?: string[]
  /** Extra content revealed alongside `findings` (e.g. an interactive link). */
  body?: ReactNode
}

export interface AgentWorkSequenceProps {
  /** Walked start to finish inside ONE continuous header — every phase runs back to back
   *  with no intermediate collapse, so multiple beats of thinking read as a single block of
   *  work instead of several small ones. */
  phases: WorkPhase[]
  onComplete?: () => void
  /** Fires once per phase, the moment its last tool call has returned (something after it
   *  landed, or the run ended) — what a caller syncs external progress to, e.g. revealing the
   *  canvas node a build step produced. */
  onPhaseDone?: (phaseIndex: number) => void
  /** Header label while work is in flight — "Working" + a live clock. */
  runningLabel?: string
  /** Header label once done — "Worked for" + the frozen total. */
  doneLabel?: string
  /** One line that survives the collapse — what the work amounted to. */
  summary?: string
  /** Gap between events landing; defaults to `READING_TIMING.stepInterval`. */
  stepIntervalMs?: number
  /** "Agent is thinking" beat before the first event; defaults to `READING_TIMING.thinking`. */
  thinkingMs?: number
  className?: string
}

/** "18s" under a minute, "1m 20s" past it — the clock reads the way a person would say it. */
export function formatElapsed(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function normalizeTool(tool: WorkTool) {
  return typeof tool === 'string' ? { label: tool } : tool
}

interface PhaseRange {
  thoughtIdx: number | null
  toolIdxs: number[]
  findingsIdx: number | null
}

function buildRanges(phases: WorkPhase[]): { ranges: PhaseRange[]; total: number } {
  let cursor = 0
  const ranges = phases.map((phase) => {
    const thoughtIdx = phase.thought ? cursor++ : null
    /* A step's own row is an event too — it lands (spinner) before its first action does. */
    const stepIdx = phase.kind === 'step' ? cursor++ : null
    const toolIdxs = phase.tools.map(() => cursor++)
    const findingsIdx = phase.findings?.length || phase.body ? cursor++ : null
    return { thoughtIdx, toolIdxs: stepIdx === null ? toolIdxs : [stepIdx, ...toolIdxs], findingsIdx }
  })
  return { ranges, total: cursor }
}

/** Thin ring that spins while a call is in flight; a hollow grey dot once it has returned. */
function ToolStatus({ active }: { active: boolean }) {
  return active ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="gw-flow__spinner" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="#cbd2dc" strokeWidth="1.5" />
      <path d="M7 2a5 5 0 0 1 5 5" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4" stroke="#cbd2dc" strokeWidth="1.5" />
    </svg>
  )
}

/** One tool-call row: status ring, its label, and — when it carries a `detail` — a `›` that
 *  expands the row to show it. */
function ToolRow({ tool, isActive }: { tool: WorkTool; isActive: boolean }) {
  const { label, detail } = normalizeTool(tool)
  const [open, setOpen] = useState(false)
  const row = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center">
        <ToolStatus active={isActive} />
      </span>
      <span className="min-w-0 text-small text-text-secondary">{label}</span>
      {detail && (
        <Icon
          name="chevron_right"
          size={16}
          className={`shrink-0 text-text-icon transition-transform ${open ? 'rotate-90' : ''}`}
        />
      )}
    </>
  )
  return (
    <div className="gw-flow__in flex flex-col gap-xs">
      {detail ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-sm text-left"
        >
          {row}
        </button>
      ) : (
        <div className="flex items-center gap-sm">{row}</div>
      )}
      {detail && open && (
        <p className="gw-flow__in m-0 pl-[24px] text-small text-text-tertiary">{detail}</p>
      )}
    </div>
  )
}

/** Rows hang off a hairline rail that runs through the status rings. */
function ToolRail({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-sm">
      <span className="absolute bottom-[10px] left-[7px] top-[10px] w-px bg-border" aria-hidden />
      {children}
    </div>
  )
}

/** "Running 3 tools ˅" while calls are still landing, "Ran 3 tools ˅" once the group is
 *  complete — collapsible independently of the outer accordion. */
function ToolGroup({
  count,
  running,
  open,
  onToggle,
  children,
}: {
  count: number
  running: boolean
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-xs self-start text-small text-text-tertiary"
      >
        {running ? 'Running' : 'Ran'} {count} {count === 1 ? 'tool' : 'tools'}
        <span
          className={`gw-activity-chevron${open ? ' gw-activity-chevron--down' : ' gw-activity-chevron--sideways'}`}
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 7.25 6 3.75l3.5 3.5" stroke="#717182" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && children}
    </div>
  )
}

/**
 * Jay & Robin's unified "Working… / Worked for #s" accordion — every beat runs inside ONE
 * header instead of each beat getting its own, so a whole pass (reading the account, or
 * executing the plan) reads as one block of work. Inside, narration is body text and tool
 * calls sit in "Ran N tools" groups on a rail — the way the agent-builder references read.
 * The body is hidden by default (the header's status + clock is the progress indicator) and
 * opens only when the user clicks the chevron.
 */
export function AgentWorkSequence({
  phases,
  onComplete,
  onPhaseDone,
  runningLabel = 'Working',
  doneLabel = 'Worked for',
  summary,
  stepIntervalMs = READING_TIMING.stepInterval,
  thinkingMs = READING_TIMING.thinking,
  className = 'ml-3xl mt-lg',
}: AgentWorkSequenceProps) {
  const { ranges, total } = useMemo(() => buildRanges(phases), [phases])
  const [thinking, setThinking] = useState(true)
  const [revealed, setRevealed] = useState(0)
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  /** Per-phase tool groups — keyed by phase index, absent from the set (the default) means open. */
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())
  const toggleGroup = (key: number) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const doneRef = useRef(onComplete)
  doneRef.current = onComplete
  const phaseDoneRef = useRef(onPhaseDone)
  phaseDoneRef.current = onPhaseDone
  const firedPhasesRef = useRef<Set<number>>(new Set())

  const allDone = revealed >= total
  /* Hidden by default, while running and after — the header alone narrates progress
     (status + clock). The body only ever shows because the user clicked the chevron. */
  const collapsed = manualCollapsed ?? true

  /* The header narrates: "Working" while it thinks or digests findings, the phase's own
     `status` while that phase's tool calls are landing — so it reads Working → Fetching
     previous responses → Working → Analysing responses → … → Worked for 1m 5s. */
  const statusLabel = useMemo(() => {
    if (allDone) return doneLabel
    if (thinking || revealed === 0) return runningLabel
    const current = revealed - 1
    const phaseIndex = ranges.findIndex((r) => r.toolIdxs.includes(current))
    if (phaseIndex === -1) return runningLabel
    const phase = phases[phaseIndex]
    return phase.status ?? phase.toolsLabel
  }, [allDone, thinking, revealed, ranges, phases, runningLabel, doneLabel])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    at(thinkingMs, () => setThinking(false))

    let cursor = thinkingMs
    for (let i = 0; i < total; i++) {
      cursor += stepIntervalMs
      at(cursor, () => setRevealed(i + 1))
    }

    cursor += READING_TIMING.summaryDelay
    at(cursor, () => doneRef.current?.())

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  /* A phase counts as done once something after its last event has landed (or the run is
     over) — the same rule the step rows use for their check. Fire each index once. */
  useEffect(() => {
    ranges.forEach((range, i) => {
      if (firedPhasesRef.current.has(i)) return
      const lastIdx = Math.max(range.findingsIdx ?? -1, range.toolIdxs[range.toolIdxs.length - 1] ?? -1, range.thoughtIdx ?? -1)
      if (allDone || lastIdx < revealed - 1) {
        firedPhasesRef.current.add(i)
        phaseDoneRef.current?.(i)
      }
    })
  }, [revealed, allDone, ranges])

  useEffect(() => {
    if (allDone) return undefined
    const started = Date.now() - elapsedMs
    const id = setInterval(() => setElapsedMs(Date.now() - started), 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  return (
    <div className={`flex max-w-full flex-col ${className}`}>
      <AgentActivityHeader
        running={!allDone}
        seconds={formatElapsed(elapsedMs)}
        collapsed={collapsed}
        onToggle={() => setManualCollapsed(!collapsed)}
        toggleDisabled={thinking}
        label={statusLabel}
        pill={false}
        chevronStyle="rightdown"
      />

      {!thinking && !collapsed && (
        <div className="gw-activity-steps mt-sm flex flex-col gap-lg">
          {phases.map((phase, phaseIndex) => {
            const range = ranges[phaseIndex]
            const isStep = phase.kind === 'step'
            const showThought = range.thoughtIdx !== null && range.thoughtIdx < revealed
            const showFindings = range.findingsIdx !== null && range.findingsIdx < revealed
            const visibleIdxs = range.toolIdxs.filter((idx) => idx < revealed)
            if (!showThought && visibleIdxs.length === 0) return null

            /* A step is finished once something after its last action has landed (or the
               whole run is over) — until then its row keeps the spinner. */
            const lastIdx = range.toolIdxs[range.toolIdxs.length - 1]
            const groupDone = allDone || lastIdx < revealed - 1
            /* For steps, toolIdxs[0] is the step's own row; the real actions follow it. */
            const actionIdxs = isStep ? range.toolIdxs.slice(1) : range.toolIdxs
            const visibleActions = actionIdxs.filter((idx) => idx < revealed)
            const rows = phase.tools.map((tool, i) => {
              const idx = actionIdxs[i]
              if (idx >= revealed) return null
              return <ToolRow key={normalizeTool(tool).label} tool={tool} isActive={idx === revealed - 1 && !allDone} />
            })

            return (
              <div key={phaseIndex} className="flex flex-col gap-md">
                {showThought && (
                  <p className="gw-flow__in m-0 text-body leading-6 text-text-primary">{phase.thought}</p>
                )}
                {isStep && visibleIdxs.length > 0 && (
                  <div className="flex flex-col gap-sm">
                    <div className="gw-flow__in flex items-center gap-sm">
                      {groupDone ? (
                        <Icon name="check_circle" size={18} className="shrink-0 text-accent-positive" />
                      ) : (
                        <Icon name="progress_activity" size={18} className="shrink-0 animate-spin text-text-tertiary" />
                      )}
                      <span className="text-body text-text-primary">{phase.toolsLabel}</span>
                    </div>
                    {visibleActions.length > 0 && (
                      <div className="pl-[26px]">
                        <ToolRail>{rows}</ToolRail>
                      </div>
                    )}
                  </div>
                )}
                {!isStep && visibleActions.length > 0 && (
                  <ToolGroup
                    count={visibleActions.length}
                    running={!groupDone}
                    open={!collapsedGroups.has(phaseIndex)}
                    onToggle={() => toggleGroup(phaseIndex)}
                  >
                    <ToolRail>{rows}</ToolRail>
                  </ToolGroup>
                )}
                {showFindings && (
                  <div className="flex flex-col gap-sm">
                    {phase.findings?.map((line, i) => (
                      <p key={i} className="gw-flow__in m-0 text-body leading-6 text-text-secondary">
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

      {allDone && summary && (
        <div className="agent-build-fade mt-md flex items-center gap-sm">
          <Icon name="check_circle" size={18} className="shrink-0 text-accent-positive" />
          <span className="text-body text-text-primary">{summary}</span>
        </div>
      )}
    </div>
  )
}
