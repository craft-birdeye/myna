import type { RefKind } from '../../data/procedureData'

export interface RefChipProps {
  kind: RefKind
  label: string
  /** When provided, renders a trailing × button. */
  onRemove?: () => void
  className?: string
}
