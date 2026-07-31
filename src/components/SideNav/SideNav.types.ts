export interface NavLeaf {
  id: string
  label: string
  /** Renders an open_in_new icon (external link) after the label. */
  external?: boolean
  /** Renders the label with a strikethrough style. */
  strikethrough?: boolean
  /** Renders the item indented one level, for sub-items. */
  indent?: boolean
  /** Optional trailing count/badge text (e.g. "2.4K"), shown muted on the right. */
  count?: string
}

export interface NavSection {
  id: string
  label: string
  items?: NavLeaf[]
  defaultExpanded?: boolean
  /** Renders the section as a single standalone link (no header/chevron), selectable via its own id. */
  standalone?: boolean
  /** For standalone sections: renders an open_in_new icon after the label. */
  external?: boolean
}

export interface SideNavProps {
  title: string
  sections: NavSection[]
  activeId: string
  onSelect?: (id: string) => void
  /** Allow more than one section to be expanded at once (default: single-accordion). */
  multiExpand?: boolean
}
