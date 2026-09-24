import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const DATE_RANGE_PRESETS = [
  'All time',
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'Last 60 days',
  'Last 90 days',
  'Last 120 days',
  'Last 6 months',
  'Last 12 months',
  'Last 24 months',
] as const

const TODAY = new Date(2026, 8, 24)

export interface DateRangePickerPanelProps {
  value: string
  onApply: (value: string) => void
  onCancel: () => void
}

function formatInputDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}/${date.getFullYear()}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getPresetRange(preset: string) {
  const end = new Date(TODAY)
  const start = new Date(TODAY)

  switch (preset) {
    case 'All time':
      return { start: null as Date | null, end: null as Date | null }
    case 'Today':
      return { start: new Date(TODAY), end: new Date(TODAY) }
    case 'Yesterday': {
      start.setDate(start.getDate() - 1)
      return { start, end: new Date(start) }
    }
    case 'Last 7 days':
      start.setDate(start.getDate() - 7)
      return { start, end }
    case 'Last 30 days':
      start.setDate(start.getDate() - 30)
      return { start, end }
    case 'Last 60 days':
      start.setDate(start.getDate() - 60)
      return { start, end }
    case 'Last 90 days':
      start.setDate(start.getDate() - 90)
      return { start, end }
    case 'Last 120 days':
      start.setDate(start.getDate() - 120)
      return { start, end }
    case 'Last 6 months':
      start.setMonth(start.getMonth() - 6)
      return { start, end }
    case 'Last 12 months':
      start.setFullYear(start.getFullYear() - 1)
      return { start, end }
    case 'Last 24 months':
      start.setFullYear(start.getFullYear() - 2)
      return { start, end }
    default:
      return { start: null, end: null }
  }
}

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { day: number; type: 'prev' | 'current' | 'next' }[] = []

  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, type: 'prev' })
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, type: 'current' })
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ day: nextDay++, type: 'next' })
  }

  return cells
}

function resolveDate(year: number, month: number, day: number, type: 'prev' | 'current' | 'next') {
  if (type === 'current') return new Date(year, month, day)
  if (type === 'prev') {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    return new Date(prevYear, prevMonth, day)
  }
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  return new Date(nextYear, nextMonth, day)
}

function MonthGrid({
  year,
  month,
  startDate,
  endDate,
  onDayClick,
}: {
  year: number
  month: number
  startDate: Date | null
  endDate: Date | null
  onDayClick: (date: Date) => void
}) {
  const cells = buildCalendarCells(year, month)

  function dayState(date: Date) {
    if (!startDate) return { inRange: false, isStart: false, isEnd: false }
    const isStart = sameDay(date, startDate)
    const isEnd = endDate ? sameDay(date, endDate) : false
    const inRange = endDate ? date > startDate && date < endDate : false
    return { inRange, isStart, isEnd }
  }

  return (
    <div className="w-[252px]">
      <div className="grid grid-cols-7">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex h-8 items-center justify-center text-small text-text-tertiary">
            {day}
          </div>
        ))}
        {cells.map((cell, index) => {
          const date = resolveDate(year, month, cell.day, cell.type)
          const { inRange, isStart, isEnd } = dayState(date)
          const isCurrentMonth = cell.type === 'current'
          const selected = isStart || isEnd

          return (
            <button
              key={index}
              type="button"
              onClick={() => onDayClick(date)}
              className={`flex h-8 items-center justify-center ${
                inRange ? 'bg-primary/[0.12]' : ''
              } ${isStart && endDate ? 'rounded-l-full bg-primary/[0.12]' : ''} ${
                isEnd ? 'rounded-r-full bg-primary/[0.12]' : ''
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-small ${
                  selected
                    ? 'bg-primary text-white'
                    : isCurrentMonth
                      ? 'text-text-primary'
                      : 'text-text-tertiary'
                }`}
              >
                {cell.day}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getInitialPreset(value: string) {
  if ((DATE_RANGE_PRESETS as readonly string[]).includes(value)) return value
  return 'Last 6 months'
}

export function DateRangePickerPanel({ value, onApply, onCancel }: DateRangePickerPanelProps) {
  const initialPreset = getInitialPreset(value)
  const initialRange = getPresetRange(initialPreset)
  const [selectedPreset, setSelectedPreset] = useState(initialPreset)
  const [startDate, setStartDate] = useState<Date | null>(initialRange.start)
  const [endDate, setEndDate] = useState<Date | null>(initialRange.end)
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [leftMonth, setLeftMonth] = useState((initialRange.start ?? TODAY).getMonth())
  const [leftYear, setLeftYear] = useState((initialRange.start ?? TODAY).getFullYear())

  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear

  useEffect(() => {
    const preset = getInitialPreset(value)
    const range = getPresetRange(preset)
    setSelectedPreset(preset)
    setStartDate(range.start)
    setEndDate(range.end)
    if (range.start) {
      setLeftMonth(range.start.getMonth())
      setLeftYear(range.start.getFullYear())
    }
  }, [value])

  function applyPreset(preset: string) {
    const range = getPresetRange(preset)
    setSelectedPreset(preset)
    setStartDate(range.start)
    setEndDate(range.end)
    setSelecting('start')
    if (range.start) {
      setLeftMonth(range.start.getMonth())
      setLeftYear(range.start.getFullYear())
    }
  }

  function handleDayClick(date: Date) {
    setSelectedPreset('')
    if (selecting === 'start' || !startDate) {
      setStartDate(date)
      setEndDate(null)
      setSelecting('end')
      return
    }
    if (date < startDate) {
      setEndDate(startDate)
      setStartDate(date)
    } else {
      setEndDate(date)
    }
    setSelecting('start')
  }

  function prevMonths() {
    if (leftMonth === 0) {
      setLeftMonth(11)
      setLeftYear((year) => year - 1)
    } else {
      setLeftMonth((month) => month - 1)
    }
  }

  function nextMonths() {
    if (leftMonth === 11) {
      setLeftMonth(0)
      setLeftYear((year) => year + 1)
    } else {
      setLeftMonth((month) => month + 1)
    }
  }

  function handleReset() {
    applyPreset('Last 6 months')
  }

  function handleApply() {
    if (selectedPreset) {
      onApply(selectedPreset)
      return
    }
    if (startDate && endDate) {
      onApply(`${formatInputDate(startDate)} – ${formatInputDate(endDate)}`)
      return
    }
    if (startDate) {
      onApply(formatInputDate(startDate))
    }
  }

  return (
    <div className="flex w-[780px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-dropdown">
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[188px] shrink-0 flex-col gap-xs overflow-y-auto border-r border-border p-md">
          {DATE_RANGE_PRESETS.map((preset) => {
            const selected = selectedPreset === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-md px-md py-sm text-left text-body transition-colors ${
                  selected ? 'bg-surface-selected text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {preset}
              </button>
            )
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-lg">
          <div className="mb-lg grid grid-cols-2 gap-lg">
            <div>
              <p className="mb-xs text-small text-text-secondary">Start date</p>
              <button
                type="button"
                onClick={() => setSelecting('start')}
                className={`w-full rounded-md border px-md py-sm text-left text-body ${
                  selecting === 'start' ? 'border-primary text-text-primary' : 'border-border-selected text-text-primary'
                }`}
              >
                {startDate ? formatInputDate(startDate) : 'MM/DD/YYYY'}
              </button>
            </div>
            <div>
              <p className="mb-xs text-small text-text-secondary">End date</p>
              <button
                type="button"
                onClick={() => setSelecting('end')}
                className={`w-full rounded-md border px-md py-sm text-left text-body ${
                  selecting === 'end' ? 'border-primary text-text-primary' : 'border-border-selected text-text-primary'
                }`}
              >
                {endDate ? formatInputDate(endDate) : 'MM/DD/YYYY'}
              </button>
            </div>
          </div>

          <div className="mb-sm flex items-center gap-lg">
            <button
              type="button"
              onClick={prevMonths}
              className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              aria-label="Previous months"
            >
              <ChevronLeft className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <div className="flex flex-1 justify-between gap-lg">
              <p className="w-[252px] text-center text-small text-text-primary">
                {MONTHS[leftMonth]} {leftYear}
              </p>
              <p className="w-[252px] text-center text-small text-text-primary">
                {MONTHS[rightMonth]} {rightYear}
              </p>
            </div>
            <button
              type="button"
              onClick={nextMonths}
              className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              aria-label="Next months"
            >
              <ChevronRight className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>

          <div className="flex justify-between gap-lg">
            <MonthGrid
              year={leftYear}
              month={leftMonth}
              startDate={startDate}
              endDate={endDate}
              onDayClick={handleDayClick}
            />
            <MonthGrid
              year={rightYear}
              month={rightMonth}
              startDate={startDate}
              endDate={endDate}
              onDayClick={handleDayClick}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-lg py-md">
        <button
          type="button"
          onClick={handleReset}
          className="text-body text-text-action hover:underline"
        >
          Reset
        </button>
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={onCancel}
            className="text-body text-text-action hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-primary px-lg py-sm text-body text-white hover:bg-primary-hover"
          >
            Set range
          </button>
        </div>
      </div>
    </div>
  )
}
