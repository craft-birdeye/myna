import { useState } from 'react'
import {
  OPEN_QUESTIONS,
  OPEN_QUESTIONS_COPY,
  OpenQuestion,
  OpenQuestionVerdict,
} from '../../data/ghostwriterOpenQuestions'
import { PLAYBOOK_VERDICT_LABELS } from '../../data/ghostwriterPlaybookBlock'
import { READING_TIMING } from '../../data/ghostwriterReadingBlock'
import { VERDICT_TONE, VerdictTone } from './verdictTones'

const QUESTION_VERDICT: Record<OpenQuestionVerdict, { icon: string; tone: VerdictTone }> = {
  detail: { icon: 'help', tone: 'amber' },
  conflict: { icon: 'error', tone: 'red' },
  blocked: { icon: 'block', tone: 'grey' },
  pushback: { icon: 'priority_high', tone: 'blue' },
}

/** `deferred` = the question was explicitly waved off; both count as unanswered. */
type Answer = { kind: 'option'; label: string } | { kind: 'text'; label: string } | { kind: 'deferred' }

/** Selected pills take the plan-card blue; the rest stay as plain outline buttons. */
function OptionPill({
  label,
  recommended,
  selected,
  onClick,
}: {
  label: string
  recommended?: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-9 items-center gap-sm rounded-sm border px-lg text-body transition-colors ${
        selected
          ? 'border-primary bg-[#e8f1fc] text-text-action'
          : 'border-border bg-surface text-text-primary hover:bg-surface-hover'
      }`}
    >
      {label}
      {recommended && (
        <span className="rounded-sm bg-[#e8f1fc] px-sm py-[2px] text-small text-text-action">
          {OPEN_QUESTIONS_COPY.recommended}
        </span>
      )}
    </button>
  )
}

/** Plain text link — used for the defer escape and for links out like "Configure sources". */
function QuestionLink({
  label,
  selected = false,
  onClick,
}: {
  label: string
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-sm px-md py-xs text-body transition-colors hover:bg-surface-hover ${
        selected ? 'bg-[#e8f1fc] text-text-action' : 'text-text-action'
      }`}
    >
      {label}
    </button>
  )
}

/** The name/email field on the escalation question — Assign stays disabled until it's typed in. */
function AssignField({
  placeholder,
  submitLabel,
  value,
  onSubmit,
}: {
  placeholder: string
  submitLabel: string
  value?: string
  onSubmit: (text: string) => void
}) {
  const [draft, setDraft] = useState(value ?? '')
  const canSubmit = draft.trim().length > 0

  return (
    <>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) onSubmit(draft.trim())
        }}
        placeholder={placeholder}
        className={`h-9 w-[280px] rounded-sm border bg-surface px-lg text-body text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary ${
          value ? 'border-primary' : 'border-border'
        }`}
      />
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(draft.trim())}
        className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
          canSubmit
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
        }`}
      >
        {submitLabel}
      </button>
    </>
  )
}

/** A settled question collapses to this: the decision, in green, with a way back to it. */
function AnsweredRow({ label, onChange }: { label: string; onChange: () => void }) {
  return (
    <div className="gw-flow__in ml-[32px] flex flex-wrap items-center gap-md rounded-sm bg-[#f0fdf4] px-lg py-md">
      <span
        className="flex size-5 shrink-0 items-center justify-center text-[#15803d]"
        aria-hidden
      >
        <span className="material-symbols-outlined" style={{ fontSize: 19 }}>check_circle</span>
      </span>
      {/* No `flex-1` on the label — "Change" trails the answer rather than sitting out at
          the card's edge, which is a long way from it on a short answer. */}
      <span className="min-w-0 text-body text-[#15803d]">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-sm px-md py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
      >
        {OPEN_QUESTIONS_COPY.change}
      </button>
    </div>
  )
}

function QuestionCard({
  question,
  answer,
  editing,
  onAnswer,
  onEdit,
  delayMs,
}: {
  question: OpenQuestion
  answer?: Answer
  /** Set by "Change" — reopens the controls with the previous answer still selected. */
  editing: boolean
  onAnswer: (answer: Answer) => void
  onEdit: () => void
  delayMs: number
}) {
  const { icon, tone } = QUESTION_VERDICT[question.verdict]
  const { color, chip } = VERDICT_TONE[tone]
  /* Deferring leaves the question open, so its options stay on show. */
  const settled = !!answer && answer.kind !== 'deferred' && !editing

  return (
    <div
      className="gw-flow__in flex flex-col gap-sm rounded-sm border border-border p-lg"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start gap-md">
        <span
          className="mt-[2px] flex size-5 shrink-0 items-center justify-center"
          style={{ color }}
          aria-hidden
        >
          <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{icon}</span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <p className="m-0 text-body text-text-primary">
            {question.title}
            {question.page && (
              <span className="ml-sm whitespace-nowrap text-small text-text-tertiary">
                {question.page}
              </span>
            )}
          </p>
          {question.body.map((para) => (
            <p key={para} className="m-0 text-small text-text-tertiary">{para}</p>
          ))}
        </div>
        <span className={`shrink-0 whitespace-nowrap rounded-sm px-sm py-[3px] text-small ${chip}`}>
          {PLAYBOOK_VERDICT_LABELS[question.verdict]}
        </span>
      </div>

      {settled ? (
        <AnsweredRow label={answer.label} onChange={onEdit} />
      ) : (
        /* One wrapping row: pills, then the links. Wide pills push the link onto its own
           line on their own, which is what the design shows for the longer questions. */
        <div className="flex flex-wrap items-center gap-sm ml-[32px]">
          {question.input && (
            <AssignField
              placeholder={question.input.placeholder}
              submitLabel={question.input.submitLabel}
              value={answer?.kind === 'text' ? answer.label : undefined}
              onSubmit={(text) => onAnswer({ kind: 'text', label: text })}
            />
          )}
          {question.options?.map((option) => (
            <OptionPill
              key={option.id}
              label={option.label}
              recommended={option.recommended}
              selected={answer?.kind === 'option' && answer.label === option.label}
              onClick={() => onAnswer({ kind: 'option', label: option.label })}
            />
          ))}
          {question.deferLabel && (
            <QuestionLink
              label={question.deferLabel}
              selected={answer?.kind === 'deferred'}
              onClick={() => onAnswer({ kind: 'deferred' })}
            />
          )}
          {question.actionLabel && (
            <QuestionLink label={question.actionLabel} onClick={() => {}} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * What the block becomes once submitted: one divided box, a row per question, the reasoning
 * and controls dropped. A skipped question keeps its own verdict glyph, so the things still
 * open stay visually distinct from the things that were settled.
 */
function OpenQuestionsSummary({ answers }: { answers: Record<string, Answer> }) {
  return (
    <div className="gw-flow__in ml-3xl mt-sm overflow-hidden rounded-sm border border-border">
      {OPEN_QUESTIONS.map((question, i) => {
        const answer = answers[question.id]
        const settled = !!answer && answer.kind !== 'deferred'
        const glyph = settled
          ? { icon: 'check_circle', color: VERDICT_TONE.green.color }
          : {
            icon: QUESTION_VERDICT[question.verdict].icon,
            color: VERDICT_TONE[QUESTION_VERDICT[question.verdict].tone].color,
          }
        return (
          <div
            key={question.id}
            className={`flex items-start gap-md px-lg py-md ${i ? 'border-t border-border' : ''}`}
          >
            <span
              className="mt-[2px] flex size-5 shrink-0 items-center justify-center"
              style={{ color: glyph.color }}
              aria-hidden
            >
              <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{glyph.icon}</span>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-xs">
              <p className="m-0 text-body text-text-primary">{question.title}</p>
              <p className="m-0 text-small text-text-tertiary">
                {settled ? answer.label : OPEN_QUESTIONS_COPY.deferredLabel}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface GhostwriterOpenQuestionsProps {
  /** Fires on "Done — draft the plan", with what was actually settled. */
  onDone: (answered: number) => void
}

/**
 * The open-questions form: six cards, each answerable or explicitly deferrable, with a
 * running tally. Answers stay editable until "Done — draft the plan" is pressed, since the
 * whole point is that nothing gets guessed on the user's behalf.
 */
export function GhostwriterOpenQuestions({ onDone }: GhostwriterOpenQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  /* A question mid-edit still counts — its answer is recorded, just reopened. */
  const answered = OPEN_QUESTIONS.filter((q) => answers[q.id] && answers[q.id].kind !== 'deferred').length
  const deferred = OPEN_QUESTIONS.length - answered

  /* Submitting collapses the form to its outcome — nothing left to edit here. */
  if (submitted) return <OpenQuestionsSummary answers={answers} />

  return (
    <div className="ml-3xl mt-sm flex max-w-full flex-col gap-md">
      {OPEN_QUESTIONS.map((question, i) => (
        <QuestionCard
          key={question.id}
          question={question}
          answer={answers[question.id]}
          editing={!!editing[question.id]}
          onAnswer={(answer) => {
            setAnswers((prev) => ({ ...prev, [question.id]: answer }))
            setEditing((prev) => ({ ...prev, [question.id]: false }))
          }}
          onEdit={() => setEditing((prev) => ({ ...prev, [question.id]: true }))}
          delayMs={i * READING_TIMING.rowStagger}
        />
      ))}

      <div className="flex flex-wrap items-center gap-lg">
        <button
          type="button"
          onClick={() => {
            setSubmitted(true)
            onDone(answered)
          }}
          className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          {OPEN_QUESTIONS_COPY.done}
        </button>
        <span className="text-small text-text-tertiary">
          {OPEN_QUESTIONS_COPY.tally(answered, deferred)}
        </span>
      </div>
    </div>
  )
}
