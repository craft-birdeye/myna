import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SUPER_AGENT_ROLES } from './superAgentSeedData'
import { SuperAgentRoleOrgChartModal } from './SuperAgentRoleOrgChartModal'

export interface SuperAgentRoleSwitcherProps {
  value: string
  onChange: (roleId: string) => void
}

export function SuperAgentRoleSwitcher({ value, onChange }: SuperAgentRoleSwitcherProps) {
  const [orgChartOpen, setOrgChartOpen] = useState(false)

  const activeRole = SUPER_AGENT_ROLES.find((r) => r.id === value) ?? SUPER_AGENT_ROLES[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOrgChartOpen(true)}
        className="flex w-full items-center gap-sm rounded-sm border border-border-selected bg-surface px-md py-sm text-left hover:bg-surface-l2"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body text-text-primary">{activeRole.title}</span>
          <span className="block truncate text-small text-text-tertiary">{activeRole.org}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>

      <SuperAgentRoleOrgChartModal
        open={orgChartOpen}
        value={value}
        onSelect={onChange}
        onClose={() => setOrgChartOpen(false)}
      />
    </div>
  )
}
