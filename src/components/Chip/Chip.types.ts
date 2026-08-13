export type ChipVariant = 'warning' | 'success' | 'danger' | 'neutral' | 'info' | 'purple'

export interface ChipProps {
  label: string
  variant?: ChipVariant
}
