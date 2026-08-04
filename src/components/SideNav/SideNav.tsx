import { useEffect, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { NavLeaf, NavSection, SideNavProps } from './SideNav.types'

function findSectionIdForItem(sections: NavSection[], itemId: string): string | null {
  return sections.find((section) => section.items?.some((item) => item.id === itemId))?.id ?? null
}

function defaultExpandedSection(sections: NavSection[], activeId: string): string {
  return (
    findSectionIdForItem(sections, activeId)
    ?? sections.find((section) => section.id === 'human-actions')?.id
    ?? sections[0]?.id
    ?? ''
  )
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
      {leaf.external && <Icon name="open_in_new" size={16} className="shrink-0 text-text-icon" />}
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
        section.items?.map((leaf) => (
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

export function SideNav({ title, sections, activeId, onSelect, actionSlot }: SideNavProps) {
  const [expandedId, setExpandedId] = useState(() => defaultExpandedSection(sections, activeId))

  useEffect(() => {
    const sectionId = findSectionIdForItem(sections, activeId)
    if (sectionId) {
      setExpandedId(sectionId)
    }
  }, [activeId, sections])

  const selectItem = (id: string) => {
    const sectionId = findSectionIdForItem(sections, id)
    if (sectionId) {
      setExpandedId(sectionId)
    }
    onSelect?.(id)
  }

  const handleSectionHeaderClick = (section: NavSection) => {
    if (section.items?.[0]) {
      selectItem(section.items[0].id)
      return
    }
    setExpandedId(section.id)
  }

  return (
    <aside className="flex h-full w-[222px] flex-col border-r border-border bg-surface-l2">
      <div className="flex h-[52px] shrink-0 flex-col justify-center px-2xl">
        <h1 className="text-h3 text-text-primary">{title}</h1>
      </div>
      {actionSlot}
      <nav className="flex flex-1 flex-col gap-xs overflow-y-auto px-lg py-sm">
        {sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            activeId={activeId}
            expanded={expandedId === section.id}
            onHeaderClick={() => handleSectionHeaderClick(section)}
            onSelect={selectItem}
          />
        ))}
      </nav>
    </aside>
  )
}
