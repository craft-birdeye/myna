import type { ReactNode } from 'react'
import type { RefKind } from '../../data/procedureData'

export interface RefChipProps {
  kind: RefKind
  label: string
  /** When provided, renders a trailing × button. */
  onRemove?: () => void
  /** Overrides the default Material / DataType swatch icon (e.g. canvas TaskIcon). */
  swatchIcon?: ReactNode
  className?: string
}
