import { useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { Icon } from '../Icon/Icon'
import { FigmaIconSettings } from '../l1Icons'
import type { IconRailProps, RailGroup, RailNavItem } from './IconRail.types'

// Rail is 52px wide. Icon container is 24px.
// Centering: (52 - 24) / 2 = 14px padding on each side.
const RAIL_ICON_PX = 14

// ─── Overflow layout computation ─────────────────────────────────────────────

interface OverflowEntry {
  item: RailNavItem
  groupLabel?: string
}

function _computeRaw(groups: RailGroup[], budget: number) {
  let rem = budget
  const visibleGroups: RailGroup[] = []
  const overflow: OverflowEntry[] = []
  let hasOverflow = false

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    const overhead = (gi > 0 ? 21 : 0) + (group.header ? 6 : 0)
    // separator: my-xs box (9) + its own gap-slot (6) + outer group gap (6) ≈ 21
    // header: collapses to ~0 height until hover (grid-rows-[0fr]) — only its gap-slot (6) counts

    const visible: RailNavItem[] = []
    if (!hasOverflow && rem - overhead >= 42) {
      // Only pay for the separator/header once we know at least one item will actually fit —
      // otherwise we'd burn budget on chrome for a group that ends up entirely in overflow.
      rem -= overhead
      for (const item of group.items) {
        if (!hasOverflow && rem >= 42) {
          rem -= 42  // h-9 (36) + gap-[6px] (6)
          visible.push(item)
        } else {
          hasOverflow = true
          overflow.push({ item, groupLabel: group.header })
        }
      }
    } else {
      hasOverflow = true
      for (const item of group.items) {
        overflow.push({ item, groupLabel: group.header })
      }
    }
    if (visible.length > 0) {
      visibleGroups.push({ ...group, items: visible })
    }
  }

  return { visibleGroups, overflow, hasOverflow }
}

function computeLayout(groups: RailGroup[], containerHeight: number) {
  const padding = 12  // py-[6px] top + bottom
  // First pass: try without reserving space for ... button
  const first = _computeRaw(groups, containerHeight - padding)
  if (!first.hasOverflow) return first
  // Second pass: reserve 42px for the ... button
  return _computeRaw(groups, containerHeight - padding - 42)
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

function NavTab({
  item,
  active,
  onSelect,
  grouped = false,
}: {
  item: RailNavItem
  active: boolean
  onSelect?: (id: string) => void
  grouped?: boolean
}) {
  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      onClick={() => onSelect?.(item.id)}
      style={{ paddingLeft: grouped ? 12 : RAIL_ICON_PX, paddingRight: grouped ? 12 : RAIL_ICON_PX }}
      className="group/navtab relative flex h-9 w-full items-center rounded-sm"
    >
      {/* Row highlight — inset 8px each side so hover and selected share the same gutter. */}
      <span
        className={`pointer-events-none absolute inset-y-0 left-2 right-2 rounded-sm transition-colors ${
          active
            ? 'bg-surface-selected-l1 opacity-0 group-hover:opacity-100'
            : 'group-hover/navtab:bg-black/[0.04]'
        }`}
      />
      {/* Icon — 28px pill in collapsed state */}
      <span className={`relative flex size-7 shrink-0 items-center justify-center rounded-sm transition-colors text-text-icon ${
        active ? 'bg-surface-selected-l1 group-hover:bg-transparent' : ''
      }`}>
        {item.kind === 'element' ? (
          item.icon
        ) : item.kind === 'image' ? (
          <img src={item.icon as string} alt="" className="size-[18px]" />
        ) : (
          <Icon name={item.icon as string} size={18} />
        )}
      </span>
      {/* Label */}
      <span className="relative ml-[10px] min-w-0 flex-1 truncate text-left text-body text-text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {item.label}
      </span>
      {item.badge && (
        <span className="ai-gradient-badge flex shrink-0 items-center justify-center px-sm text-[10px] leading-[14px] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <span className="ai-gradient-badge-text">{item.badge}</span>
        </span>
      )}
    </button>
  )
}

// ─── BottomIconButton ─────────────────────────────────────────────────────────

function BottomIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{ paddingLeft: RAIL_ICON_PX, paddingRight: RAIL_ICON_PX }}
      className={`flex h-9 w-full items-center rounded-sm transition-colors ${
        active ? '' : 'hover:bg-black/[0.04]'
      }`}
    >
      <span className={`relative flex size-7 shrink-0 items-center justify-center rounded-sm transition-colors text-text-icon ${
        active ? 'bg-surface-selected-l1 group-hover:bg-transparent' : ''
      }`}>
        {active && (
          <span className="pointer-events-none absolute inset-0 rounded-sm bg-surface-selected-l1 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        )}
        {children}
      </span>
      <span className="relative ml-[10px] min-w-0 flex-1 truncate text-left text-body text-text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </button>
  )
}

// ─── ProfileDropdown ──────────────────────────────────────────────────────────

function ProfileDropdown({
  initials,
  avatarUrl,
  userName,
  userEmail,
  expandOnHover,
  onExpandOnHoverChange,
  onAction,
  onClose,
}: {
  initials: string
  avatarUrl?: string
  userName: string
  userEmail: string
  expandOnHover: boolean
  onExpandOnHoverChange: (v: boolean) => void
  onAction: (action: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const menuItems = [
    { id: 'my-profile',           label: 'My profile'          },
    { id: 'shared-by-me',         label: 'Shared by me'        },
    { id: 'scheduled-deliveries', label: 'Scheduled deliveries' },
    { id: 'settings',             label: 'Settings'            },
    { id: 'keyboard-shortcuts',   label: 'Keyboard shortcuts'  },
  ]

  return (
    <div
      ref={ref}
      className="absolute bottom-2 left-[56px] z-[60] w-[280px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
    >
      {/* User header */}
      <div className="flex items-center gap-sm px-md py-sm">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" />
          ) : (
            <span className="text-[13px] text-text-secondary">{initials}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body text-text-primary">{userName}</p>
          <p className="truncate text-small text-text-tertiary">{userEmail}</p>
        </div>
      </div>

      <div className="my-xs h-px bg-border" />

      {/* Menu items */}
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => { onAction(item.id); onClose() }}
          className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
        >
          {item.label}
        </button>
      ))}

      <div className="my-xs h-px bg-border" />

      {/* Expand sidebar on hover toggle */}
      <div className="flex items-center justify-between px-md py-sm">
        <span className="text-body text-text-primary">Expand sidebar on hover</span>
        {/* Toggle pill — w-9=36px, thumb h-4 w-4=16px, 2px inset each side */}
        <button
          type="button"
          role="switch"
          aria-checked={expandOnHover}
          onClick={() => onExpandOnHoverChange(!expandOnHover)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            expandOnHover ? 'bg-primary' : 'bg-black/20'
          }`}
        >
          <span
            className={`absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              expandOnHover ? 'translate-x-[16px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Switch appearance */}
      <button
        type="button"
        onClick={() => { onAction('switch-appearance'); onClose() }}
        className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
      >
        Switch appearance
      </button>

      <div className="my-xs h-px bg-border" />

      {/* Sign out */}
      <button
        type="button"
        onClick={() => { onAction('sign-out'); onClose() }}
        className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
      >
        Sign out
      </button>
    </div>
  )
}

// ─── OverflowFlyout ───────────────────────────────────────────────────────────

function OverflowFlyout({
  items,
  activeId,
  onSelect,
  onClose,
  bottomOffset,
}: {
  items: OverflowEntry[]
  activeId: string
  onSelect?: (id: string) => void
  onClose: () => void
  bottomOffset: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Group overflow items by their groupLabel
  const grouped: { label?: string; items: RailNavItem[] }[] = []
  let currentGroup: { label?: string; items: RailNavItem[] } | null = null

  for (const entry of items) {
    if (!currentGroup || currentGroup.label !== entry.groupLabel) {
      currentGroup = { label: entry.groupLabel, items: [] }
      grouped.push(currentGroup)
    }
    currentGroup.items.push(entry.item)
  }

  return (
    <div
      ref={ref}
      className="absolute left-[56px] z-[60] w-[220px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
      style={{ bottom: bottomOffset }}
    >
      {grouped.map((g, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="my-xs h-px bg-border" />}
          {g.label && (
            <p className="px-md pb-xs pt-xs text-small text-text-tertiary">{g.label}</p>
          )}
          {g.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onSelect?.(item.id); onClose() }}
              className={`flex w-full items-center gap-sm px-md py-sm text-left text-body transition-colors hover:bg-surface-hover ${
                item.id === activeId ? 'text-primary' : 'text-text-primary'
              }`}
            >
              <span className={`flex size-5 shrink-0 items-center justify-center ${
                item.id === activeId ? 'text-primary' : 'text-text-icon'
              }`}>
                {item.kind === 'element' ? (
                  item.icon
                ) : item.kind === 'image' ? (
                  <img src={item.icon as string} alt="" className="size-[18px]" />
                ) : (
                  <Icon name={item.icon as string} size={18} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── IconRail ─────────────────────────────────────────────────────────────────

export function IconRail({
  logoSrc,
  brand,
  groups,
  activeId,
  onSelect,
  products,
  activeProduct,
  onProductChange,
  initials = 'HR',
  avatarUrl,
  userName = 'John Doe',
  userEmail = 'john.doe@example.com',
  expandOnHover = true,
  onExpandOnHoverChange,
  onProfileAction,
}: IconRailProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [containerHeight, setContainerHeight] = useState(9999)
  const [dotsBtnBottom, setDotsBtnBottom] = useState(0)

  const switcherRef = useRef<HTMLDivElement>(null)
  const navContainerRef = useRef<HTMLDivElement>(null)
  const dotsBtnRef = useRef<HTMLButtonElement>(null)

  // Observe nav items container height
  useEffect(() => {
    const el = navContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height)
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  // Close product switcher on outside click
  useEffect(() => {
    if (!switcherOpen) return
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [switcherOpen])

  // Compute which items to show and which overflow
  const { visibleGroups, overflow, hasOverflow } = computeLayout(groups, containerHeight)

  // Position the overflow flyout relative to the ... button
  function handleDotsClick() {
    if (dotsBtnRef.current) {
      const railEl = dotsBtnRef.current.closest('.icon-rail-outer') as HTMLElement | null
      const btnRect = dotsBtnRef.current.getBoundingClientRect()
      const railRect = railEl?.getBoundingClientRect()
      const bottomFromRailBottom = railRect
        ? railRect.bottom - btnRect.bottom + 4
        : 40
      setDotsBtnBottom(bottomFromRailBottom)
    }
    setOverflowOpen(o => !o)
  }

  const isExpanding = expandOnHover

  return (
    <div className={`icon-rail-outer ${isExpanding ? 'group' : ''} relative h-full w-[52px] shrink-0 overflow-visible`}>
      <nav
        className={`absolute inset-y-0 left-0 z-[70] flex flex-col overflow-hidden bg-surface-shell transition-[left,width,background-color,box-shadow] duration-200 ${
          isExpanding ? 'w-[52px] hover:left-2 hover:w-[260px] hover:rounded-lg hover:bg-surface hover:shadow-dropdown' : 'w-[52px]'
        }`}
      >
        {/* ── Logo / product switcher ── */}
        <div className="relative h-[52px] shrink-0" ref={switcherRef}>
          <button
            type="button"
            onClick={() => products && products.length > 0 && setSwitcherOpen(o => !o)}
            aria-label="Switch product"
            className="flex h-full w-full items-center gap-md px-[12px] transition-colors hover:bg-black/5"
          >
            <img src={logoSrc} alt="" className="size-7 shrink-0" />
            {/* No chevron — dropdown is hidden until clicked, giving no visual cue */}
            <span className="flex min-w-0 flex-1 items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <span className="truncate text-h3 text-text-primary">Birdeye</span>
            </span>
          </button>

          {switcherOpen && products && (
            <div className="absolute left-0 top-[56px] z-[50] min-w-[220px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
              <p className="px-md pb-xs pt-xs text-small text-text-tertiary">Switch product</p>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onProductChange?.(p.id); setSwitcherOpen(false) }}
                  className="flex w-full items-center gap-xs px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                >
                  <span className="flex size-5 items-center justify-center">
                    {p.id === activeProduct
                      ? <Icon name="check" size={18} className="text-primary" />
                      : <span className="size-[18px]" />
                    }
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main nav items ── */}
        {/* ── COLLAPSED: visible groups + More button (hidden when rail is hovered-open) ── */}
        <div
          ref={navContainerRef}
          className="l1-rail-nav flex flex-1 flex-col gap-[6px] overflow-hidden py-[6px] group-hover:hidden"
        >
          {visibleGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-[6px]">
              {group.header && (
                <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                  <div
                    className="flex min-h-0 items-center overflow-hidden"
                    style={{ paddingLeft: RAIL_ICON_PX, paddingRight: RAIL_ICON_PX }}
                  >
                    <p className="min-w-0 truncate text-[10px] font-normal uppercase tracking-widest text-text-muted">
                      {group.header}
                    </p>
                  </div>
                </div>
              )}
              {group.items.map((item) => (
                <NavTab key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
              ))}
            </div>
          ))}
          {hasOverflow && (
            <button
              ref={dotsBtnRef}
              type="button"
              title="More"
              aria-label="More modules"
              onClick={handleDotsClick}
              style={{ paddingLeft: RAIL_ICON_PX, paddingRight: RAIL_ICON_PX }}
              className="flex h-9 w-full items-center gap-[10px] rounded-sm transition-colors hover:bg-black/[0.04]"
            >
              <span className="flex size-6 shrink-0 items-center justify-center text-text-icon">
                <Icon name="more_horiz" size={18} />
              </span>
            </button>
          )}
        </div>

        {/* ── EXPANDED: all groups, scrollable, no More button (shown only when hovered-open) ── */}
        <div className="l1-rail-nav hidden flex-1 flex-col gap-[6px] overflow-y-auto py-[6px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden group-hover:flex">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-[6px]">
              {group.header && (
                <div className="grid grid-rows-[1fr]">
                  <div
                    className="flex min-h-0 items-center overflow-hidden"
                    style={{ paddingLeft: RAIL_ICON_PX, paddingRight: RAIL_ICON_PX }}
                  >
                    <p className="min-w-0 truncate text-[10px] font-normal uppercase tracking-widest text-text-muted">
                      {group.header}
                    </p>
                  </div>
                </div>
              )}
              {group.items.map((item) => (
                <NavTab key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
              ))}
            </div>
          ))}
        </div>

        {/* ── Bottom — Settings, Help, Profile ── */}
        <div className="l1-rail-nav flex shrink-0 flex-col gap-[6px] py-[6px]">
          <BottomIconButton
            label="Settings"
            active={activeId === 'settings'}
            onClick={() => onSelect?.('settings')}
          >
            <FigmaIconSettings size={18} />
          </BottomIconButton>

          <BottomIconButton label="Help">
            <CircleHelp size={18} strokeWidth={1.5} />
          </BottomIconButton>

          {/* Profile button */}
          <button
            type="button"
            title="Profile"
            aria-label="Profile"
            onClick={() => setProfileOpen(o => !o)}
            style={{ paddingLeft: RAIL_ICON_PX, paddingRight: RAIL_ICON_PX }}
            className="flex h-9 w-full items-center transition-colors hover:bg-black/[0.04]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-6 rounded-full object-cover" />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-black/10 text-[11px] text-text-secondary">
                  {initials}
                </span>
              )}
            </span>
            <span className="relative ml-[10px] min-w-0 flex-1 truncate text-left text-body text-text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* ── Profile dropdown — outside nav to escape overflow-hidden ── */}
      {profileOpen && (
        <ProfileDropdown
          initials={initials}
          avatarUrl={avatarUrl}
          userName={userName}
          userEmail={userEmail}
          expandOnHover={expandOnHover}
          onExpandOnHoverChange={(v) => {
            onExpandOnHoverChange?.(v)
          }}
          onAction={(action) => {
            onProfileAction?.(action)
          }}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* ── Overflow flyout — outside nav to escape overflow-hidden ── */}
      {overflowOpen && hasOverflow && (
        <OverflowFlyout
          items={overflow}
          activeId={activeId}
          onSelect={onSelect}
          onClose={() => setOverflowOpen(false)}
          bottomOffset={dotsBtnBottom}
        />
      )}
    </div>
  )
}
