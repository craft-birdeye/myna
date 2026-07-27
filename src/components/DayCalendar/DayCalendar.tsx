import { useEffect, useRef, useState } from 'react'
import { EmptyState } from '../EmptyState/EmptyState'
import { Icon } from '../Icon/Icon'
import { Link } from '../Link/Link'

interface CalendarEvent {
  id: string
  name: string
  phone: string
  email: string
  provider: string
  apptType: string
  insuranceStatus: string
  start: string
  end: string
  color: 'green' | 'red' | 'blue'
  checks: string[]
}

interface TooltipPos {
  x: number
  y: number
}

interface DayCalendarProps {
  day: Date
  visibleColumns?: string[]
  searchQuery?: string
  onViewDetails?: (event: CalendarEvent) => void
}

function buildSlots() {
  const slots: string[] = []
  for (let h = 6; h < 18; h++) {
    const period = h < 12 ? 'AM' : 'PM'
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h
    slots.push(`${String(display).padStart(2, '0')}:00 ${period}`)
    slots.push(`${String(display).padStart(2, '0')}:30 ${period}`)
  }
  return slots
}

const SLOTS = buildSlots()
const START_HOUR = 6
const SLOT_HEIGHT = 80
const TOOLTIP_WIDTH = 256

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1', name: 'Robin Williams',  phone: '(501) 336-7516', email: 'r.williams@email.com', provider: 'Dr. Smith Lee', apptType: 'Follow Up',      insuranceStatus: 'Verified',
    start: '08:00am', end: '09:00am', color: 'green',
    checks: ['Appointment confirmed', 'Insurance verified', 'Intake form completed'],
  },
  {
    id: '2', name: 'Robin Williams',  phone: '(501) 336-7516', email: 'r.williams@email.com', provider: 'Dr. Smith Lee', apptType: 'Follow Up',      insuranceStatus: 'Verified',
    start: '08:00am', end: '09:00am', color: 'green',
    checks: ['Appointment confirmed', 'Insurance verified', 'Intake form completed'],
  },
  {
    id: '3', name: 'Ruth Regan',     phone: '(415) 555-0132', email: 'ruth.regan@email.com', provider: 'Dr. Lopez',    apptType: 'Urgent Care',   insuranceStatus: 'Pending',
    start: '09:00am', end: '10:00am', color: 'red',
    checks: ['Appointment confirmed'],
  },
  {
    id: '4', name: 'Ruth Regan',     phone: '(415) 555-0132', email: 'ruth.regan@email.com', provider: 'Dr. Martinez', apptType: 'Annual Physical', insuranceStatus: 'In Progress',
    start: '09:00am', end: '10:00am', color: 'blue',
    checks: ['Appointment confirmed', 'Insurance verified'],
  },
]

const COLOR_MAP = {
  green: { bg: 'bg-[#edf7ed]', borderColor: '#4caf50', text: 'text-[#4caf50]' },
  red:   { bg: 'bg-[#fdecea]', borderColor: '#f44336', text: 'text-[#f44336]' },
  blue:  { bg: 'bg-[#edf4fc]', borderColor: '#3576cb', text: 'text-[#3576cb]' },
}

function parseHour(t: string): number {
  const m = t.match(/^(\d{1,2}):(\d{2})(am|pm)$/)
  if (!m) return 0
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  if (m[3] === 'pm' && h !== 12) h += 12
  if (m[3] === 'am' && h === 12) h = 0
  return h + min / 60
}

function EventTooltip({ event, pos, onClose, onViewDetails }: { event: CalendarEvent; pos: TooltipPos; onClose: () => void; onViewDetails?: (event: CalendarEvent) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Flip left if too close to right edge
  const left = pos.x + TOOLTIP_WIDTH + 8 > window.innerWidth ? pos.x - TOOLTIP_WIDTH - 8 : pos.x + 8

  return (
    <div
      ref={ref}
      className="fixed z-[200] w-[256px] rounded-sm bg-white"
      style={{
        top: pos.y,
        left,
        boxShadow: '0 10px 24px rgba(33,33,33,0.2)',
      }}
    >
      <div className="flex flex-col gap-sm p-md">
        {/* Patient */}
        <div>
          <p className="text-body text-text-primary">{event.name}</p>
          <p className="text-small text-text-secondary">{event.phone}</p>
        </div>

        {/* Provider + time */}
        <div>
          <p className="text-body text-text-primary">{event.provider}</p>
          <p className="text-small text-text-secondary">{event.start} – {event.end}</p>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Check items */}
        <div className="flex flex-col gap-xs">
          {event.checks.map((label) => (
            <div key={label} className="flex items-center gap-xs">
              <Icon name="check_circle" size={16} className="shrink-0 text-text-secondary" />
              <span className="text-small text-text-primary">{label}</span>
            </div>
          ))}
        </div>

        <div className="h-px w-full bg-border" />

        {/* View details */}
        <Link
          as="button"
          onClick={() => { onViewDetails?.(event); onClose() }}
          className="text-left text-body text-primary hover:text-primary-hover"
        >
          View details
        </Link>
      </div>
    </div>
  )
}

const COLUMN_FIELD_MAP: Record<string, (evt: CalendarEvent) => string> = {
  staff:           (e) => e.provider,
  apptType:        (e) => e.apptType,
  insuranceStatus: (e) => e.insuranceStatus,
  phone:           (e) => e.phone,
  email:           (e) => e.email,
}

export function DayCalendar({ day: _day, visibleColumns = ['name', 'dateTime'], searchQuery = '', onViewDetails }: DayCalendarProps) {
  const pxPerHour = SLOT_HEIGHT * 2
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ x: 0, y: 0 })

  const q = searchQuery.trim().toLowerCase()
  const events = q
    ? MOCK_EVENTS.filter((e) => e.name.toLowerCase().includes(q) || e.provider.toLowerCase().includes(q))
    : MOCK_EVENTS

  const now = new Date()
  const currentH = now.getHours() + now.getMinutes() / 60
  const showIndicator = currentH >= START_HOUR && currentH < START_HOUR + SLOTS.length / 2

  function handleEventClick(evt: CalendarEvent, e: React.MouseEvent) {
    e.stopPropagation()
    if (activeEvent?.id === evt.id) {
      setActiveEvent(null)
      return
    }
    setActiveEvent(evt)
    setTooltipPos({ x: e.clientX, y: e.clientY - 20 })
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="relative flex flex-1">
        {/* Time label column */}
        <div className="relative w-[88px] shrink-0">
          <div className="absolute right-0 top-0 h-full w-px bg-[#ccc]" />
          {SLOTS.map((label, i) => (
            <div key={i} className="relative" style={{ height: SLOT_HEIGHT }}>
              <span className="absolute right-[12px] top-0 -translate-y-1/2 text-[11px] leading-none text-[#888]">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="relative flex-1">
          {SLOTS.map((_, i) => (
            <div key={i} className="border-t border-[#e8e8e8]" style={{ height: SLOT_HEIGHT }} />
          ))}

          {/* Empty state — search returned no appointments */}
          {q && events.length === 0 && (
            <EmptyState
              className="pointer-events-none absolute inset-0 z-10"
              title="No appointments found"
              description="Try searching with other keywords"
            />
          )}

          {/* Events */}
          {events.map((evt) => {
            const top = (parseHour(evt.start) - START_HOUR) * pxPerHour
            const height = (parseHour(evt.end) - parseHour(evt.start)) * pxPerHour
            const c = COLOR_MAP[evt.color]
            const isActive = activeEvent?.id === evt.id
            return (
              <div
                key={evt.id}
                onClick={(e) => handleEventClick(evt, e)}
                className={`absolute left-[4px] right-[4px] cursor-pointer overflow-hidden rounded-[2px] transition-opacity ${c.bg} ${isActive ? 'ring-1 ring-primary/40' : 'hover:brightness-95'}`}
                style={{ top, height: Math.max(height, 28) }}
              >
                <div
                  className="absolute bottom-[5%] left-0 top-[5%] w-[3px] rounded-[4px]"
                  style={{ backgroundColor: c.borderColor }}
                />
                <div className="pl-[10px] pt-[8px]">
                  <p className={`text-[12px] ${c.text}`}>{evt.name}</p>
                  {height >= 40 && (
                    <p className="text-[10px] text-[#555]">{evt.start} - {evt.end}</p>
                  )}
                  {height >= 80 && Object.entries(COLUMN_FIELD_MAP)
                    .filter(([key]) => visibleColumns.includes(key))
                    .map(([key, getVal]) => (
                      <p key={key} className="truncate text-[10px] text-[#555]">{getVal(evt)}</p>
                    ))}
                </div>
              </div>
            )
          })}

          {/* Current time indicator */}
          {showIndicator && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10"
              style={{ top: (currentH - START_HOUR) * pxPerHour }}
            >
              <div className="relative flex items-center">
                <div className="size-2 rounded-full bg-primary" />
                <div className="h-px flex-1 bg-primary" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {activeEvent && (
        <EventTooltip
          event={activeEvent}
          pos={tooltipPos}
          onClose={() => setActiveEvent(null)}
          onViewDetails={onViewDetails}
        />
      )}
    </div>
  )
}
