import type { ReactNode } from 'react'

export interface QuestionCardOption {
  id: string
  label: string
  /** Second line under the label. The mode picker uses it; a short list doesn't need it. */
  description?: string
  recommended?: boolean
}

export interface GhostwriterQuestionCardProps {
  /** The question, as the agent would say it. */
  question: string
  /** Context under the question — a page citation, why it matters. */
  hint?: string
  /** Numbered rows. Omit for a question that only takes free text. */
  options?: readonly QuestionCardOption[]
  /**
   * Free-text row under the options — the "write something else" escape. When there are no
   * options this is the only way to answer.
   */
  freeText?: { placeholder: string; submitLabel: string }
  /** 1-based position in a deck. The pager is hidden unless `total` is greater than 1. */
  index?: number
  total?: number
  onPrev?: () => void
  onNext?: () => void
  /** Fired with the chosen option's label. */
  onPick?: (label: string) => void
  /** Fired with whatever was typed into the free-text row. */
  onSubmitText?: (text: string) => void
  /** Leaves the question unanswered. Shown as Skip in the footer. */
  onSkip?: () => void
  /** Answers every remaining question with its skip response. Shown as Skip all. */
  onSkipAll?: () => void
  /**
   * When the question has choices and a text option, this replaces the thin "Other…" field —
   * the shared composer, sitting in that row. The parent hides its own copy underneath.
   */
  inputSlot?: ReactNode
  /** Text currently in `inputSlot`, so Next can submit it. */
  externalDraft?: string
  onClearExternalDraft?: () => void
  skipLabel?: string
  className?: string
  /** Hairlines between the question and each option row, and between rows. Off when this
   *  card is docked flush above a composer that supplies its own single divider instead. */
  dividers?: boolean
}
