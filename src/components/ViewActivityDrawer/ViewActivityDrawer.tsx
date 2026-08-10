import { ArrowLeft } from 'lucide-react'
import { Link } from '../Link/Link'
import { ViewActivityDrawerProps } from './ViewActivityDrawer.types'
import { buildActivities, ActivityRow } from './activityUtils'

export function ViewActivityDrawer(props: ViewActivityDrawerProps) {
  const { open, patient, onClose, onViewAllDetails } = props
  const activities = buildActivities(props)

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-2 top-2 z-[101] flex h-[calc(100%-16px)] w-[650px] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-2xl py-xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <span className="text-h3 text-text-primary">All activity of {patient}</span>
          </div>
          <Link
            as="button"
            onClick={onViewAllDetails}
            className="text-body"
          >
            View all details
          </Link>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-2xl py-lg">
          {activities.map((activity, i) => (
            <ActivityRow key={activity.id} activity={activity} isLast={i === activities.length - 1} />
          ))}
        </div>
      </div>
    </>
  )
}
