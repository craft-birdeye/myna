import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import cueCreateWithAiIllustration from '@icons/Cue_Create with AI.svg'
import { Icon } from '../Icon/Icon'
import {
  WORKFLOW_COACH_STEPS,
  type WorkflowCoachStep,
  type WorkflowCoachTourProps,
} from './WorkflowCoachTour.types'

const CARD_WIDTH = 400
const GAP = 14
const PADDING = 16

function measureAnchors(ids: string[]): DOMRect | null {
  const rects = ids
    .map((id) => document.querySelector(`[data-tour-id="${id}"]`) as HTMLElement | null)
    .filter((el): el is HTMLElement => !!el)
    .map((el) => el.getBoundingClientRect())
  if (rects.length === 0) return null
  const left = Math.min(...rects.map((r) => r.left))
  const top = Math.min(...rects.map((r) => r.top))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return new DOMRect(left, top, right - left, bottom - top)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Create with AI step cue art from Figma (node 15862:2500). */
function CreateWithAiCoachIllustration() {
  return (
    <div className="mt-lg flex justify-center">
      <img
        src={cueCreateWithAiIllustration}
        alt=""
        className="block h-auto w-[85%]"
        aria-hidden
      />
    </div>
  )
}

/** Simplified chat + canvas preview used inside every coach card (matches Figma mock). */
function CoachIllustration() {
  return (
    <div className="mt-lg overflow-hidden rounded-md border border-border bg-surface-selected">
      <div className="flex h-[168px]">
        <div className="flex w-[48%] flex-col gap-sm border-r border-border bg-surface p-md">
          <div className="h-2 w-4/5 rounded-sm bg-surface-l2" />
          <div className="h-2 w-3/5 rounded-sm bg-surface-l2" />
          <div className="mt-xs flex flex-col gap-xs">
            <div className="h-5 w-full rounded-full border border-border bg-surface" />
            <div className="h-5 w-[90%] rounded-full border border-border bg-surface" />
            <div className="h-5 w-[80%] rounded-full border border-border bg-surface" />
          </div>
          <div className="mt-auto flex h-7 items-center rounded-sm border border-border bg-surface px-sm">
            <div className="h-2 w-2/3 rounded-sm bg-surface-l2" />
          </div>
        </div>
        <div
          className="relative flex-1 p-md"
          style={{
            backgroundImage: 'radial-gradient(circle, #c8cdd8 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        >
          <div className="absolute left-md top-md flex items-center gap-xs rounded-sm border border-border bg-surface px-sm py-xs shadow-dropdown">
            <span className="size-3 rounded-full bg-primary/30" />
            <span className="h-2 w-10 rounded-sm bg-surface-l2" />
          </div>
          <div className="absolute bottom-md left-md right-md rounded-sm border border-chip-warning-text/40 bg-surface p-sm shadow-dropdown">
            <div className="mb-xs flex items-center gap-xs">
              <span className="size-3 rounded-full bg-chip-warning-text" />
              <span className="h-2 w-12 rounded-sm bg-surface-l2" />
            </div>
            <div className="h-2 w-full rounded-sm bg-surface-l2" />
            <div className="mt-xs h-2 w-2/3 rounded-sm bg-surface-l2" />
          </div>
        </div>
      </div>
    </div>
  )
}

function positionCard(
  anchor: DOMRect,
  placement: WorkflowCoachStep['placement'],
  cardHeight: number,
): { top: number; left: number; caretOffset: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (placement === 'right') {
    const left = clamp(anchor.right + GAP, PADDING, vw - CARD_WIDTH - PADDING)
    const idealTop = anchor.top + anchor.height / 2 - cardHeight / 2
    const top = clamp(idealTop, PADDING, Math.max(PADDING, vh - cardHeight - PADDING))
    const caretOffset = clamp(anchor.top + anchor.height / 2 - top, 24, cardHeight - 24)
    return { top, left, caretOffset }
  }

  const idealLeft = anchor.left + anchor.width / 2 - CARD_WIDTH / 2
  const left = clamp(idealLeft, PADDING, vw - CARD_WIDTH - PADDING)
  const top = clamp(anchor.bottom + GAP, PADDING, Math.max(PADDING, vh - cardHeight - PADDING))
  const caretOffset = clamp(anchor.left + anchor.width / 2 - left, 24, CARD_WIDTH - 24)
  return { top, left, caretOffset }
}

/**
 * First-time workflow editor coach queue — six anchored cards (Create with AI →
 * Trigger → Procedures → Action & controls → Run test (Preview on front desk) → Activate).
 * Opens when `open` is true; dismiss with Done on the last step (or Next through the queue).
 */
export function WorkflowCoachTour({
  open,
  onClose,
  steps = WORKFLOW_COACH_STEPS,
}: WorkflowCoachTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [layout, setLayout] = useState<{
    top: number
    left: number
    caretOffset: number
    highlight: DOMRect
  } | null>(null)
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null)

  const step = steps[stepIndex]
  const isLast = stepIndex >= steps.length - 1

  useEffect(() => {
    if (open) setStepIndex(0)
  }, [open])

  useLayoutEffect(() => {
    if (!open || !step) {
      setLayout(null)
      return
    }

    function update() {
      const highlight = measureAnchors(step.anchorIds)
      if (!highlight) {
        setLayout(null)
        return
      }
      const cardHeight = cardEl?.offsetHeight ?? 420
      const pos = positionCard(highlight, step.placement, cardHeight)
      setLayout({ ...pos, highlight })
    }

    update()
    const raf = requestAnimationFrame(update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, step, stepIndex, cardEl])

  if (!open || !step) return null

  function handleNext() {
    if (isLast) {
      onClose()
      return
    }
    setStepIndex((i) => i + 1)
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1400]" aria-live="polite">
      {layout && (
        <div
          className="pointer-events-none absolute rounded-md ring-2 ring-primary ring-offset-2 ring-offset-transparent"
          style={{
            top: layout.highlight.top - 4,
            left: layout.highlight.left - 4,
            width: layout.highlight.width + 8,
            height: layout.highlight.height + 8,
          }}
        />
      )}

      <div
        ref={setCardEl}
        role="dialog"
        aria-modal="false"
        aria-labelledby="workflow-coach-title"
        className="pointer-events-auto absolute w-[400px] rounded-lg bg-surface p-xl shadow-modal"
        style={
          layout
            ? { top: layout.top, left: layout.left }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        {layout && step.placement === 'right' && (
          <span
            aria-hidden
            className="absolute left-0 top-0 -translate-x-full -translate-y-1/2 border-y-[10px] border-r-[10px] border-y-transparent border-r-surface"
            style={{ top: layout.caretOffset }}
          />
        )}
        {layout && step.placement === 'bottom' && (
          <span
            aria-hidden
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-full border-x-[10px] border-b-[10px] border-x-transparent border-b-surface"
            style={{ left: layout.caretOffset }}
          />
        )}

        <button
          type="button"
          aria-label="Close tour"
          onClick={onClose}
          className="absolute right-md top-md flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={18} />
        </button>

        <h2 id="workflow-coach-title" className="m-0 pr-2xl text-h3 text-text-primary">
          {step.title}
        </h2>
        <p className="m-0 mt-sm text-body text-text-secondary">{step.description}</p>

        {step.id === 'create-with-ai' ? (
          <CreateWithAiCoachIllustration />
        ) : step.id === 'procedures' ? null : (
          <CoachIllustration />
        )}

        <div className={`flex items-center justify-between gap-md ${step.id === 'procedures' ? 'mt-lg' : 'mt-xl'}`}>
          <div className="flex items-center gap-sm" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`size-2 rounded-full ${i === stepIndex ? 'bg-primary' : 'bg-border-strong'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
