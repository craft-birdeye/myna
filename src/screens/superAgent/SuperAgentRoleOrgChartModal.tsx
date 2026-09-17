import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../components/Icon/Icon'
import { Chip } from '../../components/Chip/Chip'
import type { ChipProps } from '../../components/Chip/Chip.types'
import jayIcon from '@icons/Jay.svg'
import mynaIcon from '@icons/Myna.svg'
import robinIcon from '@icons/Robin.svg'
import {
  SUPER_AGENT_ROLES,
  SUPER_AGENT_LIBRARY_CATEGORIES,
  type SuperAgentRole,
  type SuperAgentPillar,
} from './superAgentSeedData'

export interface SuperAgentRoleOrgChartModalProps {
  open: boolean
  value: string
  onSelect: (roleId: string) => void
  onClose: () => void
}

const PILLAR_ICON: Record<SuperAgentPillar, string> = {
  jay: jayIcon,
  myna: mynaIcon,
  robin: robinIcon,
}

const PILLAR_LABEL: Record<SuperAgentPillar, string> = {
  jay: 'Jay',
  myna: 'Myna',
  robin: 'Robin',
}

const TIER_META: Record<SuperAgentRole['tier'], { label: string; variant: ChipProps['variant'] }> = {
  ic: { label: 'IC', variant: 'neutral' },
  manager: { label: 'Manager', variant: 'info' },
  executive: { label: 'Executive', variant: 'success' },
}

// Distinct-per-person avatar colors, hashed off the name (same approach as
// ChannelPreviewModal's private `humanColor`/`HumanAvatar`, ported here since that
// pair isn't exported for reuse).
const PERSON_COLORS = ['#F79009', '#12B76A', '#4F86F7', '#F97066', '#7A5AF8', '#0BA5EC']

function personColor(name: string): string {
  const hash = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return PERSON_COLORS[hash % PERSON_COLORS.length]
}

function personInitials(name: string): string {
  const words = name.split(' ').filter((w) => w && !w.endsWith('.'))
  const pick = words.length >= 2 ? [words[0], words[words.length - 1]] : words
  return pick.map((w) => w.charAt(0).toUpperCase()).join('') || name.charAt(0).toUpperCase()
}

function PersonAvatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: personColor(name), fontSize: size * 0.4 }}
    >
      {personInitials(name)}
    </span>
  )
}

function buildAccessText(role: SuperAgentRole): string {
  const pillarNames = role.pillars.map((p) => PILLAR_LABEL[p])
  const pillarText = pillarNames.length > 1 ? pillarNames.join(' + ') : pillarNames[0]

  if (role.tier !== 'ic') return `${pillarText} · All agents`

  const scopeLabel = role.libraryCategories
    ?.map((cat) => SUPER_AGENT_LIBRARY_CATEGORIES.find((c) => c.key === cat)?.label)
    .filter((label): label is string => Boolean(label))
    .join(', ')

  return `${pillarText} · ${scopeLabel ? `${scopeLabel} agents only` : 'Scoped agents only'}`
}

function NodeCard({
  role,
  selected,
  onSelect,
}: {
  role: SuperAgentRole
  selected: boolean
  onSelect: (roleId: string) => void
}) {
  const tierMeta = TIER_META[role.tier]
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={`flex w-[248px] flex-col items-stretch gap-xs rounded-md border p-md text-left transition-colors ${
        selected ? 'border-primary bg-surface-selected' : 'border-border-selected bg-surface hover:bg-surface-l2'
      }`}
    >
      <div className="flex min-w-0 items-center gap-sm">
        <PersonAvatar name={role.personName} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body text-text-primary">{role.title}</span>
          <span className="block truncate text-small text-text-tertiary">{role.personName}</span>
        </span>
      </div>
      <div>
        <Chip label={tierMeta.label} variant={tierMeta.variant} />
      </div>
      <div className="flex min-w-0 items-center gap-xs pt-xs">
        {role.pillars.map((p) => (
          <img key={p} src={PILLAR_ICON[p]} alt="" className="size-4 shrink-0" />
        ))}
        <span className="min-w-0 flex-1 truncate text-small text-text-tertiary">{buildAccessText(role)}</span>
      </div>
    </button>
  )
}

// Vertical connector stub between a node and the row below it.
function Drop() {
  return <div className="h-lg w-px shrink-0 bg-border-strong" />
}

// A tier row: a horizontal bar (border-t) spanning the row, with each child
// getting its own vertical drop from that bar down to its card. Not pixel-exact,
// but reads clearly as "these nodes share a parent above."
function ChartRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex gap-xl border-t border-border-strong">
      {children}
    </div>
  )
}

function Branch({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-lg pt-lg">
      {children}
    </div>
  )
}

export function SuperAgentRoleOrgChartModal({ open, value, onSelect, onClose }: SuperAgentRoleOrgChartModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSelect(roleId: string) {
    onSelect(roleId)
    onClose()
  }

  const executives = SUPER_AGENT_ROLES.filter((r) => r.tier === 'executive')
  const managers = SUPER_AGENT_ROLES.filter((r) => r.tier === 'manager')
  const ics = SUPER_AGENT_ROLES.filter((r) => r.tier === 'ic')

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center" aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-org-chart-title"
        className="relative flex max-h-[calc(100vh-130px)] w-full max-w-[960px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl py-md">
          <h2 id="role-org-chart-title" className="text-body text-text-primary">
            Aspen Dental — org & access
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto px-2xl pb-2xl">
          {/* Executive tier */}
          <div className="flex gap-xl">
            {executives.map((exec) => (
              <NodeCard key={exec.id} role={exec} selected={exec.id === value} onSelect={handleSelect} />
            ))}
          </div>

          <Drop />

          {/* Manager tier, each with its own IC branch below */}
          <ChartRow>
            {managers.map((mgr) => {
              const mgrIcs = ics.filter((ic) => ic.reportsTo === mgr.id)
              return (
                <Branch key={mgr.id}>
                  <NodeCard role={mgr} selected={mgr.id === value} onSelect={handleSelect} />
                  {mgrIcs.length > 0 && (
                    <>
                      <Drop />
                      <ChartRow>
                        {mgrIcs.map((ic) => (
                          <Branch key={ic.id}>
                            <NodeCard role={ic} selected={ic.id === value} onSelect={handleSelect} />
                          </Branch>
                        ))}
                      </ChartRow>
                    </>
                  )}
                </Branch>
              )
            })}
          </ChartRow>
        </div>
      </div>
    </div>,
    document.body,
  )
}
