export interface ChipOverflowCellProps {
  labels: string[]
  /** Shown when `labels` is empty. */
  emptyLabel?: string
  /** How many chips to show before collapsing into a "+N more" trigger. Default 2. */
  maxVisible?: number
}
