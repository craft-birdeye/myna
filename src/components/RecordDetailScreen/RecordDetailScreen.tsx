import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Tabs } from '../Tabs/Tabs'
import { AccordionSection, FieldRow } from '../QuickViewDrawer/patientSections'
import { ActivityRow } from '../ViewActivityDrawer/activityUtils'
import { RecordDetailScreenProps } from './RecordDetailScreen.types'
import aiIcon from '../../assets/ai-icon.svg'
import iconInbox from '../../assets/icon-inbox.svg'
import iconMail from '../../assets/icon-mail.svg'
import iconWhatsapp from '../../assets/icon-whatsapp.svg'
import iconSparkle from '../../assets/icon-sparkle.svg'

export function RecordDetailScreen({ name, accordions, metrics, activities }: RecordDetailScreenProps) {
  const [activeActivityTab, setActiveActivityTab] = useState('all-activity')
  const [activitySearch, setActivitySearch] = useState('')

  const q = activitySearch.trim().toLowerCase()
  const visibleActivities = q
    ? activities.filter(
        (a) => a.title.toLowerCase().includes(q) || (a.subtitle ?? '').toLowerCase().includes(q),
      )
    : activities

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — floating card */}
        <div className="w-[30%] shrink-0 overflow-y-auto bg-white p-lg">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">

            {/* Header — avatar + name + actions */}
            <div className="flex flex-col items-center px-lg py-xl">
              <div className="flex size-16 items-center justify-center rounded-full bg-chip-success-bg text-lg text-chip-success-text">
                {initials}
              </div>
              <span className="mt-sm text-h3 text-text-primary">{name}</span>
              <div className="mt-sm flex items-center gap-xs">
                <button type="button" className="flex size-8 items-center justify-center rounded-sm border border-border hover:bg-surface-hover" style={{ color: '#303030' }}>
                  <Icon name="send" size={18} />
                </button>
                <button type="button" className="flex size-8 items-center justify-center rounded-sm border border-border hover:bg-surface-hover">
                  <img src={iconInbox} alt="SMS" className="size-[18px]" style={{ filter: 'brightness(0) invert(18.8%)' }} />
                </button>
                <button type="button" className="flex size-8 items-center justify-center rounded-sm border border-border hover:bg-surface-hover">
                  <img src={iconMail} alt="Email" className="size-[18px]" style={{ filter: 'brightness(0) invert(18.8%)' }} />
                </button>
                <button type="button" className="flex size-8 items-center justify-center rounded-sm border border-border hover:bg-surface-hover">
                  <img src={iconWhatsapp} alt="WhatsApp" className="size-4" style={{ filter: 'brightness(0) invert(18.8%)' }} />
                </button>
                <button type="button" className="flex size-8 items-center justify-center rounded-sm border border-border hover:bg-surface-hover" style={{ color: '#303030' }}>
                  <Icon name="more_vert" size={18} />
                </button>
              </div>
            </div>

            {/* Collapsible accordions */}
            {accordions.map((accordion, i) => (
              <AccordionSection key={accordion.title} title={accordion.title} defaultOpen={accordion.defaultOpen} isFirst={i === 0}>
                {accordion.fields.map((field) => (
                  <FieldRow key={field.label} label={field.label} value={field.value} />
                ))}
              </AccordionSection>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col overflow-y-auto">

          {/* AI Summary banner */}
          <div className="mx-lg mt-lg flex items-center justify-between rounded-sm border border-[#c5b3f5] bg-[#f5f0ff] px-lg py-[10px]">
            <div className="flex items-center gap-sm">
              <img src={aiIcon} alt="AI" className="size-5 shrink-0" />
              <span className="text-body text-text-primary">Get insights and actions for {name}</span>
            </div>
            <button
              type="button"
              className="flex h-8 shrink-0 items-center rounded-sm bg-[#6834B7] px-md text-body text-white hover:bg-[#5a2c9e]"
            >
              Generate summary
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-lg px-lg">
            <Tabs
              tabs={[
                { id: 'all-activity',  label: 'All activity' },
                { id: 'feedback',      label: 'Feedback' },
                { id: 'communication', label: 'Communication' },
                { id: 'appointments',  label: 'Appointments' },
                { id: 'intelligence',  label: 'Intelligence', icon: <img src={iconSparkle} alt="" className="size-[13px]" /> },
              ]}
              activeTab={activeActivityTab}
              onChange={setActiveActivityTab}
            />
          </div>

          {/* Metric tiles */}
          <div className="mx-lg mt-lg grid grid-cols-4 gap-sm">
            {metrics.map((m, i) => (
              <div key={i} className="rounded-sm border border-border px-lg py-md">
                <p className="text-xl text-text-primary">{m.value || '—'}</p>
                <p className="mt-xs text-small text-text-secondary">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="mx-lg mt-lg flex items-center gap-sm">
            <div className="flex flex-1 items-center gap-xs rounded-sm border border-border px-md py-[7px]">
              <Icon name="search" size={16} className="shrink-0 text-text-icon" />
              <input
                type="text"
                placeholder="Search"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
              />
              {activitySearch && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setActivitySearch('')}
                  className="shrink-0 text-text-icon hover:text-text-primary"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="flex h-9 items-center gap-xs rounded-sm border border-border px-md text-body text-text-primary hover:bg-surface-l2"
            >
              All time
              <Icon name="expand_more" size={16} className="text-text-icon" />
            </button>
            <button
              type="button"
              className="flex h-9 items-center gap-xs rounded-sm border border-border px-md text-body text-text-primary hover:bg-surface-l2"
            >
              All entities
              <Icon name="expand_more" size={16} className="text-text-icon" />
            </button>
          </div>

          {/* Activity timeline */}
          <div className="mx-lg mt-lg pb-xl">
            {visibleActivities.length ? (
              visibleActivities.map((activity, i) => (
                <ActivityRow key={activity.id} activity={activity} isLast={i === visibleActivities.length - 1} />
              ))
            ) : (
              <p className="text-body text-text-secondary">No activity yet.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
