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
  day: number
  color?: 'green' | 'blue' | 'orange'
  warning?: boolean
  checks: string[]
}

interface TooltipPos {
  x: number
  y: number
}

interface WeekCalendarProps {
  weekStart: Date
  visibleColumns?: string[]
  searchQuery?: string
  onViewDetails?: (event: CalendarEvent) => void
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = ['07:00am', '08:00am', '09:00am', '10:00am', '11:00am', '12:00pm', '01:00pm', '02:00pm']
const TOOLTIP_WIDTH = 256

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', name: 'Robin Williams',   phone: '(501) 336-7516', email: 'r.williams@email.com',   provider: 'Dr. Smith Lee', apptType: 'Follow Up',       insuranceStatus: 'Verified',     start: '08:00am', end: '09:00am', day: 0, color: 'green', checks: ['Appointment confirmed', 'Insurance verified', 'Intake form completed'] },
  { id: '2', name: 'David Goggins',    phone: '(415) 555-0101', email: 'd.goggins@email.com',    provider: 'Dr. Lopez',     apptType: 'Urgent Care',     insuranceStatus: 'Pending',      start: '08:00am', end: '08:30am', day: 1, color: 'green', warning: true, checks: ['Appointment confirmed'] },
  { id: '3', name: 'Rafeque Mohammed', phone: '(650) 555-0177', email: 'r.mohammed@email.com',   provider: 'Dr. Williams',  apptType: 'New Consult',     insuranceStatus: 'In Progress',  start: '08:30am', end: '09:00am', day: 1, color: 'green', checks: ['Appointment confirmed', 'Insurance verified'] },
  { id: '4', name: 'David Goggins',    phone: '(415) 555-0101', email: 'd.goggins@email.com',    provider: 'Dr. Lopez',     apptType: 'Urgent Care',     insuranceStatus: 'Pending',      start: '08:00am', end: '08:30am', day: 2, color: 'green', checks: ['Appointment confirmed'] },
  { id: '5', name: 'Kapoor Klause',    phone: '(408) 555-0188', email: 'k.klause@email.com',     provider: 'Dr. Carter',    apptType: 'Annual Physical', insuranceStatus: 'Verified',     start: '08:00am', end: '08:30am', day: 3, color: 'green', checks: ['Appointment confirmed', 'Insurance verified'] },
  { id: '6', name: 'Mark Rufflow',     phone: '(669) 555-0123', email: 'm.rufflow@email.com',    provider: 'Dr. Smith Lee', apptType: 'Procedure',       insuranceStatus: 'Denied',       start: '08:15am', end: '09:00am', day: 3, color: 'blue',  checks: ['Appointment confirmed', 'Insurance verified', 'Intake form completed'] },
  { id: '7', name: 'Ruth Regan',       phone: '(415) 555-0132', email: 'ruth.regan@email.com',   provider: 'Dr. Martinez',  apptType: 'Follow Up',       insuranceStatus: 'Verified',     start: '09:00am', end: '10:00am', day: 0, color: 'green', checks: ['Appointment confirmed', 'Insurance verified'] },
  { id: '8', name: 'Mark Rufflow',     phone: '(669) 555-0123', email: 'm.rufflow@email.com',    provider: 'Dr. Smith Lee', apptType: 'Procedure',       insuranceStatus: 'Denied',       start: '09:00am', end: '09:30am', day: 4, color: 'blue',  checks: ['Appointment confirmed', 'Insurance verified', 'Intake form completed'] },
  { id: '9', name: 'Rafeque Mohammed', phone: '(650) 555-0177', email: 'r.mohammed@email.com',   provider: 'Dr. Garcia',    apptType: 'New Consult',     insuranceStatus: 'In Progress',  start: '09:30am', end: '10:00am', day: 4, color: 'blue',  checks: ['Appointment confirmed'] },
]

const COLOR_MAP = {
  green:  { bg: 'bg-[#f0fdf4]', border: 'border-l-[#22c55e]', text: 'text-[#15803d]' },
  blue:   { bg: 'bg-[#eff6ff]', border: 'border-l-[#3b82f6]', text: 'text-[#1d4ed8]' },
  orange: { bg: 'bg-[#fff7ed]', border: 'border-l-[#f97316]', text: 'text-[#c2410c]' },
}

function parseHour(t: string): number {
  const m = t.match(/^(\d{2}):(\d{2})(am|pm)$/)
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

  const left = pos.x + TOOLTIP_WIDTH + 8 > window.innerWidth ? pos.x - TOOLTIP_WIDTH - 8 : pos.x + 8

  return (
    <div
      ref={ref}
      className="fixed z-[200] w-[256px] rounded-sm bg-white"
      style={{ top: pos.y, left, boxShadow: '0 10px 24px rgba(33,33,33,0.2)' }}
    >
      <div className="flex flex-col gap-sm p-md">
        <div>
          <p className="text-body text-text-primary">{event.name}</p>
          <p className="text-small text-text-secondary">{event.phone}</p>
        </div>
        <div>
          <p className="text-body text-text-primary">{event.provider}</p>
          <p className="text-small text-text-secondary">{event.start} – {event.end}</p>
        </div>
        <div className="h-px w-full bg-border" />
        <div className="flex flex-col gap-xs">
          {event.checks.map((label) => (
            <div key={label} className="flex items-center gap-xs">
              <Icon name="check_circle" size={16} className="shrink-0 text-text-secondary" />
              <span className="text-small text-text-primary">{label}</span>
            </div>
          ))}
        </div>
        <div className="h-px w-full bg-border" />
        <Link as="button" onClick={() => { onViewDetails?.(event); onClose() }} className="text-left text-body text-primary hover:text-primary-hover">
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

export function WeekCalendar({ weekStart, visibleColumns = ['name', 'dateTime'], searchQuery = '', onViewDetails }: WeekCalendarProps) {
  const startHour = 7
  const rowHeight = 80
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ x: 0, y: 0 })

  const q = searchQuery.trim().toLowerCase()
  const events = q
    ? MOCK_EVENTS.filter((e) => e.name.toLowerCase().includes(q) || e.provider.toLowerCase().includes(q))
    : MOCK_EVENTS

  function getDates() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - d.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(d)
      dd.setDate(dd.getDate() + i)
      return dd
    })
  }

  const dates = getDates()
  const today = new Date()

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
      {/* Day header row */}
      <div className="sticky top-0 z-10 flex border-b border-border bg-surface">
        <div className="w-[72px] shrink-0" />
        {dates.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          return (
            <div key={i} className="flex flex-1 items-center justify-center border-l border-border py-sm">
              <span className={`text-small ${isToday ? 'text-text-action' : 'text-text-secondary'}`}>
                {DAYS[i].slice(0, d.getDay() === 3 ? 9 : 999).split('day')[0] + 'day'}
              </span>
              <span className={`ml-xs text-small ${isToday ? 'text-text-action' : 'text-text-secondary'}`}>
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="relative flex flex-1">
        {/* Hour labels */}
        <div className="w-[72px] shrink-0">
          {HOURS.map((h) => (
            <div key={h} className="flex h-[80px] items-start justify-end pr-sm pt-0">
              <span className="text-small text-text-secondary">{h}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="relative flex flex-1">
          {/* Empty state — search returned no appointments */}
          {q && events.length === 0 && (
            <EmptyState
              className="pointer-events-none absolute inset-0 z-10"
              title="No appointments found"
              description="Try searching with other keywords"
            />
          )}

          {dates.map((_, dayIdx) => (
            <div key={dayIdx} className="relative flex-1 border-l border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-[80px] border-b border-border" />
              ))}

              {events.filter((e) => e.day === dayIdx).map((evt) => {
                const top = (parseHour(evt.start) - startHour) * rowHeight
                const height = (parseHour(evt.end) - parseHour(evt.start)) * rowHeight
                const c = COLOR_MAP[evt.color ?? 'green']
                const isActive = activeEvent?.id === evt.id
                return (
                  <div
                    key={evt.id}
                    onClick={(e) => handleEventClick(evt, e)}
                    className={`absolute left-[2px] right-[2px] overflow-hidden cursor-pointer rounded-sm border-l-[3px] ${c.bg} ${c.border} px-sm py-xs ${isActive ? 'ring-1 ring-primary/40' : 'hover:brightness-95'}`}
                    style={{ top, height: Math.max(height, 28) }}
                  >
                    <div className="flex items-center gap-xs">
                      <span className={`truncate text-small ${c.text}`}>{evt.name}</span>
                      {evt.warning && <Icon name="warning" size={12} className="shrink-0 text-[#f59e0b]" />}
                    </div>
                    {height >= 40 && (
                      <span className="text-[10px] text-text-secondary">{evt.start} - {evt.end}</span>
                    )}
                    {height >= 80 && Object.entries(COLUMN_FIELD_MAP)
                      .filter(([key]) => visibleColumns.includes(key))
                      .map(([key, getVal]) => (
                        <p key={key} className="truncate text-[10px] text-text-secondary">{getVal(evt)}</p>
                      ))}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Current time indicator */}
          {(() => {
            const now = new Date()
            const h = now.getHours() + now.getMinutes() / 60
            if (h < startHour || h > startHour + HOURS.length) return null
            const top = (h - startHour) * rowHeight
            const dayIdx = now.getDay()
            const leftPercent = (dayIdx / 7) * 100
            const widthPercent = 100 / 7
            return (
              <div className="pointer-events-none absolute z-10" style={{ top, left: `${leftPercent}%`, width: `${widthPercent}%` }}>
                <div className="relative flex items-center">
                  <div className="size-2 rounded-full bg-primary" />
                  <div className="h-px flex-1 bg-primary" />
                </div>
              </div>
            )
          })()}
        </div>
      </div>

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
