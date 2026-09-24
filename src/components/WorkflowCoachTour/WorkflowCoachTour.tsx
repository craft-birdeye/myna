import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import coachCueAi from '@icons/Coach cues/AI.svg'
import coachCueTrigger from '@icons/Coach cues/Trigger.svg'
import coachCueProcedures from '@icons/Coach cues/Procedures.svg'
import coachCueActions from '@icons/Coach cues/Actions.svg'
import coachCueControls from '@icons/Coach cues/Controls.svg'
import coachCueRunTest from '@icons/Coach cues/Run test.svg'
import coachCueActivate from '@icons/Coach cues/Activate.svg'
import { Icon } from '../Icon/Icon'
import {
  WORKFLOW_COACH_STEPS,
  type WorkflowCoachStep,
  type WorkflowCoachTourProps,
} from './WorkflowCoachTour.types'

const CARD_WIDTH = 300
const GAP = 14
const PADDING = 16

const COACH_CUE_ILLUSTRATIONS: Partial<Record<WorkflowCoachStep['id'], string>> = {
  'create-with-ai': coachCueAi,
  trigger: coachCueTrigger,
  procedures: coachCueProcedures,
  action: coachCueActions,
  controls: coachCueControls,
  'test-run': coachCueRunTest,
  publish: coachCueActivate,
}

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

function CoachStepIllustration({ stepId }: { stepId: string }) {
  const src = COACH_CUE_ILLUSTRATIONS[stepId]
  if (!src) return null

  return (
    <div className="mt-lg flex justify-center">
      <img src={src} alt="" className="block h-auto w-full" aria-hidden />
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
 * First-time workflow editor coach queue — anchored cards (Create with AI → Trigger →
 * Procedures (Front desk) → Action → Controls → Run test → Activate).
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

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

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
        className="pointer-events-auto absolute w-[300px] rounded-lg bg-surface p-xl shadow-modal"
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

        <CoachStepIllustration stepId={step.id} />

        <div className="mt-xl flex items-center justify-end gap-md">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
            >
              Back
            </button>
          ) : null}
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
