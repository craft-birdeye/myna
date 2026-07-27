import { ChipProps } from './Chip.types'

const VARIANTS: Record<NonNullable<ChipProps['variant']>, string> = {
  warning: 'bg-chip-warning-bg text-chip-warning-text',
  success: 'bg-chip-success-bg text-chip-success-text',
  danger: 'bg-chip-danger-bg text-chip-danger-text',
  neutral: 'bg-chip-neutral-bg text-chip-neutral-text',
}

export function Chip({ label, variant = 'warning' }: ChipProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-xs whitespace-nowrap rounded-sm px-sm py-xs text-small text-center ${VARIANTS[variant]}`}
    >
      {label}
    </span>
  )
}
