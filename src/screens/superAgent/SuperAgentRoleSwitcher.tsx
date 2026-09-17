import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SUPER_AGENT_ROLES } from './superAgentSeedData'
import { SuperAgentRoleOrgChartModal } from './SuperAgentRoleOrgChartModal'
import { RolePersonAvatar } from './RolePersonAvatar'

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
        aria-label="Switch role"
        className="flex h-[30px] max-w-[220px] items-center gap-xs rounded-md bg-surface-l2 pl-xs pr-sm transition-colors hover:bg-surface-selected"
      >
        <RolePersonAvatar roleId={activeRole.id} size={22} />
        <span className="min-w-0 truncate text-body text-text-primary">{activeRole.title}</span>
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
