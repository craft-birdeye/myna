export type ChipVariant = 'warning' | 'success' | 'danger' | 'neutral' | 'info'

export interface ChipProps {
  label: string
  variant?: ChipVariant
  /** Renders a filled dot before the label (e.g. Active / Inactive status chips). */
  showDot?: boolean
  /** Extra classes appended after the variant's own — use to override a single instance without touching the shared variant tokens. */
  className?: string
}
