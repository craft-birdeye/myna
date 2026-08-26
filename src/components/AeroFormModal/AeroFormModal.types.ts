import type { ReactNode } from 'react'

export interface AeroFormModalProps {
  title: string
  onClose: () => void
  onPrimary: () => void
  primaryLabel?: string
  primaryDisabled?: boolean
  cancelLabel?: string
  widthClassName?: string
  zIndex?: number
  children: ReactNode
  /** Extra classes on the dialog panel (e.g. fixed height). */
  panelClassName?: string
  /** Size the panel to its content instead of a fixed height + scrollable body. */
  fitContent?: boolean
  /** One-line description under the title. */
  subtitle?: string
  learnMoreHref?: string
  /** Prefer over href — opens in-app help (e.g. glossary) instead of an external page. */
  onLearnMore?: () => void
  learnMoreLabel?: string
}
