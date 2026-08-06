export type ChipVariant = 'warning' | 'success' | 'danger' | 'neutral' | 'info'

export interface ChipProps {
  label: string
  variant?: ChipVariant
}
