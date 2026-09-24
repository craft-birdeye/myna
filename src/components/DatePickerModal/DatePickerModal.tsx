import { useState } from 'react'
import { DatePickerModalProps } from './DatePickerModal.types'
import { ChevronDown, ChevronLeft, ChevronRight, Globe } from 'lucide-react'

// ─── Shared constants ────────────────────────────────────────────────────────

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const PRESETS = [
  'All time', 'Past 7 days', 'Last calendar week', 'Past 30 days',
  'Last calendar month', 'This month', 'Past 2 months', 'Past 3 months',
  'Past 6 months', 'This year', 'Past 12 months', 'Last calendar year', 'Custom date',
]

// Prototype "today"
const TODAY = new Date(2026, 6, 2)

// Slot availability pattern: true=available, false=disabled
const SLOT_AVAILABILITY: Record<string, boolean> = {
  '9:00 AM': true, '9:30 AM': true,
  '10:00 AM': false, '10:30 AM': true,
  '11:00 AM': true, '11:30 AM': false,
  '12:00 PM': true, '12:30 PM': true,
  '1:00 PM': true, '1:30 PM': true,
  '2:00 PM': true, '2:30 PM': true,
  '3:00 PM': true, '3:30 PM': true,
}
const TIME_SLOTS = Object.keys(SLOT_AVAILABILITY)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateHeader(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { day: number; type: 'prev' | 'current' | 'next' }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, type: 'prev' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'current' })
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, type: 'next' })
  return cells
}

// ─── Shared calendar panel ────────────────────────────────────────────────────

interface CalendarPanelProps {
  viewYear: number
  viewMonth: number
  selectedDate: Date | null
  startDate?: Date | null
  endDate?: Date | null
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (day: number, type: 'prev' | 'current' | 'next') => void
  showSingleDisplay?: boolean   // datetime variant: one date field
  showRangeDisplay?: boolean    // range variant: two date fields
  rangeSelecting?: 'start' | 'end'
  onSelectStart?: () => void
  onSelectEnd?: () => void
}

function CalendarPanel({
  viewYear, viewMonth, selectedDate, startDate, endDate,
  onPrevMonth, onNextMonth, onDayClick,
  showSingleDisplay, showRangeDisplay, rangeSelecting, onSelectStart, onSelectEnd,
}: CalendarPanelProps) {
  const cells = buildCalendarCells(viewYear, viewMonth)

  function isSel(day: number, type: string) {
    if (type !== 'current') return false
    const d = new Date(viewYear, viewMonth, day)
    return (selectedDate && d.getTime() === selectedDate.getTime()) ||
           (startDate && d.getTime() === startDate.getTime()) ||
           (endDate && d.getTime() === endDate.getTime()) || false
  }
  function isInRange(day: number, type: string) {
    if (type !== 'current' || !startDate || !endDate) return false
    const d = new Date(viewYear, viewMonth, day)
    return d > startDate && d < endDate
  }

  return (
    <div className="flex w-[248px] shrink-0 flex-col">
      {/* Single date display (datetime variant) */}
      {showSingleDisplay && (
        <div className="border-b border-border px-[12px] pb-[12px] pt-[20px]">
          <div className="flex items-center justify-center rounded-sm border border-border-selected bg-surface-l2 py-[8px] text-[14px] leading-[20px] text-text-tertiary">
            {selectedDate ? formatDate(selectedDate) : 'Select date'}
          </div>
        </div>
      )}

      {/* Range date display (range variant) */}
      {showRangeDisplay && (
        <div className="flex items-center gap-[12px] border-b border-border px-[12px] pb-[12px] pt-[20px]">
          <button
            type="button"
            onClick={onSelectStart}
            className={`flex flex-1 items-center justify-center rounded-sm border py-[8px] text-[14px] leading-[20px] transition-colors ${
              rangeSelecting === 'start' ? 'border-primary text-text-action' : 'border-border-selected bg-surface-l2 text-text-tertiary'
            }`}
          >
            {startDate ? formatDate(startDate) : 'Start date'}
          </button>
          <span className="shrink-0 text-[14px] text-text-tertiary">-</span>
          <button
            type="button"
            onClick={onSelectEnd}
            className={`flex flex-1 items-center justify-center rounded-sm border py-[8px] text-[14px] leading-[20px] transition-colors ${
              rangeSelecting === 'end' ? 'border-primary text-text-action' : 'border-border-selected bg-surface-l2 text-text-tertiary'
            }`}
          >
            {endDate ? formatDate(endDate) : 'End date'}
          </button>
        </div>
      )}

      {/* Month & year nav */}
      <div className="flex items-center justify-between px-[12px] py-[8px]">
        <button type="button" onClick={onPrevMonth} className="flex size-6 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-hover">
          <ChevronLeft className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <div className="flex items-center">
          <button type="button" className="flex items-center gap-[4px] rounded-sm px-sm py-[4px] text-[12px] leading-[18px] text-text-secondary hover:bg-surface-hover">
            {MONTHS[viewMonth]} <ChevronDown className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button type="button" className="flex items-center gap-[4px] rounded-sm px-sm py-[4px] text-[12px] leading-[18px] text-text-secondary hover:bg-surface-hover">
            {viewYear} <ChevronDown className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
        <button type="button" onClick={onNextMonth} className="flex size-6 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-hover">
          <ChevronRight className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 px-[12px]">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="flex size-8 items-center justify-center text-[12px] leading-[18px] text-text-tertiary">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-[12px] pb-[8px]">
        {cells.map((cell, i) => {
          const sel = isSel(cell.day, cell.type)
          const inRange = isInRange(cell.day, cell.type)
          const disabled = cell.type !== 'current'
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(cell.day, cell.type)}
              className={`flex size-8 items-center justify-center ${inRange ? 'bg-primary/[0.08]' : ''}`}
            >
              <span className={`flex size-6 items-center justify-center rounded-full text-[12px] leading-[18px] transition-colors ${
                sel ? 'bg-primary text-white' : disabled ? 'text-[#cccccc]' : 'text-text-primary hover:bg-surface-hover'
              }`}>
                {cell.day}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Range variant (presets + calendar) ──────────────────────────────────────

function RangeVariant({ onClose, onApply }: { onClose: () => void; onApply: (v: string) => void }) {
  const [selectedPreset, setSelectedPreset] = useState('Past 7 days')
  const [viewYear, setViewYear] = useState(TODAY.getFullYear())
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth())
  const [startDate, setStartDate] = useState<Date | null>(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 7))
  const [endDate, setEndDate] = useState<Date | null>(new Date(TODAY))
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1)
  }

  function handleDayClick(day: number, type: 'prev' | 'current' | 'next') {
    let m = viewMonth, y = viewYear
    if (type === 'prev') { m = viewMonth === 0 ? 11 : viewMonth - 1; y = viewMonth === 0 ? viewYear - 1 : viewYear }
    if (type === 'next') { m = viewMonth === 11 ? 0 : viewMonth + 1; y = viewMonth === 11 ? viewYear + 1 : viewYear }
    const clicked = new Date(y, m, day)
    if (selecting === 'start') { setStartDate(clicked); setEndDate(null); setSelecting('end'); setSelectedPreset('Custom date') }
    else {
      if (startDate && clicked < startDate) { setEndDate(startDate); setStartDate(clicked) } else setEndDate(clicked)
      setSelecting('start'); setSelectedPreset('Custom date')
    }
  }

  function handlePreset(preset: string) {
    setSelectedPreset(preset)
    const now = new Date(TODAY)
    let s: Date | null = null, e: Date | null = new Date(now)
    if (preset === 'All time') { s = null; e = null }
    else if (preset === 'Past 7 days') { s = new Date(now); s.setDate(s.getDate() - 7) }
    else if (preset === 'Last calendar week') { s = new Date(now); s.setDate(s.getDate() - now.getDay() - 7); e = new Date(s); e.setDate(e.getDate() + 6) }
    else if (preset === 'Past 30 days') { s = new Date(now); s.setDate(s.getDate() - 30) }
    else if (preset === 'Last calendar month') { s = new Date(now.getFullYear(), now.getMonth() - 1, 1); e = new Date(now.getFullYear(), now.getMonth(), 0) }
    else if (preset === 'This month') { s = new Date(now.getFullYear(), now.getMonth(), 1) }
    else if (preset === 'Past 2 months') { s = new Date(now); s.setMonth(s.getMonth() - 2) }
    else if (preset === 'Past 3 months') { s = new Date(now); s.setMonth(s.getMonth() - 3) }
    else if (preset === 'Past 6 months') { s = new Date(now); s.setMonth(s.getMonth() - 6) }
    else if (preset === 'This year') { s = new Date(now.getFullYear(), 0, 1) }
    else if (preset === 'Past 12 months') { s = new Date(now); s.setFullYear(s.getFullYear() - 1) }
    else if (preset === 'Last calendar year') { s = new Date(now.getFullYear() - 1, 0, 1); e = new Date(now.getFullYear() - 1, 11, 31) }
    setStartDate(s); setEndDate(e)
    if (s) { setViewMonth(s.getMonth()); setViewYear(s.getFullYear()) }
  }

  const applyLabel = startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : startDate ? formatDate(startDate) : selectedPreset

  return (
    <div className="flex">
      {/* Left — presets */}
      <div className="flex w-[260px] shrink-0 flex-col gap-[4px] overflow-y-auto p-[12px]">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePreset(preset)}
            className={`flex w-full items-center gap-xs rounded-sm px-sm py-[6px] text-left text-[12px] leading-[18px] transition-colors ${
              selectedPreset === preset ? 'bg-primary/[0.08] text-text-action' : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <span className="truncate">{preset}</span>
            {preset === 'Custom date' && startDate && endDate && (
              <span className="ml-xs shrink-0 text-[11px] text-text-tertiary">{formatDate(startDate)} – {formatDate(endDate)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px shrink-0 bg-border" />

      {/* Right — calendar */}
      <div className="flex flex-col">
        <CalendarPanel
          viewYear={viewYear} viewMonth={viewMonth}
          selectedDate={null} startDate={startDate} endDate={endDate}
          onPrevMonth={prevMonth} onNextMonth={nextMonth}
          onDayClick={handleDayClick}
          showRangeDisplay
          rangeSelecting={selecting}
          onSelectStart={() => setSelecting('start')}
          onSelectEnd={() => setSelecting('end')}
        />
        {/* Actions */}
        <div className="flex items-center justify-end gap-sm border-t border-border px-[16px] py-[12px]">
          <button type="button" onClick={onClose} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">Cancel</button>
          <button type="button" onClick={() => { onApply(applyLabel); onClose() }} className="rounded-md bg-primary px-lg py-[7px] text-body text-white hover:bg-primary-hover">Apply</button>
        </div>
      </div>
    </div>
  )
}

// ─── Datetime variant (calendar + time slots) ─────────────────────────────────

function DatetimeVariant({ onClose, onApply }: { onClose: () => void; onApply: (v: string) => void }) {
  const [viewYear, setViewYear] = useState(TODAY.getFullYear())
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(TODAY))
  const [selectedTime, setSelectedTime] = useState<string | null>('1:00 PM')
  const [showAll, setShowAll] = useState(false)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1)
  }

  function handleDayClick(day: number, type: 'prev' | 'current' | 'next') {
    if (type !== 'current') return
    setSelectedDate(new Date(viewYear, viewMonth, day))
    setSelectedTime(null)
  }

  const visibleSlots = showAll ? TIME_SLOTS : TIME_SLOTS.slice(0, 14)

  const applyLabel = selectedDate && selectedTime
    ? `${formatDate(selectedDate)}, ${selectedTime}`
    : selectedDate ? formatDate(selectedDate) : ''

  return (
    <div className="flex">
      {/* Left — calendar */}
      <div className="flex flex-col">
        <CalendarPanel
          viewYear={viewYear} viewMonth={viewMonth}
          selectedDate={selectedDate}
          onPrevMonth={prevMonth} onNextMonth={nextMonth}
          onDayClick={handleDayClick}
          showSingleDisplay
        />
      </div>

      {/* Divider */}
      <div className="w-px shrink-0 bg-border" />

      {/* Right — time slots */}
      <div className="flex w-[260px] shrink-0 flex-col overflow-hidden p-[12px]">
        {/* Date + timezone header */}
        <div className="mb-[12px] flex flex-col items-end border-b border-border pb-[12px] pt-[8px]">
          <span className="text-[12px] leading-[18px] text-text-action">
            {selectedDate ? formatDateHeader(selectedDate) : '—'}
          </span>
          <div className="flex items-center gap-[4px]">
            <Globe className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
            <span className="text-[12px] leading-[18px] text-text-tertiary">Eastern Daylight Time</span>
          </div>
        </div>

        {/* Time slot grid */}
        <div className="flex flex-1 flex-col gap-[12px] overflow-y-auto">
          {Array.from({ length: Math.ceil(visibleSlots.length / 2) }, (_, rowIdx) => {
            const left = visibleSlots[rowIdx * 2]
            const right = visibleSlots[rowIdx * 2 + 1]
            return (
              <div key={rowIdx} className="flex gap-[12px]">
                {[left, right].filter(Boolean).map((slot) => {
                  const available = SLOT_AVAILABILITY[slot]
                  const isSelected = selectedTime === slot && available
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!available}
                      onClick={() => available && setSelectedTime(slot)}
                      className={`flex flex-1 items-center justify-center rounded-sm border py-[8px] text-[14px] leading-[20px] transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : available
                          ? 'border-primary bg-surface text-text-action hover:bg-primary/[0.04]'
                          : 'border-border bg-surface-l2 text-[#cccccc]'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Show more slots */}
          {!showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-sm border border-primary px-md py-[7px] text-body text-text-action hover:bg-primary/[0.04]"
            >
              Show more slots
            </button>
          )}
        </div>

        {/* Apply */}
        <div className="flex items-center justify-end gap-sm border-t border-border pt-[12px] mt-[12px]">
          <button type="button" onClick={onClose} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">Cancel</button>
          <button
            type="button"
            disabled={!selectedTime}
            onClick={() => { if (applyLabel) { onApply(applyLabel); onClose() } }}
            className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
              selectedTime ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DatePickerModal({ open, anchor, onClose, onApply, variant = 'range' }: DatePickerModalProps) {
  if (!open || !anchor) return null

  const posLeft = Math.min(anchor.left, window.innerWidth - 560)

  return (
    <>
      <div className="fixed inset-0 z-[120]" onClick={onClose} />
      <div
        className="fixed z-[130] overflow-hidden rounded-sm bg-surface shadow-dropdown"
        style={{ top: anchor.top + 4, left: posLeft }}
      >
        {variant === 'datetime'
          ? <DatetimeVariant onClose={onClose} onApply={onApply} />
          : <RangeVariant onClose={onClose} onApply={onApply} />
        }
      </div>
    </>
  )
}
