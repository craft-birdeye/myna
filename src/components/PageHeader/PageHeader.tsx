import { DateChange } from '../DateChange/DateChange'
import { AppointmentTimescale, AppointmentView, PageHeaderProps } from './PageHeader.types'
import { CalendarDays, ChevronDown, Columns3, ListFilter, Rows3 } from 'lucide-react'

function ViewToggle({
  view,
  onViewChange,
}: {
  view: AppointmentView
  onViewChange?: (view: AppointmentView) => void
}) {
  const base = 'flex size-6 items-center justify-center rounded-sm transition-colors'
  return (
    <div className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface px-sm">
      <button
        type="button"
        aria-label="Table view"
        onClick={() => onViewChange?.('table')}
        className={`${base} ${
          view === 'table' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
        }`}
      >
        <Rows3 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      <button
        type="button"
        aria-label="Calendar view"
        onClick={() => onViewChange?.('calendar')}
        className={`${base} ${
          view === 'calendar' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
        }`}
      >
        <CalendarDays className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
    </div>
  )
}

function TimescaleToggle({
  timescale,
  onTimescaleChange,
}: {
  timescale: AppointmentTimescale
  onTimescaleChange?: (v: AppointmentTimescale) => void
}) {
  const base = 'px-sm py-xs text-body rounded-sm transition-colors'
  return (
    <div className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface px-xs">
      <button
        type="button"
        onClick={() => onTimescaleChange?.('day')}
        className={`${base} ${timescale === 'day' ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'}`}
      >
        Day
      </button>
      <button
        type="button"
        onClick={() => onTimescaleChange?.('week')}
        className={`${base} ${timescale === 'week' ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'}`}
      >
        Week
      </button>
    </div>
  )
}

export function PageHeader({
  date,
  providerLabel: _providerLabel = 'All customer reps',
  view = 'table',
  isToday = true,
  timescale,
  statusLabel,
  primaryActionLabel,
  onPrev,
  onNext,
  onToday,
  onProviderClick: _onProviderClick,
  onViewChange,
  onTimescaleChange,
  onStatusClick,
  onPrimaryAction,
  onCustomizeColumns,
  onFilter,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-surface px-2xl py-xl">
      <DateChange date={date} isToday={isToday} timescale={timescale} onPrev={onPrev ?? (() => {})} onNext={onNext ?? (() => {})} onToday={onToday} />

      {/* Controls */}
      <div className="flex items-center gap-sm">
        {statusLabel && (
          <button
            type="button"
            onClick={onStatusClick}
            className="flex h-[34px] items-center gap-sm rounded-md border border-border-selected bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-l2"
          >
            {statusLabel}
            <ChevronDown className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        )}

        {timescale && (
          <TimescaleToggle timescale={timescale} onTimescaleChange={onTimescaleChange} />
        )}

        <ViewToggle view={view} onViewChange={onViewChange} />

        {primaryActionLabel && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            {primaryActionLabel}
          </button>
        )}

        {onCustomizeColumns && (
          <button
            type="button"
            aria-label="Customize columns"
            onClick={onCustomizeColumns}
            className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Columns3 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        )}

        <button
          type="button"
          aria-label="Filters"
          onClick={onFilter}
          className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
        >
          <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>
    </div>
  )
}
