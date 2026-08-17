// src/components/ViewActivityDrawer/activityUtils.tsx
import { useState } from 'react'
import { Calendar, Check, Mail, Bell, Circle, ChevronUp, ChevronDown } from 'lucide-react'
import { Link } from '../Link/Link'
import { Activity, ActivityType, ViewActivityDrawerProps } from './ViewActivityDrawer.types'

export function parseDate(str: string): Date {
  return new Date(`${str}, 2026`)
}

export function fmt(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function buildActivities(props: ViewActivityDrawerProps): Activity[] {
  const { patient, appointmentDate, appointmentTime, appointmentType, formType, status, bookedOn, insuranceProvider, sentVia } = props
  const activities: Activity[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const appt = appointmentDate ? parseDate(appointmentDate) : null
  const formSentDate = appt ? new Date(appt.getTime() - 7 * 86400000) : null
  const formWasSent = formSentDate ? formSentDate <= today : false
  const providerName = insuranceProvider ?? 'Insurance'
  const channel = sentVia === 'email' ? 'Email' : 'SMS'

  activities.push({
    id: '1',
    type: 'booked',
    title: `${patient} booked an appointment for '${appointmentType ?? 'Consultation'}'`,
    subtitle: appointmentDate
      ? `Scheduled date: ${appointmentDate}  •  Scheduled time: ${appointmentTime ?? 'TBD'}`
      : undefined,
    date: bookedOn ? `${bookedOn}, 2026` : '',
  })

  activities.push({
    id: '2',
    type: 'check',
    title: 'Insurance verification initiated',
    subtitle: `${providerName} verification started`,
    date: bookedOn ? `${bookedOn}, 2026` : '',
  })

  if (formWasSent && formSentDate) {
    activities.push({
      id: '3',
      type: 'form-sent',
      title: 'Intake form sent',
      subtitle: `${formType ?? 'New patient'} forms sent via ${channel}`,
      date: fmt(formSentDate),
    })
  }

  if (formWasSent && appt) {
    const t3 = new Date(appt.getTime() - 3 * 86400000)
    if (t3 <= today) {
      activities.push({
        id: '4',
        type: 'reminder',
        title: 'Intake form reminder sent',
        subtitle: `Reminder sent via SMS on ${fmt(t3)}`,
        date: fmt(t3),
      })
    }

    if (status === 'Overdue' || status === 'Completed') {
      activities.push({
        id: '5',
        type: 'check',
        title: 'Insurance verified',
        subtitle: `${providerName} verified`,
        date: fmt(t3),
      })
    }

    const t2 = new Date(appt.getTime() - 2 * 86400000)
    if (t2 <= today) {
      activities.push({
        id: '6',
        type: 'reminder',
        title: 'Follow-up reminder sent',
        subtitle: `Reminder sent via SMS on ${fmt(t2)}`,
        date: fmt(t2),
      })
    }

    const t1 = new Date(appt.getTime() - 1 * 86400000)
    if (t1 <= today) {
      activities.push({
        id: '7',
        type: 'reminder',
        title: 'Intake reminder sent',
        subtitle: `Reminder sent via SMS on ${fmt(t1)}`,
        date: fmt(t1),
      })
    }
  }

  if (status === 'Completed' && appt) {
    activities.push({
      id: '8',
      type: 'completed',
      title: 'Intake form completed',
      actionLabel: 'View form',
      date: appointmentDate ? `${appointmentDate}, 2026` : '',
    })
  }

  return activities
}

export function ActivityIcon({ type }: { type: ActivityType }) {
  const iconNode: Partial<Record<ActivityType, React.ReactNode>> = {
    booked:      <Calendar className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />,
    check:       <Check className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />,
    'form-sent': <Mail className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />,
    reminder:    <Bell className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />,
    completed:   <Check className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />,
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface">
      {iconNode[type] ?? <Circle className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />}
    </div>
  )
}

export function ActivityRow({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex gap-md">
      <div className="flex flex-col items-center">
        <ActivityIcon type={activity.type} />
        {!isLast && <div className="mt-xs w-px flex-1 bg-border" />}
      </div>
      <div className={`flex flex-1 items-start justify-between gap-lg ${isLast ? 'pb-0' : 'pb-2xl'}`}>
        <div className="flex flex-col gap-xs">
          <span className="text-body text-text-primary">{activity.title}</span>
          {activity.subtitle && (
            <span className="text-small text-text-secondary">{activity.subtitle}</span>
          )}
          {activity.actionLabel && (
            <Link
              as="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-fit items-center gap-xs text-small"
            >
              {expanded ? 'Hide details' : activity.actionLabel}
              {expanded
                ? <ChevronUp className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                : <ChevronDown className="size-4" strokeWidth={1.6} absoluteStrokeWidth />}
            </Link>
          )}
        </div>
        <span className="shrink-0 text-small text-text-secondary">{activity.date}</span>
      </div>
    </div>
  )
}
