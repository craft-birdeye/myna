/**
 * Simulation tab for the Ghostwriter (review response agent).
 *
 * Three moves, in order:
 *   1. The agent writes its own test cases from the plan it already agreed to — one per rule
 *      it can be held to, plus the edge cases those rules leave open.
 *   2. "Run all" walks them and marks each pass or fail.
 *   3. A failing row opens the whole run — what it read, where it branched, what it wrote —
 *      so the failure points at a line of the plan rather than at a vague bad answer.
 *
 * Everything is scripted from `ghostwriterSimulation.ts`; there is no model here.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SIMULATION_COPY,
  SIMULATION_GENERATE_STEPS,
  SIMULATION_LOCATIONS,
  SIMULATION_RATINGS,
  SIMULATION_SOURCES,
  SIMULATION_TEST_CASES,
  SIMULATION_TIMING,
  type SimActionKind,
  type SimTestCase,
} from '../../data/ghostwriterSimulation'
import { Chip } from '../Chip/Chip'
import { DataTable } from '../DataTable/DataTable'
import { FormDrawer } from '../FormDrawer/FormDrawer'
import { Icon } from '../Icon/Icon'
import { StarRating } from '../ReviewCard/ReviewCard'
import type { Column, ChipVariant } from '../index'
import type {
  GhostwriterSimulationProps,
  SimulationPhase,
  SimulationRow,
} from './GhostwriterSimulation.types'

/** Purple sparkle used on the generate affordance — matches the Ghostwriter's other AI moments. */
function Sparkle({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    </svg>
  )
}

/** Rotates in place — centred at 8,8 of a 16×16 box, so it spins rather than orbits. */
function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`shrink-0 gw-flow__spinner ${className}`} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const RESULT_CHIP: Record<'pass' | 'fail', { label: string; variant: ChipVariant }> = {
  pass: { label: 'Passed', variant: 'success' },
  fail: { label: 'Failed', variant: 'danger' },
}

/** What the agent did with the review, as a chip in the detail panel. */
const ACTION_LABEL: Record<SimActionKind, string> = {
  posted: 'Posted',
  held: 'Held',
  assigned: 'Assigned',
  skipped: 'Skipped',
}

function ResultCell({ row }: { row: SimulationRow }) {
  if (row.busy) {
    return (
      <span className="flex items-center gap-sm text-small text-text-secondary">
        <Spinner className="text-primary" />
        {SIMULATION_COPY.running}
      </span>
    )
  }
  if (row.status === 'not-run') {
    return <span className="text-small text-text-tertiary">Not run</span>
  }
  const chip = RESULT_CHIP[row.status]
  return <Chip label={chip.label} variant={chip.variant} showDot />
}

/**
 * Right-side detail for one test — the scenario it was fed, the path the agent took, and the
 * reply it produced. The warn steps are where a failure actually happened.
 */
function SimulationDetailPanel({ test, onClose }: { test: SimulationRow; onClose: () => void }) {
  const failed = test.status === 'fail'

  /* Portalled to <body>: this panel renders inside the shell's `z-10` section, which is its
     own stacking context — a plain `fixed` overlay there still paints under the `z-30`
     pinned tab bar no matter how high its own z-index goes. */
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <aside className="absolute right-2 top-2 flex h-[calc(100%-16px)] w-[600px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal">
        {/* Header */}
        <div className="flex shrink-0 items-start gap-md border-b border-border px-lg py-md">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-sm">
              <h2 className="m-0 min-w-0 truncate text-h3 text-text-primary">{test.name}</h2>
              {test.status !== 'not-run' && (
                <Chip label={RESULT_CHIP[test.status].label} variant={RESULT_CHIP[test.status].variant} showDot />
              )}
            </div>
            <p className="m-0 mt-xs text-small text-text-tertiary">{test.rule}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="scrollbar-light flex min-h-0 flex-1 flex-col gap-2xl overflow-y-auto px-lg py-lg">
          {/* Verdict — the one line that says why this passed or failed. */}
          <div
            className={`flex items-start gap-sm rounded-sm border px-md py-sm ${
              failed ? 'border-[#f3cfcb] bg-[#fef6f5]' : 'border-[#cfe8d0] bg-[#f1faf0]'
            }`}
          >
            <Icon
              name={failed ? 'error' : 'check_circle'}
              size={18}
              className={`mt-px shrink-0 ${failed ? 'text-chip-danger-text' : 'text-chip-success-text'}`}
            />
            <p className="m-0 min-w-0 flex-1 text-body text-text-primary">{test.verdict}</p>
          </div>

          {/* The review it was given */}
          <section className="flex flex-col gap-sm">
            <h3 className="m-0 text-small text-text-tertiary">Scenario</h3>
            <div className="rounded-sm border border-border px-md py-md">
              <div className="flex flex-wrap items-center gap-sm">
                <StarRating rating={test.variables.rating} size={16} />
                <span className="text-small text-text-secondary">{test.variables.source}</span>
                <span className="text-small text-text-tertiary">·</span>
                <span className="text-small text-text-secondary">{test.variables.location}</span>
                <span className="text-small text-text-tertiary">·</span>
                <span className="text-small text-text-secondary">{test.variables.postedAt}</span>
              </div>
              <p className="m-0 mt-sm text-body text-text-primary">{test.scenario}</p>
            </div>
          </section>

          {/* Expected behaviour */}
          <section className="flex flex-col gap-sm">
            <h3 className="m-0 text-small text-text-tertiary">Expected</h3>
            <p className="m-0 text-body text-text-primary">{test.expected}</p>
          </section>

          {/* The run */}
          <section className="flex flex-col gap-md">
            <h3 className="m-0 text-small text-text-tertiary">What the agent did</h3>
            <ol className="m-0 flex list-none flex-col gap-0 p-0">
              {test.steps.map((step, i) => {
                const last = i === test.steps.length - 1
                return (
                  <li key={step.label} className="relative flex gap-md">
                    {!last && <span className="absolute bottom-0 left-[9px] top-[22px] w-px bg-border" aria-hidden />}
                    <span
                      className={`relative z-10 mt-[3px] flex size-[18px] shrink-0 items-center justify-center rounded-full ${
                        step.status === 'warn' ? 'bg-chip-danger-bg' : 'bg-chip-success-bg'
                      }`}
                    >
                      <Icon
                        name={step.status === 'warn' ? 'priority_high' : 'check'}
                        size={12}
                        className={step.status === 'warn' ? 'text-chip-danger-text' : 'text-chip-success-text'}
                      />
                    </span>
                    <div className={`min-w-0 flex-1 ${last ? '' : 'pb-lg'}`}>
                      <p className="m-0 text-body text-text-primary">{step.label}</p>
                      <p
                        className={`m-0 mt-xs text-small ${
                          step.status === 'warn' ? 'text-chip-danger-text' : 'text-text-secondary'
                        }`}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          {/* Outcome + the reply, when there is one */}
          <section className="flex flex-col gap-sm">
            <h3 className="m-0 text-small text-text-tertiary">Outcome</h3>
            <div className="flex flex-wrap items-center gap-sm">
              <Chip
                label={ACTION_LABEL[test.actual.kind]}
                variant={test.actual.kind === 'posted' ? 'info' : 'neutral'}
              />
              <span className="text-body text-text-secondary">{test.actual.summary}</span>
            </div>
            {test.actual.reply ? (
              <div className="mt-xs rounded-sm border border-border bg-surface-muted px-md py-md">
                <p className="m-0 text-body text-text-primary">{test.actual.reply}</p>
              </div>
            ) : (
              <p className="m-0 mt-xs text-small text-text-tertiary">No reply was written.</p>
            )}
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

export function GhostwriterSimulation({ active = true, onNotify, className = '' }: GhostwriterSimulationProps) {
  const [phase, setPhase] = useState<SimulationPhase>('empty')
  const [rows, setRows] = useState<SimulationRow[]>([])
  const [generateStep, setGenerateStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  /** Every pending timer, so unmounting mid-run doesn't set state on a dead component. */
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    },
    [],
  )

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const toRow = (test: SimTestCase): SimulationRow => ({ ...test, status: 'not-run', busy: false })

  /** The agent reads the plan, then the tests land all at once. */
  const generate = () => {
    setPhase('generating')
    setGenerateStep(0)
    SIMULATION_GENERATE_STEPS.forEach((_, i) => {
      after(SIMULATION_TIMING.generateStep * (i + 1), () => setGenerateStep(i + 1))
    })
    after(
      SIMULATION_TIMING.generateStep * SIMULATION_GENERATE_STEPS.length + SIMULATION_TIMING.generateSettle,
      () => {
        setRows(SIMULATION_TEST_CASES.map(toRow))
        setPhase('ready')
        onNotify?.(`${SIMULATION_TEST_CASES.length} tests written from your plan`)
      },
    )
  }

  /** Walk the given ids in order, resolving one at a time. */
  const runIds = (ids: string[]) => {
    if (!ids.length) return
    setRunning(true)
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, busy: true, status: 'not-run' } : r)))

    ids.forEach((id, i) => {
      after(SIMULATION_TIMING.runStep * (i + 1), () => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, busy: false, status: r.result } : r)))
      })
    })

    after(SIMULATION_TIMING.runStep * (ids.length + 1), () => {
      setRunning(false)
      const failed = SIMULATION_TEST_CASES.filter((t) => ids.includes(t.id) && t.result === 'fail').length
      onNotify?.(
        failed === 0
          ? `All ${ids.length} tests passed`
          : `${ids.length - failed} passed, ${failed} failed`,
      )
    })
  }

  const runAll = () => runIds(rows.map((r) => r.id))

  const addTest = (values: Record<string, string>) => {
    const rating = Number((values.rating ?? '5 stars').charAt(0))
    const manual: SimulationRow = {
      id: `sim-manual-${Date.now()}`,
      name: values.name?.trim() || 'Untitled test',
      scenario: values.scenario?.trim() ?? '',
      variables: {
        rating,
        source: values.source ?? 'Google',
        location: values.location ?? 'All locations',
        postedAt: 'Not run yet',
      },
      expected: values.expected?.trim() ?? '',
      rule: 'Added by you',
      /* Manual tests have no scripted run behind them — they pass, and the detail panel says
         so plainly rather than inventing a transcript the agent never produced. */
      result: 'pass',
      steps: [
        { status: 'ok', label: 'Trigger matched', detail: `New review on ${values.source ?? 'Google'}.` },
        { status: 'ok', label: 'Spam gate', detail: 'Passed the gate.' },
        { status: 'ok', label: 'Rating read', detail: `${rating} star${rating === 1 ? '' : 's'}.` },
        { status: 'ok', label: 'Reply drafted', detail: 'Written against your guidelines.' },
      ],
      actual: {
        kind: rating <= 2 ? 'held' : 'posted',
        summary: rating <= 2 ? 'Waiting for approval — not posted' : `Posted to ${values.source ?? 'Google'} automatically`,
      },
      verdict: 'Matched what you expected.',
      status: 'not-run',
      busy: false,
    }
    setRows((prev) => [...prev, manual])
    setPhase('ready')
    setAddOpen(false)
    onNotify?.('Test added')
  }

  const selected = rows.find((r) => r.id === selectedId) ?? null

  const summary = useMemo(() => {
    const passed = rows.filter((r) => r.status === 'pass').length
    const failed = rows.filter((r) => r.status === 'fail').length
    return { total: rows.length, passed, failed, ran: passed + failed }
  }, [rows])

  const columns: Column<SimulationRow>[] = [
    {
      key: 'name',
      label: 'Test',
      width: 230,
      truncate: false,
      render: (_v, row) => (
        <div className="min-w-0">
          <p className="m-0 truncate text-body text-text-primary">{row.name}</p>
          <p className="m-0 truncate text-small text-text-tertiary">{row.rule}</p>
        </div>
      ),
    },
    {
      key: 'scenario',
      label: 'Scenario',
      width: 300,
      truncate: false,
      render: (_v, row) => (
        <div className="flex min-w-0 items-center gap-sm">
          <StarRating rating={row.variables.rating} size={14} />
          <span className="min-w-0 flex-1 truncate text-body text-text-secondary">{row.scenario}</span>
        </div>
      ),
    },
    { key: 'expected', label: 'Expected', width: 290 },
    {
      key: 'status',
      label: 'Result',
      width: 130,
      truncate: false,
      render: (_v, row) => <ResultCell row={row} />,
    },
  ]

  return (
    <div
      className={`min-h-0 w-full flex-1 justify-center overflow-y-auto scrollbar-subtle ${
        active ? 'flex' : 'hidden'
      } ${className}`}
    >
      <div className="flex w-full max-w-[1080px] flex-col px-2xl py-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-lg">
          <div className="min-w-0">
            <h2 className="m-0 text-h3 text-text-primary">{SIMULATION_COPY.title}</h2>
            <p className="m-0 mt-xs max-w-[560px] text-body text-text-secondary">{SIMULATION_COPY.subtitle}</p>
          </div>

          {phase === 'ready' && (
            <div className="flex shrink-0 items-center gap-sm">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
              >
                <Icon name="add" size={18} />
                {SIMULATION_COPY.addTest}
              </button>
              <button
                type="button"
                onClick={runAll}
                disabled={running}
                className={`flex h-9 items-center gap-sm rounded-sm px-lg text-body transition-colors ${
                  running
                    ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                    : 'bg-primary text-white hover:bg-primary-hover'
                }`}
              >
                {running ? <Spinner /> : <Icon name="play_arrow" size={18} />}
                {running ? SIMULATION_COPY.running : summary.ran ? SIMULATION_COPY.rerun : SIMULATION_COPY.runAll}
              </button>
            </div>
          )}
        </div>

        {/* Empty — the agent offers to write the tests itself. */}
        {phase === 'empty' && (
          <div className="mt-3xl flex flex-col items-center gap-lg rounded-lg border border-dashed border-border-strong px-2xl py-4xl text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-ai-summary text-ai-brand">
              <Sparkle size={20} />
            </span>
            <div className="flex flex-col gap-xs">
              <p className="m-0 text-body text-text-primary">{SIMULATION_COPY.emptyTitle}</p>
              <p className="m-0 max-w-[480px] text-small text-text-secondary">{SIMULATION_COPY.emptyBody}</p>
            </div>
            <div className="flex items-center gap-sm">
              <button
                type="button"
                onClick={generate}
                className="flex h-9 items-center gap-sm rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                <Sparkle />
                {SIMULATION_COPY.generate}
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
              >
                {SIMULATION_COPY.addTest}
              </button>
            </div>
          </div>
        )}

        {/* Generating — the agent reading its own plan. */}
        {phase === 'generating' && (
          <div className="mt-3xl flex flex-col gap-md rounded-lg border border-border px-xl py-xl">
            <div className="flex items-center gap-sm">
              <span className="flex size-6 items-center justify-center rounded-full bg-ai-summary text-ai-brand">
                <Sparkle size={13} />
              </span>
              <span className="text-body text-text-primary">{SIMULATION_COPY.generating}</span>
            </div>
            <div className="flex flex-col gap-sm pl-[calc(theme(spacing.sm)+24px)]">
              {SIMULATION_GENERATE_STEPS.map((step, i) => {
                const done = i < generateStep
                const active = i === generateStep
                if (!done && !active) return null
                return (
                  <div key={step} className="gw-flow__in flex items-center gap-sm">
                    {done ? (
                      <Icon name="check" size={14} className="shrink-0 text-chip-success-text" />
                    ) : (
                      <Spinner size={14} className="text-text-tertiary" />
                    )}
                    <span className={`text-small ${done ? 'text-text-tertiary' : 'text-text-primary'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tests */}
        {phase === 'ready' && (
          <>
            <div className="mt-lg flex shrink-0 items-center gap-md">
              <span className="text-small text-text-secondary">
                {summary.total} test{summary.total === 1 ? '' : 's'}
              </span>
              {summary.ran > 0 ? (
                <>
                  <span className="text-small text-text-tertiary">·</span>
                  <span className="text-small text-chip-success-text">{summary.passed} passed</span>
                  {summary.failed > 0 && (
                    <>
                      <span className="text-small text-text-tertiary">·</span>
                      <span className="text-small text-chip-danger-text">{summary.failed} failed</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="text-small text-text-tertiary">·</span>
                  <span className="text-small text-text-tertiary">{SIMULATION_COPY.notRunHint}</span>
                </>
              )}
            </div>

            <div className="mt-md">
              <DataTable<SimulationRow>
                columns={columns}
                data={rows}
                rowHeight={56}
                onRowClick={(row) => {
                  // A row that has never run has no result to show yet — run it instead.
                  if (row.status === 'not-run' && !row.busy) {
                    runIds([row.id])
                    return
                  }
                  if (!row.busy) setSelectedId(row.id)
                }}
                rowActions={[
                  {
                    icon: 'play_arrow',
                    label: 'Run this test',
                    onClick: (row) => runIds([row.id]),
                    visible: (row) => !row.busy,
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>

      {active && selected && <SimulationDetailPanel test={selected} onClose={() => setSelectedId(null)} />}

      {/* Portalled for the same stacking-context reason as the detail panel. */}
      {createPortal(
      <FormDrawer
        open={active && addOpen}
        title={SIMULATION_COPY.drawerTitle}
        subtitle="Describe a review and what the agent should do with it."
        submitLabel={SIMULATION_COPY.drawerSubmit}
        requiredKeys={['name', 'scenario', 'expected']}
        initialValues={{ rating: '5 stars', source: 'Google', location: 'All locations' }}
        fields={[
          { key: 'name', label: 'Test name', type: 'text', placeholder: 'e.g. Refund request in a 3-star review' },
          {
            key: 'scenario',
            label: 'The review',
            type: 'textarea',
            placeholder: 'Write the review the way a customer would.',
            charLimit: 600,
          },
          { key: 'rating', label: 'Rating', type: 'select', options: [...SIMULATION_RATINGS] },
          { key: 'source', label: 'Source', type: 'select', options: [...SIMULATION_SOURCES] },
          { key: 'location', label: 'Location', type: 'select', options: [...SIMULATION_LOCATIONS] },
          {
            key: 'expected',
            label: 'Expected behaviour',
            type: 'textarea',
            placeholder: 'What should the agent do with it?',
            charLimit: 300,
          },
        ]}
        onClose={() => setAddOpen(false)}
        onSubmit={addTest}
      />,
      document.body,
      )}
    </div>
  )
}
