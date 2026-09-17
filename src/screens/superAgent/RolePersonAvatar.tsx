import { SUPER_AGENT_ROLES } from './superAgentSeedData'

// Shared avatar for the org-chart nodes (SuperAgentRoleOrgChartModal) and the collapsed
// role-switcher trigger (SuperAgentRoleSwitcher). Each role has its own real (Pexels,
// free-to-use) stand-in photo — never a real employee's headshot — via `role.photoUrl`.
export function RolePersonAvatar({ roleId, size = 28 }: { roleId: string; size?: number }) {
  const role = SUPER_AGENT_ROLES.find((r) => r.id === roleId)
  if (!role) return null

  // Ask Pexels' own CDN to serve a compressed, avatar-sized crop instead of the full-res
  // original — these render at 22-28px, no reason to ship the full photo.
  const dimension = Math.round(size * 2)
  const avatarSrc = `${role.photoUrl}?auto=compress&cs=tinysrgb&w=${dimension}&h=${dimension}`

  return (
    <img
      src={avatarSrc}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}
