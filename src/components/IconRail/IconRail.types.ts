import type React from 'react'

export interface RailNavItem {
  id: string
  label: string
  /**
   * A Material Symbols ligature name (kind='symbol'), an imported SVG/image URL
   * (kind='image'), or a React element (kind='element').
   */
  icon: string | React.ReactNode
  kind?: 'symbol' | 'image' | 'element'
  /** Optional badge text (e.g. "New"). */
  badge?: string
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
  /** Initials shown in the avatar at the bottom of the rail. */
  initials?: string
  /** Avatar image URL; falls back to initials circle. */
  avatarUrl?: string
  /** Display name shown in the profile dropdown header. */
  userName?: string
  /** Email shown in the profile dropdown header. */
  userEmail?: string
  /**
   * When true (default), the rail expands to 260px on hover.
   * When false, the rail stays collapsed at 52px.
   */
  expandOnHover?: boolean
  /** Called when the user toggles "Expand sidebar on hover" in the profile dropdown. */
  onExpandOnHoverChange?: (value: boolean) => void
  /** Called when the user clicks a profile menu action (e.g. 'sign-out', 'settings'). */
  onProfileAction?: (action: string) => void
}
