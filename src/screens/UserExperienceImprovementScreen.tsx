import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, TopNav } from '../components'
import { Icon } from '../components/Icon/Icon'

interface DetailCard {
  id: string
  icon: string
  title: string
  description: ReactNode
}

const CARDS: DetailCard[] = [
  {
    id: 'what-we-collect',
    icon: 'database',
    title: 'What we collect',
    description:
      'Feature usage and click patterns, session length and frequency, settings and configuration changes, device and browser details, and performance or error data. Never the content of your reviews, messages, or customer records.',
  },
  {
    id: 'how-we-use-it',
    icon: 'bar_chart',
    title: 'How we use it',
    description:
      'We look for where people get stuck, which features go unused, and where errors cluster. That analysis feeds directly into our bug fix priorities and roadmap decisions.',
  },
  {
    id: 'who-can-see-it',
    icon: 'visibility',
    title: 'Who can see it',
    description:
      "Only our product and engineering teams, working with aggregated or anonymized data. It's never sold, shared with third parties, or used for sales or marketing outreach.",
  },
  {
    id: 'how-to-opt-out',
    icon: 'toggle_off',
    title: 'How to opt out',
    description:
      'Turn off the toggle above at any time. We stop collecting new data immediately — nothing further is gathered from that point on.',
  },
  {
    id: 'retention-and-privacy',
    icon: 'privacy_tip',
    title: 'Retention and privacy',
    description: (
      <>
        Usage data is kept only as long as we need it to act on it, then deleted or folded into anonymized
        aggregates. See the <Link as="button">privacy notice</Link> for full details on how we handle and
        protect it.
      </>
    ),
  },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Share usage data"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-surface-selected'
      }`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ open, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-[72px] z-[201] w-[480px] -translate-x-1/2 rounded-xl bg-surface shadow-modal">
        <div className="px-2xl pt-xl">
          <p className="text-body text-text-primary">Turn off the user experience improvement program?</p>
          <p className="mt-sm text-body text-text-secondary">
            We&apos;ll stop collecting new usage data right away. Data we&apos;ve already collected won&apos;t
            be affected.
          </p>
        </div>
        <div className="flex justify-end gap-sm px-2xl py-xl">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Keep it on
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Turn off
          </button>
        </div>
      </div>
    </>
  )
}

interface UserExperienceImprovementScreenProps {
  onBack: () => void
}

export function UserExperienceImprovementScreen({ onBack }: UserExperienceImprovementScreenProps) {
  const [shareUsageData, setShareUsageData] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)

  function handleToggleChange(next: boolean) {
    if (!next) {
      setConfirmOff(true)
      return
    }
    setShareUsageData(true)
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-xs bg-surface px-2xl pt-lg pb-0">
        <Link as="button" onClick={onBack} className="text-body">
          Settings
        </Link>
        <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
        <Link as="button" onClick={onBack} className="text-body">
          Account
        </Link>
        <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
        <span className="text-body text-text-primary">User experience improvement program</span>
      </div>

      {/* Header */}
      <div className="bg-surface px-2xl py-xl">
        <h1 className="text-h3 text-text-primary">User experience improvement program</h1>
        <p className="mt-xs text-body text-text-secondary">
          Manage whether Birdeye analyzes your usage to improve the product.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-surface px-2xl pb-2xl">
        <div className="flex max-w-[750px] flex-col gap-md pt-xl">
          <div className="flex items-center justify-between gap-lg rounded-sm bg-surface-muted p-lg">
            <span className="text-body text-text-primary">Join User experience improvement program</span>
            <Toggle checked={shareUsageData} onChange={handleToggleChange} />
          </div>

          <div className="flex flex-col rounded-sm bg-surface">
            {CARDS.map((card, i) => (
              <div
                key={card.id}
                className={`flex items-start gap-md p-lg ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#eef2f6]">
                  <Icon name={card.icon} size={20} className="text-text-icon" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body text-text-primary">{card.title}</p>
                  <p className="mt-xs text-small text-text-secondary">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOff}
        onConfirm={() => {
          setShareUsageData(false)
          setConfirmOff(false)
        }}
        onCancel={() => setConfirmOff(false)}
      />
    </div>
  )
}
