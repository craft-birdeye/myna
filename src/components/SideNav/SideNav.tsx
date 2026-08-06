import { useEffect, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { NavLeaf, NavSection, SideNavProps } from './SideNav.types'

function findSectionIdForItem(sections: NavSection[], itemId: string): string | null {
  for (const section of sections) {
    if (section.id === itemId && section.items === undefined) return section.id
    if (section.items?.some((item) => item.id === itemId)) return section.id
  }
  return null
}

function initialExpanded(sections: NavSection[], activeId: string, multiExpand: boolean): Set<string> {
  const ids = new Set<string>()
  const activeSection = findSectionIdForItem(sections, activeId)
  if (activeSection) ids.add(activeSection)
  if (multiExpand) {
    for (const section of sections) {
      if (section.defaultExpanded) ids.add(section.id)
    }
  }
  if (ids.size === 0) {
    const fallback =
      sections.find((section) => section.id === 'human-actions' || section.id === 'actions')?.id
      ?? sections.find((section) => section.items !== undefined)?.id
    if (fallback) ids.add(fallback)
  }
  return ids
}

function LeafRow({
  leaf,
  active,
  onSelect,
}: {
  leaf: NavLeaf
  active: boolean
  onSelect?: (id: string) => void
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect?.(leaf.id)}
      className={`flex h-7 w-full items-center gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
        active ? 'bg-surface-selected' : 'hover:bg-surface-selected'
      }`}
    >
      <span className={`min-w-0 flex-1 truncate text-body font-light ${leaf.strikethrough ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
        {leaf.label}
      </span>
      {leaf.badge && (
        <span className="shrink-0 text-body font-light text-text-tertiary">{leaf.badge}</span>
      )}
      {leaf.external && <Icon name="open_in_new" size={16} className="shrink-0 text-text-icon" />}
    </button>
  )
}

function FlatLeaf({
  section,
  active,
  onSelect,
}: {
  section: NavSection
  active: boolean
  onSelect?: (id: string) => void
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect?.(section.id)}
      className={`flex h-7 w-full items-center justify-between gap-sm rounded-sm px-sm py-[6px] text-left transition-colors ${
        active ? 'bg-surface-selected' : 'hover:bg-surface-selected'
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-body text-text-primary">{section.label}</span>
      {section.external && <Icon name="open_in_new" size={16} className="shrink-0 text-text-icon" />}
    </button>
  )
}

function Section({
  section,
  activeId,
  expanded,
  onHeaderClick,
  onSelect,
}: {
  section: NavSection
  activeId: string
  expanded: boolean
  onHeaderClick: () => void
  onSelect?: (id: string) => void
}) {
  if (section.items === undefined) {
    return <FlatLeaf section={section} active={section.id === activeId} onSelect={onSelect} />
  }

  return (
    <div className="flex flex-col gap-xs">
      <button
        type="button"
        onClick={onHeaderClick}
        className="flex h-7 w-full items-center justify-between gap-sm rounded-sm px-sm py-[6px] hover:bg-surface-selected"
      >
        <span className="text-body text-text-primary">{section.label}</span>
        <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} className="text-text-icon" />
      </button>

      {expanded &&
        section.items.map((leaf) => (
          <LeafRow
            key={leaf.id}
            leaf={leaf}
            active={leaf.id === activeId}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}

export function SideNav({
  title,
  sections,
  activeId,
  onSelect,
  ctaLabel,
  onCtaClick,
  multiExpand = false,
}: SideNavProps) {
  const [expandedIds, setExpandedIds] = useState(() => initialExpanded(sections, activeId, multiExpand))

  useEffect(() => {
    const sectionId = findSectionIdForItem(sections, activeId)
    if (!sectionId) return
    setExpandedIds((prev) => {
      if (multiExpand) {
        if (prev.has(sectionId)) return prev
        const next = new Set(prev)
        next.add(sectionId)
        return next
      }
      return new Set([sectionId])
    })
  }, [activeId, sections, multiExpand])

  const selectItem = (id: string) => {
    const sectionId = findSectionIdForItem(sections, id)
    if (sectionId) {
      setExpandedIds((prev) => {
        if (multiExpand) {
          const next = new Set(prev)
          next.add(sectionId)
          return next
        }
        return new Set([sectionId])
      })
    }
    onSelect?.(id)
  }

  const handleSectionHeaderClick = (section: NavSection) => {
    if (multiExpand) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(section.id)) next.delete(section.id)
        else next.add(section.id)
        return next
      })
      return
    }
    if (section.items?.[0]) {
      selectItem(section.items[0].id)
      return
    }
    setExpandedIds(new Set([section.id]))
  }

  return (
    <aside className="flex h-full w-[222px] flex-col border-r border-border bg-surface-l2">
      <div className="flex h-[52px] shrink-0 flex-col justify-center px-2xl">
        <h1 className="text-h3 text-text-primary">{title}</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-xs overflow-y-auto px-lg py-sm">
        {ctaLabel && (
          <button
            type="button"
            onClick={onCtaClick}
            className="flex h-7 w-full shrink-0 items-center gap-sm rounded-sm px-sm py-xs hover:bg-surface-selected"
          >
            <span className="min-w-0 flex-1 truncate text-left text-body text-text-primary">{ctaLabel}</span>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Icon name="add" size={14} className="text-white" />
            </span>
          </button>
        )}
        {sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            activeId={activeId}
            expanded={expandedIds.has(section.id)}
            onHeaderClick={() => handleSectionHeaderClick(section)}
            onSelect={selectItem}
          />
        ))}
      </nav>
    </aside>
  )
}
