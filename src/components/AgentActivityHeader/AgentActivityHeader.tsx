/**
 * "Agent activity" thoughts header — shared by the Ghostwriter canvas scripted run and the
 * create-landing thinking panels so both get the same treatment.
 *
 * Running:  ⠿ dot-grid loader + shimmering label + live elapsed
 * Complete: ✓ green tick + grey pill + "· N steps · 1.8s"
 *
 * `pill={false}` (Jay & Robin's "Worked for" header) drops the icon, the pill background and
 * the left inset entirely — just the label/seconds/chevron, flush and centered on the
 * surrounding chat text.
 */

/** 3×3 dot grid that ripples diagonally while work is in flight. */
export function ActivityDots() {
  return (
    <span className="gw-dots" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => <span key={i} />)}
    </span>
  )
}

/** Plain grey tick for a completed step row. */
export function ActivityStepTick() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5 5.5 10.5 11.5 4"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DoneCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="gw-flow__check" aria-hidden>
      <path
        d="M2.5 7.5 5.5 10.5 11.5 4"
        stroke="#15803d"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface AgentActivityHeaderProps {
  /** Work still in flight — shows the dot loader + shimmer instead of the tick + pill. */
  running: boolean
  /** Step count shown once complete. Omitted from the meta when 0. */
  steps?: number
  /** Elapsed seconds, e.g. "1.8s". Live while running, frozen once complete. */
  seconds: string
  collapsed: boolean
  onToggle: () => void
  /** Disable the toggle while running, if the body has nothing to show yet. */
  toggleDisabled?: boolean
  label?: string
  /** Grey pill background, left inset, and the running-dots/done-check icon — off for Jay &
   *  Robin's "Worked for" header, which reads as plain chat text (flush with the paragraphs
   *  around it, centered on that text) rather than its own contained pill control. */
  pill?: boolean
  /** 'updown' (default): expanded points up, collapsed points down — the original Ghostwriter
   *  beats. 'rightdown': expanded points down, collapsed points sideways — the disclosure-
   *  triangle convention Jay & Robin's "Worked for" header uses. */
  chevronStyle?: 'updown' | 'rightdown'
}

export function AgentActivityHeader({
  running,
  steps = 0,
  seconds,
  collapsed,
  onToggle,
  toggleDisabled = false,
  label = 'Agent activity',
  pill = true,
  chevronStyle = 'updown',
}: AgentActivityHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={toggleDisabled}
      aria-expanded={!collapsed}
      className={`gw-activity-head self-start${
        !pill
          ? ' gw-activity-head--flush items-center'
          : running
            ? ''
            : ' gw-activity-head--done'
      }`}
    >
      {pill && (
        <span className="flex size-4 shrink-0 items-center justify-center">
          {running ? <ActivityDots /> : <DoneCheck />}
        </span>
      )}
      <span className={`text-[12px] leading-5 ${running ? 'gw-shimmer' : 'text-text-primary'}`}>
        {label}
      </span>
      <span className="shrink-0 text-[12px] leading-5 text-text-tertiary">
        {running || !steps ? seconds : `· ${steps} steps · ${seconds}`}
      </span>
      <span
        className={`gw-activity-chevron${
          chevronStyle === 'rightdown'
            ? collapsed ? ' gw-activity-chevron--sideways' : ' gw-activity-chevron--down'
            : collapsed ? ' gw-activity-chevron--collapsed' : ''
        }`}
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
  )
}
