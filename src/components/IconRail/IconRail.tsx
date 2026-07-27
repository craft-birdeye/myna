import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { IconRailProps, RailNavItem } from './IconRail.types'

function NavTab({
  item,
  active,
  onSelect,
}: {
  item: RailNavItem
  active: boolean
  onSelect?: (id: string) => void
}) {
  return (
    <button
      type="button"
      title={item.label}
      aria-label={item.label}
      onClick={() => onSelect?.(item.id)}
      className={`flex h-7 w-full items-center gap-lg rounded-sm px-xs transition-colors ${
        active ? 'bg-surface-selected-l1' : 'hover:bg-surface-hover'
      }`}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {item.kind === 'image' ? (
          <img src={item.icon} alt="" className="size-5" />
        ) : (
          <Icon name={item.icon} size={20} className="text-text-icon" />
        )}
      </span>

      <span className="min-w-0 flex-1 truncate text-left text-body text-text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {item.label}
      </span>

      {item.badge && (
        <span className="flex h-5 shrink-0 items-center justify-center rounded-sm bg-accent-positive px-sm text-[10px] leading-[18px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {item.badge}
        </span>
      )}
    </button>
  )
}

export function IconRail({ logoSrc, brand, groups, activeId, onSelect, products, activeProduct, onProductChange }: IconRailProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

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

  return (
    // Reserve the collapsed width in layout; the nav itself overlays and grows on hover.
    <div className="relative h-full w-14 shrink-0">
      <nav className="group absolute inset-y-0 left-0 z-[45] flex w-14 flex-col overflow-hidden border-r border-border bg-surface-selected transition-[width,box-shadow] duration-200 hover:w-[262px] hover:shadow-dropdown">
        {/* Logo + wordmark header */}
        <div className="relative h-[52px] shrink-0" ref={switcherRef}>
          <button
            type="button"
            onClick={() => products && products.length > 0 && setSwitcherOpen(o => !o)}
            aria-label="Switch product"
            className="flex h-full w-full items-center gap-md px-[14px] transition-colors hover:bg-surface-hover"
          >
            <img src={logoSrc} alt="" className="size-7 shrink-0" />

            <span className="flex min-w-0 flex-1 items-center gap-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <span className="truncate text-h3 text-text-primary">{brand}</span>
              <Icon
                name={switcherOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                size={18}
                className="shrink-0 text-text-secondary"
              />
            </span>
          </button>

          {/* Product switcher popover */}
          {switcherOpen && products && (
            <div className="absolute left-0 top-[56px] z-[50] min-w-[220px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
              <p className="px-md pb-xs pt-xs text-small text-text-tertiary">Switch product</p>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onProductChange?.(p.id); setSwitcherOpen(false) }}
                  className="flex w-full items-center gap-sm px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
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

        {/* Main nav */}
        <div className="flex flex-1 flex-col gap-sm overflow-y-auto overflow-x-hidden px-[14px] py-sm">
          {groups.map((group, gi) => (
            <div key={group.id} className="flex flex-col gap-sm">
              {gi > 0 && <span className="h-px w-full bg-surface-selected-l1" />}

              {group.header && (
                <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                  <p className="min-h-0 overflow-hidden truncate px-xs text-small text-text-tertiary">
                    {group.header}
                  </p>
                </div>
              )}

              {group.items.map((item) => (
                <NavTab
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}
