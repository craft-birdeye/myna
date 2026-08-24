/**
 * TestRunPanel — "Test details" RHS shown while a workflow test run plays out.
 *
 * Mirrors the canvas node cards as a stepper: each row carries the node's own type glyph and
 * title, plus collapsible Task output / Tool / View inputs. Step state (pending → running → done)
 * comes from `useTestRun`, the same source that drives the canvas highlighting, so the two
 * surfaces animate in lockstep. The active row scrolls itself into view as the run advances.
 *
 * Shell metrics match the workflow canvas's node-config RHS (450px, 12px radius).
 */
import { useEffect, useRef, useState } from 'react'
import type { TestRunStep } from '../../data/testRunSteps'
import { Icon } from '../Icon/Icon'
import { FieldList, TYPE_META } from '../RunDetailsPanel/RunDetailsPanel'
import type { TestRunPanelProps, TestRunStepStatus } from './TestRunPanel.types'

/**
 * Loading ring. Deliberately an SVG rather than the `progress_activity` Material glyph: a font
 * glyph sits off-centre inside its line-box, so `animate-spin` (which rotates about the box
 * centre) makes it orbit instead of spin. This circle is centred at 10,10 of a 20×20 box, so it
 * rotates exactly in place.
 */
function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={`block shrink-0 animate-spin ${className}`}
      aria-hidden
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path
        d="M18 10a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StatusGlyph({ status }: { status: TestRunStepStatus }) {
  if (status === 'done') {
    return (
      <Icon name="check_circle" size={20} fill className="relative z-10 shrink-0 text-accent-positive" />
    )
  }
  if (status === 'running') {
    return <Spinner size={20} className="relative z-10 text-[#1976d2]" />
  }
  return (
    <Icon name="radio_button_unchecked" size={20} className="relative z-10 shrink-0 text-text-tertiary" />
  )
}

function TestRunStepRow({
  step,
  status,
  isLast,
  taskLabel,
}: {
  step: TestRunStep
  status: TestRunStepStatus
  isLast: boolean
  taskLabel: string
}) {
  const [open, setOpen] = useState(status !== 'pending')
  const [outputOpen, setOutputOpen] = useState(false)
  const [toolOpen, setToolOpen] = useState(true)
  const [inputsOpen, setInputsOpen] = useState(false)
  const meta = TYPE_META[step.type]
  const stepLabel = step.type === 'task' ? taskLabel : meta.label

  // Follow the run: expand as a step starts, collapse again once it is behind us.
  useEffect(() => {
    if (status === 'running') setOpen(true)
  }, [status])

  return (
    <div className={`relative flex gap-md ${status === 'pending' ? 'opacity-50' : ''}`}>
      {!isLast && <div className="absolute bottom-0 left-[9px] top-[24px] w-px bg-border" aria-hidden />}
      <StatusGlyph status={status} />

      <div className="min-w-0 flex-1 pb-xl">
        <div className="flex items-center gap-xs text-small text-text-tertiary">
          <Icon name={meta.icon} size={16} className={`shrink-0 ${meta.colorClass}`} />
          {stepLabel}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-xs flex w-full items-center gap-sm text-left"
        >
          <span className="min-w-0 flex-1 truncate text-body text-text-primary">
            {step.stepNumber}. {step.title}
          </span>
          <Icon
            name={open ? 'expand_less' : 'expand_more'}
            size={20}
            className="shrink-0 text-text-icon"
          />
        </button>

        {open && status === 'running' && (
          <div className="mt-sm flex items-center gap-xs text-small text-text-tertiary">
            <Spinner size={16} />
            Running…
          </div>
        )}

        {open && status === 'done' && (
          <div className="mt-sm flex flex-col gap-sm">
            {step.tool && (
              <div>
                <button
                  type="button"
                  onClick={() => setToolOpen((v) => !v)}
                  className="flex min-w-0 items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon
                    name={toolOpen ? 'expand_more' : 'chevron_right'}
                    size={16}
                    className="shrink-0"
                  />
                  <span className="truncate">{`Tool : ${step.tool.name}`}</span>
                </button>
                {toolOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.tool.properties} />
                  </div>
                )}
              </div>
            )}

            {step.output && (
              <div>
                <button
                  type="button"
                  onClick={() => setOutputOpen((v) => !v)}
                  className="flex items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon
                    name={outputOpen ? 'expand_more' : 'chevron_right'}
                    size={16}
                    className="shrink-0"
                  />
                  {step.type === 'branch' ? 'Branch output' : `${taskLabel} output`}
                </button>
                {outputOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.output} />
                  </div>
                )}
              </div>
            )}

            {step.inputs && (
              <div>
                <button
                  type="button"
                  onClick={() => setInputsOpen((v) => !v)}
                  className="flex items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon
                    name={inputsOpen ? 'expand_more' : 'chevron_right'}
                    size={16}
                    className="shrink-0"
                  />
                  View inputs
                </button>
                {inputsOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.inputs} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TestRunPanel({
  steps,
  stepStatuses,
  activeIndex,
  status,
  onExit,
  taskLabel = 'Task',
}: TestRunPanelProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the panel to keep the executing step in view.
  useEffect(() => {
    if (activeIndex < 0) return
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  return (
    <div className="flex h-full w-[450px] flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex min-h-[60px] shrink-0 items-center justify-between p-md">
        <span className="text-h3 text-text-primary">Test details</span>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit test"
          className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-md pt-xs">
        {steps.map((step, i) => (
          <div key={step.id} ref={i === activeIndex ? activeRef : undefined}>
            <TestRunStepRow
              step={step}
              status={stepStatuses[i] ?? 'pending'}
              isLast={i === steps.length - 1 && status !== 'complete'}
              taskLabel={taskLabel}
            />
          </div>
        ))}

        {status === 'complete' && (
          <div className="flex items-center gap-md pb-md">
            <Icon name="check_circle" size={20} fill className="shrink-0 text-accent-positive" />
            <span className="text-small text-text-tertiary">Completed</span>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-md">
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 w-full items-center justify-center rounded-sm bg-primary text-body text-white transition-colors hover:bg-primary-hover"
        >
          Exit test
        </button>
      </div>
    </div>
  )
}
