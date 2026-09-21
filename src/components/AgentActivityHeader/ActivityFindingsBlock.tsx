import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { READING_TIMING } from '../../data/ghostwriterReadingBlock'
import { ActivityDots, ActivityStepTick, AgentActivityHeader } from './AgentActivityHeader'

/** Green ring + tick — marks the read complete, matching the reference's ⊘ glyph. */
function RingCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="gw-flow__check" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="#15803d" strokeWidth="1.4" />
      <path d="M5.2 8.2 7 10l3.8-4" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export interface ActivityFindingsBlockProps {
  label: string
  steps: string[]
  /**
   * The finding itself. Reads as agent speech, so it carries the same `text-text-primary`
   * as the reply paragraphs around the block — it used to be grey when it was only a
   * lead-in above a bordered body, but the beats now end on their prose.
   */
  summary?: string
  /** The bordered body — a table, a guideline list, etc. Rendered once its beat arrives. */
  body?: ReactNode
  /** Omit for a beat that ends on its body. */
  callout?: string
  /** `amber` = needs attention, `green` = settled, `red` = risk. */
  calloutTone?: 'amber' | 'green' | 'red'
  /** Prose after the callout — the resolution following a risk. Same tone as `summary`. */
  footnote?: string
  /** Extra ms before the callout, e.g. to cover a staggered body. */
  calloutExtraMs?: number
  onComplete?: () => void
}

/**
 * Shared scaffold for the Ghostwriter "reading the account" beats: a thinking pause, then a
 * collapsible step list, then a findings section (divider → summary → body → callout).
 *
 * Per the design there is no outer card stroke — the `body` carries the only border, and the
 * callout is a tinted fill. The chevron collapses the step list only; the findings stay put.
 */
export function ActivityFindingsBlock({
  label,
  steps,
  summary,
  body,
  callout,
  calloutTone = 'amber',
  footnote,
  calloutExtraMs = 0,
  onComplete,
}: ActivityFindingsBlockProps) {
  const [thinking, setThinking] = useState(true)
  const [stepsDone, setStepsDone] = useState(0)
  const [summaryIn, setSummaryIn] = useState(false)
  const [bodyIn, setBodyIn] = useState(false)
  const [calloutIn, setCalloutIn] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const doneRef = useRef(onComplete)
  doneRef.current = onComplete

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const allStepsDone = stepsDone >= steps.length

  useEffect(() => {
    const t = READING_TIMING
    const scale = reduceMotion ? 0.3 : 1
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms * scale))

    // Thinking beat first — no rows until the agent "comes back".
    at(t.thinking, () => setThinking(false))

    let cursor = t.thinking
    steps.forEach((_, i) => {
      cursor += t.stepInterval
      at(cursor, () => setStepsDone(i + 1))
    })

    cursor += t.summaryDelay
    at(cursor, () => setSummaryIn(true))

    cursor += t.tableDelay
    at(cursor, () => setBodyIn(true))

    cursor += t.calloutDelay + calloutExtraMs
    at(cursor, () => {
      setCalloutIn(true)
      doneRef.current?.()
    })

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion])

  /* Clock runs until every step has landed, then freezes for the header meta. */
  useEffect(() => {
    if (allStepsDone) return undefined
    const started = Date.now() - elapsedMs
    const id = setInterval(() => setElapsedMs(Date.now() - started), 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStepsDone])

  const calloutClass = calloutTone === 'green'
    ? 'bg-[#f0fdf4] text-[#2f7a3d]'
    : calloutTone === 'red'
      ? 'bg-[#fef2f2] text-[#d32f2f]'
      : 'bg-[#fef9e7] text-[#8a6d1f]'

  return (
    <div className="ml-3xl mt-sm flex max-w-full flex-col">
      {thinking ? (
        <div className="[&_.gw-activity-head]:px-0">
          <AgentActivityHeader
            running
            seconds={`${(elapsedMs / 1000).toFixed(1)}s`}
            collapsed={false}
            onToggle={() => {}}
            toggleDisabled
            label={label}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="gw-activity-head gw-activity-head--flush self-start"
        >
          <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
            {allStepsDone ? <RingCheck /> : <ActivityDots />}
          </span>
          <span className={`text-body ${allStepsDone ? 'text-text-primary' : 'gw-shimmer'}`}>
            {label}
          </span>
          <span
            className={`gw-activity-chevron mt-[3px] shrink-0${collapsed ? ' gw-activity-chevron--collapsed' : ''}`}
            aria-hidden
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 7.25 6 3.75l3.5 3.5" stroke="#717182" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}

      {/* The chevron collapses the step list only. */}
      {!thinking && !collapsed && (
        <div className="mt-sm flex flex-col gap-sm">
          {steps.map((step, i) => {
            if (i > stepsDone) return null
            const done = i < stepsDone
            return (
              <div key={step} className="gw-flow__in flex items-start gap-sm">
                <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
                  {done ? <ActivityStepTick /> : <ActivityDots />}
                </span>
                <p
                  className={`m-0 min-w-0 text-body transition-colors duration-200 ${
                    done ? 'text-text-tertiary' : 'text-text-primary'
                  }`}
                >
                  {step}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Findings — their own section, so they stay put when the steps collapse. */}
      {!thinking && (
        <div className="mt-md flex flex-col gap-md">
          {summaryIn && (
            <>
              <div className="gw-flow__rule h-px bg-border" />
              {summary && (
                <p className="gw-flow__in m-0 text-body text-text-primary">{summary}</p>
              )}
            </>
          )}
          {bodyIn && body}
          {calloutIn && callout && (
            <p className={`gw-flow__in m-0 rounded-sm px-lg py-md text-body ${calloutClass}`}>
              {callout}
            </p>
          )}
          {calloutIn && footnote && (
            <p className="gw-flow__in m-0 text-body text-text-primary">{footnote}</p>
          )}
        </div>
      )}
    </div>
  )
}
