export interface NavLeaf {
  id: string
  label: string
  /** Renders an open_in_new icon (external link) after the label. */
  external?: boolean
  /** Renders the label with a strikethrough style. */
  strikethrough?: boolean
  /** Renders the item indented one level, for sub-items. */
  indent?: boolean
}

export interface NavSection {
  id: string
  label: string
  items?: NavLeaf[]
  defaultExpanded?: boolean
}

export interface SideNavProps {
  title: string
  sections: NavSection[]
  activeId: string
  onSelect?: (id: string) => void
  /** Optional content rendered between the title and the accordion sections (e.g. a primary action row). */
  actionSlot?: import('react').ReactNode
}
