import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SPAM_ALERT_MESSAGES,
  SPAM_ALERT_OPTIONS,
  SPAM_ALERT_STEPS,
  SPAM_ALERT_TIMING,
  SPAM_ALERT_VERDICT,
  type SpamAlertMessage,
  type SpamAlertOption,
} from '../../data/ghostwriterSpamAlertFlow'
import {
  ActivityDots,
  ActivityStepTick,
  AgentActivityHeader,
} from '../AgentActivityHeader/AgentActivityHeader'

function SparkleAvatar() {
  return (
    <span className="mt-[2px] flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ede9fe]" aria-hidden>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      </svg>
    </span>
  )
}

/** Reply text with an optional inline node link. */
function ReplyBody({
  msg,
  onOpenNode,
  underlineLink = false,
}: {
  msg: SpamAlertMessage
  onOpenNode?: (label: string) => void
  underlineLink?: boolean
}) {
  return (
    <>
      {msg.text}
      {msg.link && (
        <button
          type="button"
          onClick={() => onOpenNode?.(msg.link as string)}
          className={`text-text-action hover:underline ${underlineLink ? 'underline' : ''}`}
        >
          {msg.link}
        </button>
      )}
      {msg.textAfter}
    </>
  )
}

export interface GhostwriterSpamAlertFlowProps {
  prompt: string
  /** Fired once the option cards land, so the composer can unlock. */
  onDone?: () => void
  /** "Spam and abuse gate" link — selects that node on the canvas. */
  onOpenNode?: (label: string) => void
}

export function GhostwriterSpamAlertFlow({ prompt, onDone, onOpenNode }: GhostwriterSpamAlertFlowProps) {
  /** How far through the script we are: steps done, then verdict, messages, options. */
  const [cardIn, setCardIn] = useState(false)
  const [stepsDone, setStepsDone] = useState(0)
  const [verdictIn, setVerdictIn] = useState(false)
  const [messagesIn, setMessagesIn] = useState(0)
  const [optionsIn, setOptionsIn] = useState(false)
  const [chosen, setChosen] = useState<SpamAlertOption | null>(null)
  /** The cards fade out on pick, then unmount — the echoed user turn replaces them. */
  const [optionsGone, setOptionsGone] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  /** Live elapsed for the activity block; frozen once the last step lands. */
  const [elapsedMs, setElapsedMs] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    const t = SPAM_ALERT_TIMING
    const scale = reduceMotion ? 0.35 : 1
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms * scale))

    at(t.cardIn, () => setCardIn(true))

    let cursor = t.cardIn
    SPAM_ALERT_STEPS.forEach((_, i) => {
      cursor += t.stepInterval
      at(cursor, () => setStepsDone(i + 1))
    })

    cursor += t.verdictDelay
    at(cursor, () => setVerdictIn(true))

    SPAM_ALERT_MESSAGES.forEach((_, i) => {
      cursor += t.messageDelay
      at(cursor, () => setMessagesIn(i + 1))
    })

    cursor += t.optionsDelay
    at(cursor, () => {
      setOptionsIn(true)
      doneRef.current?.()
    })

    return () => timers.forEach(clearTimeout)
  }, [reduceMotion])

  const choose = (opt: SpamAlertOption) => {
    if (chosen) return
    setChosen(opt)
    setTimeout(() => setOptionsGone(true), reduceMotion ? 0 : 180)
  }

  const allStepsDone = stepsDone >= SPAM_ALERT_STEPS.length

  /* Ticks while the steps run, then stops — so the header keeps the final duration. */
  useEffect(() => {
    if (allStepsDone) return undefined
    const started = Date.now()
    const id = setInterval(() => setElapsedMs(Date.now() - started), 100)
    return () => clearInterval(id)
  }, [allStepsDone])

  const seconds = `${(elapsedMs / 1000).toFixed(1)}s`

  return (
    <div className="flex w-full flex-col gap-lg">
      {/* User's prompt */}
      <div className="flex justify-end">
        <p className="gw-flow__in m-0 max-w-[85%] rounded-lg bg-[#e9ebf0] px-md py-sm text-[12px] leading-5 text-text-primary">
          {prompt}
        </p>
      </div>

      {/* Agent activity — dot-grid loader + shimmer while running, grey pill once done */}
      {cardIn && (
        <div className="gw-flow__in flex flex-col">
          <AgentActivityHeader
            running={!allStepsDone}
            steps={SPAM_ALERT_STEPS.length}
            seconds={seconds}
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
          />

          {!collapsed && (
            <div className="gw-activity-steps mt-xs flex flex-col gap-sm py-xs">
              {SPAM_ALERT_STEPS.map((step, i) => {
                // One row beyond the done count is the active row; the rest stay hidden.
                if (i > stepsDone) return null
                const done = i < stepsDone
                return (
                  <div key={step.label} className="gw-flow__in flex items-start gap-sm">
                    <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
                      {done ? <ActivityStepTick /> : <ActivityDots />}
                    </span>
                    <p
                      className={`m-0 min-w-0 text-[12px] leading-5 transition-colors duration-200 ${
                        done ? 'text-text-tertiary' : 'text-text-primary'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                )
              })}

              {verdictIn && (
                <p className="gw-flow__in m-0 mt-xs text-[12px] leading-5 text-text-tertiary">
                  {SPAM_ALERT_VERDICT}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Replies */}
      {SPAM_ALERT_MESSAGES.slice(0, messagesIn).map((msg, i) => (
        <div key={i} className="flex items-start gap-sm">
          <SparkleAvatar />
          <p className="gw-flow__in m-0 min-w-0 flex-1 text-[12px] leading-5 text-text-primary">
            <ReplyBody msg={msg} onOpenNode={onOpenNode} />
          </p>
        </div>
      ))}

      {/* Option cards */}
      {optionsIn && !optionsGone && (
        <div className={`flex flex-col gap-sm pl-[32px] ${chosen ? 'gw-flow__out' : ''}`}>
          {SPAM_ALERT_OPTIONS.map((opt, i) => {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => choose(opt)}
                style={{ animationDelay: chosen ? undefined : `${i * 120}ms` }}
                className="gw-flow__in gw-flow__option flex flex-col items-start gap-xs rounded-lg border border-border bg-surface p-md text-left transition-[border-color,box-shadow,transform]"
              >
                <span className="flex items-center gap-sm">
                  <span className="text-[12px] leading-5 text-text-primary">{opt.title}</span>
                  {opt.recommended && (
                    <span className="rounded-sm bg-[#e8f1fc] px-sm text-[11px] leading-5 text-text-action">
                      Recommended
                    </span>
                  )}
                </span>
                <span className="text-[12px] leading-5 text-text-tertiary">{opt.description}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* The choice echoes as a user turn, then the reply lands */}
      {chosen && (
        <>
          <div className="flex justify-end">
            <p className="gw-flow__in m-0 max-w-[85%] rounded-lg bg-[#e9ebf0] px-md py-sm text-[12px] leading-5 text-text-primary">
              {chosen.title}
            </p>
          </div>
          <div className="flex items-start gap-sm">
            <SparkleAvatar />
            <p className="gw-flow__in m-0 min-w-0 flex-1 text-[12px] leading-5 text-text-primary">
              <ReplyBody msg={chosen.reply} onOpenNode={onOpenNode} underlineLink />
            </p>
          </div>
        </>
      )}
    </div>
  )
}
