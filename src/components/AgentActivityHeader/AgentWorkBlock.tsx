import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { READING_TIMING } from '../../data/ghostwriterReadingBlock'
import { ActivityDots, ActivityStepTick, AgentActivityHeader } from './AgentActivityHeader'

export interface AgentWorkBlockProps {
  /** The reasoning before the tool calls — omit for a beat with no separate lead-in (its
   *  `toolsLabel` carries the framing instead). */
  thought?: string
  /** Heading for the tool-call group — the beat's own former header text (e.g. "Reading how
   *  you respond today"), kept rather than replaced by a generic "Ran N tools". */
  toolsLabel: string
  /** Each becomes one tool-call row, revealed in sequence. */
  tools: string[]
  /** The finding itself, shown as plain agent speech once the block has collapsed. */
  summary?: string
  body?: ReactNode
  footnote?: string
  calloutExtraMs?: number
  onComplete?: () => void
}

/**
 * Jay & Robin's flavor of `ActivityFindingsBlock` — same beats, same timing/data, but the
 * header always reads "Worked for {n}s" rather than a per-beat label, the intro paragraph (if
 * any) renders as a "Thought" row instead of its own chat bubble, and the block collapses to
 * that single header line on its own once every tool call has landed, instead of waiting for
 * a manual click. The original Ghostwriter nav keeps `ActivityFindingsBlock` untouched.
 */
export function AgentWorkBlock({
  thought,
  toolsLabel,
  tools,
  summary,
  body,
  footnote,
  calloutExtraMs = 0,
  onComplete,
}: AgentWorkBlockProps) {
  const [thinking, setThinking] = useState(true)
  const [toolsDone, setToolsDone] = useState(0)
  const [summaryIn, setSummaryIn] = useState(false)
  const [bodyIn, setBodyIn] = useState(false)
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const doneRef = useRef(onComplete)
  doneRef.current = onComplete

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const allToolsDone = toolsDone >= tools.length
  const collapsed = manualCollapsed ?? (!thinking && allToolsDone)

  useEffect(() => {
    const t = READING_TIMING
    const scale = reduceMotion ? 0.3 : 1
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms * scale))

    at(t.thinking, () => setThinking(false))

    let cursor = t.thinking
    tools.forEach((_, i) => {
      cursor += t.stepInterval
      at(cursor, () => setToolsDone(i + 1))
    })

    cursor += t.summaryDelay
    at(cursor, () => setSummaryIn(true))

    cursor += t.tableDelay
    at(cursor, () => setBodyIn(true))

    cursor += calloutExtraMs
    at(cursor, () => doneRef.current?.())

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion])

  /* Clock runs until every tool call has landed, then freezes for the collapsed header. */
  useEffect(() => {
    if (allToolsDone) return undefined
    const started = Date.now() - elapsedMs
    const id = setInterval(() => setElapsedMs(Date.now() - started), 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allToolsDone])

  return (
    <div className="ml-3xl mt-sm flex max-w-full flex-col">
      <AgentActivityHeader
        running={!allToolsDone}
        seconds={`${Math.round(elapsedMs / 1000)}s`}
        collapsed={collapsed}
        onToggle={() => setManualCollapsed(!collapsed)}
        toggleDisabled={thinking}
        label="Worked for"
        pill={false}
        chevronStyle="rightdown"
      />

      {!thinking && !collapsed && (
        <div className="gw-activity-steps mt-sm flex flex-col gap-md">
          {thought && (
            <div className="flex items-start gap-sm">
              <span className="mt-[7px] flex size-[6px] shrink-0 rounded-full bg-text-tertiary" aria-hidden />
              <p className="m-0 min-w-0 text-small text-text-tertiary">{thought}</p>
            </div>
          )}
          {toolsDone > 0 && (
            <div className="flex flex-col gap-sm">
              <p className="m-0 text-small text-text-tertiary">{toolsLabel}</p>
              {tools.map((tool, i) => {
                if (i > toolsDone) return null
                const done = i < toolsDone
                return (
                  <div key={tool} className="gw-flow__in flex items-start gap-sm pl-md">
                    <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
                      {done ? <ActivityStepTick /> : <ActivityDots />}
                    </span>
                    <p className="m-0 min-w-0 text-small text-text-tertiary">{tool}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-md flex flex-col gap-md">
        {summaryIn && summary && (
          <p className="gw-flow__in m-0 text-body text-text-primary">{summary}</p>
        )}
        {bodyIn && body}
        {bodyIn && footnote && (
          <p className="gw-flow__in m-0 text-body text-text-primary">{footnote}</p>
        )}
      </div>
    </div>
  )
}
