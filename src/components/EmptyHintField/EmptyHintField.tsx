import { useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'

export interface EmptyHintFieldProps {
  /** Help text shown while the field has no user content */
  hint: string
  isEmpty: boolean
  children: ReactNode
  className?: string
  /** Padding/inset classes for the hint overlay (match the input padding) */
  hintClassName?: string
}

/**
 * Persistent empty-state hint — stays visible when the field is empty,
 * including while focused. Native placeholders hide on focus; use this instead.
 * Applies a primary border while any nested input/textarea is focused.
 */
export function EmptyHintField({
  hint,
  isEmpty,
  children,
  className = '',
  hintClassName = 'px-md py-0',
}: EmptyHintFieldProps) {
  const [focused, setFocused] = useState(false)

  const handleFocusCapture = () => setFocused(true)

  const handleBlurCapture = (e: FocusEvent<HTMLDivElement>) => {
    const root = e.currentTarget
    // contenteditable / some browsers leave relatedTarget null — check after focus moves
    requestAnimationFrame(() => {
      if (!root.contains(document.activeElement)) setFocused(false)
    })
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const root = e.currentTarget
    const target = e.target as HTMLElement
    // Clicking shell/hint (not the control itself) should still focus the field
    if (
      target === root
      || target.getAttribute('aria-hidden') === 'true'
      || target.closest('[aria-hidden="true"]')
    ) {
      const el = root.querySelector<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), [contenteditable="true"]',
      )
      if (el && document.activeElement !== el) {
        e.preventDefault()
        el.focus()
      }
    }
  }

  return (
    <div
      className={`relative ${className} ${focused ? '!border-primary' : ''}`.trim()}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onMouseDown={handleMouseDown}
    >
      {isEmpty && (
        <div
          className={`pointer-events-none absolute inset-0 z-0 whitespace-pre-wrap text-body leading-relaxed text-text-tertiary ${hintClassName}`}
          aria-hidden
        >
          {hint}
        </div>
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
