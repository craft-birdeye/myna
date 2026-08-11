export interface NavLeaf {
  id: string
  label: string
  /** Renders an open_in_new icon (external link) after the label. */
  external?: boolean
  /** Renders the label with a strikethrough style. */
  strikethrough?: boolean
  /** Renders the item indented one level, for sub-items. */
  indent?: boolean
  /** Optional count/badge shown trailing the label (e.g. "2.4K"). */
  badge?: string
}

export interface NavSection {
  id: string
  label: string
  /**
   * Child items. When omitted, the section renders as a flat selectable row
   * (e.g. Archived / Reports). An empty array still shows an expandable header.
   */
  items?: NavLeaf[]
  defaultExpanded?: boolean
  /** For flat leaf sections (no items): show an external-link icon. */
  external?: boolean
  /** When set, shows the animated AI agents icon next to the section label. */
  badge?: string
}

export interface SideNavProps {
  title: string
  sections: NavSection[]
  activeId: string
  onSelect?: (id: string) => void
  /** Optional top-of-nav CTA row with a circular + button (e.g. "Send review request"). */
  ctaLabel?: string
  onCtaClick?: () => void
  /**
   * When true, multiple sections can stay expanded at once.
   * When false (default), expanding/selecting a section collapses the others.
   */
  multiExpand?: boolean
}
