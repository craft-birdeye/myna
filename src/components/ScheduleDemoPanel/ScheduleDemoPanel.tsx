import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { ScheduleDemoPanelProps } from './ScheduleDemoPanel.types'

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_SLOTS = ['9:00 am', '9:30 am', '10:00 am', '10:30 am', '11:00 am', '11:30 am', '12:00 pm', '12:30 pm', '1:00 pm']

// Prototype "today" — matches the fixed date DatePickerModal already uses elsewhere in the app.
const TODAY = new Date(2026, 6, 2)

function buildCalendarCells(year: number, month: number) {
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-start week
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { day: number; type: 'prev' | 'current' | 'next' }[] = []
  for (let i = firstDayOffset - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, type: 'prev' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'current' })
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, type: 'next' })
  return cells
}

function formatDateHeader(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function ScheduleDemoPanel({ open, onClose, onScheduled }: ScheduleDemoPanelProps) {
  const [viewYear, setViewYear] = useState(TODAY.getFullYear())
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth())
  const [selectedDate, setSelectedDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 1))
  const [selectedTime, setSelectedTime] = useState('10:30 am')

  const cells = buildCalendarCells(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) } else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) } else setViewMonth((m) => m + 1)
  }

  function handleDayClick(day: number, type: 'prev' | 'current' | 'next') {
    if (type !== 'current') return
    setSelectedDate(new Date(viewYear, viewMonth, day))
  }

  function isSelected(day: number, type: string) {
    return (
      type === 'current' &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    )
  }

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[720px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-sm px-2xl pb-lg pt-2xl">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <h2 className="m-0 text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Schedule a call with a Birdeye specialist</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2xl pb-2xl">
          <p className="m-0 mb-xl text-body text-text-secondary">
            Select a date and time that works best for you. A specialist will walk you through setting up your AI co-workers and answer any related questions.
          </p>

          <div className="flex overflow-hidden rounded-md border border-border">
            {/* Calendar */}
            <div className="flex w-[300px] shrink-0 flex-col border-r border-border bg-surface-l2 p-lg">
              <h3 className="m-0 text-body text-text-primary">Select a Date &amp; Time</h3>
              <div className="mt-sm flex items-center gap-xs text-small text-text-secondary">
                <Clock className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                Meetings are 30 minutes long
              </div>

              <div className="mt-lg flex items-center justify-between">
                <span className="text-body text-text-primary">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    onClick={prevMonth}
                    aria-label="Previous month"
                    className="flex size-6 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-hover"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    aria-label="Next month"
                    className="flex size-6 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-hover"
                  >
                    <ChevronRight className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                </div>
              </div>

              <div className="mt-md grid grid-cols-7">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="flex h-8 items-center justify-center text-[11px] text-text-tertiary">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const disabled = cell.type !== 'current'
                  const sel = isSelected(cell.day, cell.type)
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDayClick(cell.day, cell.type)}
                      className="flex h-9 items-center justify-center"
                    >
                      <span
                        className={`flex size-7 items-center justify-center rounded-full text-[13px] transition-colors ${
                          sel ? 'bg-primary text-white' : disabled ? 'text-[#cccccc]' : 'text-text-primary hover:bg-surface-hover'
                        }`}
                      >
                        {cell.day}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            <div className="flex flex-1 flex-col p-lg">
              <span className="text-body text-text-primary">{formatDateHeader(selectedDate)}</span>
              <button
                type="button"
                className="mt-xs flex w-fit items-center gap-xs text-small text-text-secondary hover:text-text-primary"
              >
                Pacific Daylight Time
                <ChevronDown className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>

              <div className="mt-lg flex max-h-[260px] flex-col gap-sm overflow-y-auto pr-xs">
                {TIME_SLOTS.map((slot) => {
                  const sel = selectedTime === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`flex h-10 shrink-0 items-center justify-center rounded-sm border text-body transition-colors ${
                        sel
                          ? 'border-primary bg-primary/[0.08] text-text-action'
                          : 'border-border-selected text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onScheduled?.(selectedDate, selectedTime)
              onClose()
            }}
            className="mt-xl flex h-11 w-full items-center justify-center rounded-md bg-primary text-body text-white transition-colors hover:bg-primary-hover"
          >
            Schedule call
          </button>
        </div>
      </aside>
    </div>
  )
}
