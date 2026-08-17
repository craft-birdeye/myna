import { type LucideIcon } from 'lucide-react'

export interface ChartCardButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
}

export function ChartCardButton({ icon: IconComponent, label, onClick }: ChartCardButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-chart-btn bg-surface text-text-icon transition-colors hover:bg-surface-hover"
    >
      <IconComponent className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
    </button>
  )
}
