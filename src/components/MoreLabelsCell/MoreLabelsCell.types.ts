export interface MoreLabelsCellProps {
  labels: string[]
  /** Shown when `labels` is empty (e.g. "All services", "Base fields only"). */
  emptyLabel?: string
  /** How many labels to show before collapsing into "+N more". Default 1 (first label only). */
  maxVisible?: number
  className?: string
}
