export interface RailNavItem {
  id: string
  label: string
  /** A Material Symbols ligature name, or an imported SVG/image URL when kind === 'image'. */
  icon: string
  kind?: 'symbol' | 'image'
  /** Optional badge text (e.g. "New"). */
  badge?: string
  /** Shows a trailing "open in new" glyph (e.g. Scan listings). */
  external?: boolean
}

export interface RailGroup {
  id: string
  /** Section label shown above the group when expanded. Groups are separated by dividers. */
  header?: string
  items: RailNavItem[]
}

export interface Product {
  id: string
  label: string
}

export interface IconRailProps {
  /** Imported brand logo (SVG/PNG URL) shown in the header cell. */
  logoSrc: string
  /** Brand wordmark shown next to the logo when expanded. */
  brand: string
  groups: RailGroup[]
  activeId: string
  onSelect?: (id: string) => void
  /** Product switcher — list of products to show in the logo popover. */
  products?: Product[]
  /** Currently active product id. */
  activeProduct?: string
  /** Called when the user picks a different product. */
  onProductChange?: (id: string) => void
}
