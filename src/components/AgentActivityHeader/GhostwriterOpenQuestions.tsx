/**
 * The clarifying step in the Ghostwriter playbook flow.
 *
 * History worth keeping: this was six inline cards with verdict chips and pill rows, then a
 * modal, and is now the same inline `GhostwriterQuestionCard` every other ask in the thread
 * uses. The modal was wrong twice over — it covered the drafts the question came out of, and
 * it implied the thread was blocked on an answer that is optional.
 *
 * Questions are asked one at a time with a pager, so a deck of them never becomes a form.
 * Skipping is a real answer: it carries the question onto the plan as an open decision
 * instead of letting the agent guess.
 */
import { useState } from 'react'
import {
  OPEN_QUESTIONS,
  OPEN_QUESTIONS_COPY,
} from '../../data/ghostwriterOpenQuestions'
import { GhostwriterQuestionCard } from '../GhostwriterQuestionCard/GhostwriterQuestionCard'

export interface GhostwriterOpenQuestionsProps {
  /** Fires once every question is answered or skipped, with how many were answered. */
  onDone: (answered: number) => void
}

export function GhostwriterOpenQuestions({ onDone }: GhostwriterOpenQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [cursor, setCursor] = useState(0)
  const [settled, setSettled] = useState(false)

  const answeredCount = OPEN_QUESTIONS.filter((q) => answers[q.id]?.trim()).length
  const question = OPEN_QUESTIONS[cursor]

  /** Move to the next unseen question, or close the card out. */
  const advance = () => {
    if (cursor + 1 < OPEN_QUESTIONS.length) {
      setCursor(cursor + 1)
      return
    }
    setSettled(true)
    onDone(answeredCount)
  }

  const answer = (text: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: text }))
    /* Count this answer — `answeredCount` above is a render behind at this point. */
    if (cursor + 1 < OPEN_QUESTIONS.length) {
      setCursor(cursor + 1)
      return
    }
    setSettled(true)
    onDone(OPEN_QUESTIONS.filter((q) => (q.id === question.id ? text.trim() : answers[q.id]?.trim())).length)
  }

  if (settled) {
    return (
      <div className="gw-flow__in ml-3xl mt-sm flex max-w-full flex-col gap-sm">
        <p className="m-0 text-body text-text-primary">
          {OPEN_QUESTIONS_COPY.answered(answeredCount, OPEN_QUESTIONS.length)}{' '}
          <button
            type="button"
            onClick={() => {
              setCursor(0)
              setSettled(false)
            }}
            className="text-body text-text-action transition-colors hover:underline"
          >
            {OPEN_QUESTIONS_COPY.reopen}
          </button>
        </p>
        {OPEN_QUESTIONS.map((q) => {
          const value = answers[q.id]?.trim()
          return (
            <p key={q.id} className="m-0 text-body text-text-secondary">
              {q.title}{' '}
              <span className={value ? 'text-text-primary' : 'text-[#b7791f]'}>
                {value || OPEN_QUESTIONS_COPY.deferredLabel}
              </span>
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <GhostwriterQuestionCard
      key={question.id}
      question={question.title}
      hint={question.page ? `${question.page} — ${question.body}` : question.body}
      freeText={{ placeholder: question.placeholder, submitLabel: OPEN_QUESTIONS_COPY.submit }}
      index={cursor + 1}
      total={OPEN_QUESTIONS.length}
      onPrev={cursor > 0 ? () => setCursor(cursor - 1) : undefined}
      onNext={cursor + 1 < OPEN_QUESTIONS.length ? () => setCursor(cursor + 1) : undefined}
      onSubmitText={answer}
      onSkip={advance}
      skipLabel={OPEN_QUESTIONS_COPY.skip}
    />
  )
}
