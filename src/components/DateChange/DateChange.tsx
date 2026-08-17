import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DateChangeProps } from './DateChange.types'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatWeekRange(d: Date) {
  const start = new Date(d)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const startMonth = start.toLocaleDateString('en-US', { month: 'long' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' })
  const startDay = String(start.getDate()).padStart(2, '0')
  const endDay = String(end.getDate()).padStart(2, '0')

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${end.getFullYear()}`
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${end.getFullYear()}`
}

export function DateChange({ date, isToday, timescale = 'day', onPrev, onNext, onToday }: DateChangeProps) {
  const label = timescale === 'week' ? formatWeekRange(date) : formatDate(date)

  return (
    <div className="flex items-center gap-sm">
      <button
        type="button"
        aria-label={timescale === 'week' ? 'Previous week' : 'Previous day'}
        onClick={onPrev}
        className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-selected"
      >
        <ChevronLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      <span className="text-h3 text-text-primary">{label}</span>
      <button
        type="button"
        aria-label={timescale === 'week' ? 'Next week' : 'Next day'}
        onClick={onNext}
        className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-selected"
      >
        <ChevronRight className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {isToday && (
        <button
          type="button"
          onClick={onToday}
          className="ml-sm rounded-sm px-sm py-xs text-body text-text-action hover:bg-surface-selected"
        >
          Today
        </button>
      )}
    </div>
  )
}
