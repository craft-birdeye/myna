import type { LibraryCardGlyph, LibraryCardTone } from '../LibraryCardIcon/LibraryCardIcon'
import type { ChipVariant } from '../Chip/Chip.types'

export interface InfoCardProps {
  title: string
  description: string
  /** Hover CTA label (revealed on hover). */
  actionLabel?: string
  onAction?: () => void
  /** Optional secondary hover CTA (e.g. Preview). */
  previewLabel?: string
  onPreview?: () => void
  /** Optional create-library icon chip (matches create-agent landing cards). */
  glyph?: LibraryCardGlyph
  tone?: LibraryCardTone
  /** Optional value-proposition chip shown after the description (always visible, not hover-gated). */
  chipLabel?: string
  chipVariant?: ChipVariant
  /** Extra classes for the chip — overriding one instance without touching the shared variant tokens. */
  chipClassName?: string
  /** Response agents (Sep 1) library only — ~20% shorter card, chip+CTA bottom-anchored as one group. */
  compact?: boolean
}

export interface InfoCardListItemProps {
  title: string
  description: string
  /** Menu CTA label (revealed via row-hover three-dot menu). */
  actionLabel?: string
  onAction?: () => void
  previewLabel?: string
  onPreview?: () => void
  /** Omit top border on the first row. */
  first?: boolean
}

/** Library card layout — fixed height. Hover: AI gradient border, clamp description, reveal CTAs. */
export const INFO_CARD_LAYOUT = {
  root: 'info-card-ai-border group flex h-[192px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface px-lg pb-lg pt-lg transition-[border-color,box-shadow,background-color] hover:border-transparent hover:bg-surface hover:shadow-dropdown',
  title: 'min-w-0 shrink-0 line-clamp-2 text-[16px] leading-6 tracking-[-0.32px] text-text-primary',
  description: 'mt-sm min-w-0 shrink-0 line-clamp-2 text-body text-text-secondary',
  chip: 'mt-sm shrink-0',
  /** Bottom-anchored group (chip + CTA) — mt-auto keeps it flush with the bottom of the fixed card regardless of description length. */
  bottomShell: 'mt-auto flex flex-col',
  /** Collapsed when idle; expands on hover. */
  ctaShell: 'grid grid-rows-[0fr] group-hover:grid-rows-[1fr]',
  ctaInner: 'min-h-0 overflow-hidden',
  ctaWrap: 'flex items-center gap-sm pt-sm',
  cta: 'flex h-9 flex-1 items-center justify-center rounded-sm bg-primary px-lg text-body text-white opacity-0 transition-opacity hover:bg-primary-hover group-hover:opacity-100',
  ctaSecondary:
    'flex h-9 flex-1 items-center justify-center rounded-sm border border-border-strong bg-surface px-lg text-body text-text-primary opacity-0 transition-opacity hover:bg-surface-l2 group-hover:opacity-100',
} as const

/**
 * Response agents (Sep 1) library only — ~20% shorter (h-224 -> h-180) than the standard
 * chip-bearing card. Description gets up to 3 lines (only clamps with an ellipsis if it
 * still doesn't fit). The chip and CTA buttons share one bottom-anchored slot — the chip
 * fades out and the CTAs fade in on hover, so they never stack and never add height.
 */
export const INFO_CARD_LAYOUT_COMPACT = {
  root: 'info-card-ai-border group flex h-[180px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface px-lg pb-md pt-md transition-[border-color,box-shadow,background-color] hover:border-transparent hover:bg-surface hover:shadow-dropdown',
  title: 'min-w-0 shrink-0 line-clamp-2 text-[16px] leading-6 tracking-[-0.32px] text-text-primary',
  description: 'mt-sm min-w-0 flex-1 line-clamp-3 text-body text-text-secondary',
  /** Shared bottom slot — fixed height so the chip <-> CTA swap never shifts card height. */
  bottomSlot: 'relative mt-sm h-8 shrink-0',
  chip: 'absolute inset-0 flex items-center opacity-100 transition-opacity duration-150 group-hover:opacity-0',
  ctaWrap:
    'absolute inset-0 flex items-center justify-end gap-sm pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100',
  cta: 'flex h-8 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-md text-body text-white hover:bg-primary-hover',
  ctaSecondary:
    'flex h-8 items-center justify-center whitespace-nowrap rounded-sm border border-border-strong bg-surface px-md text-body text-text-primary hover:bg-surface-l2',
} as const

/** Library list row — 2-line description, three-dot menu on row hover. */
export const INFO_CARD_LIST_ITEM_LAYOUT = {
  row: 'group/row relative flex items-center gap-lg px-lg py-md transition-colors hover:bg-surface-hover',
  rowActive: 'bg-surface-hover',
  rowDivider: 'border-t border-border',
  body: 'min-w-0 flex-1',
  title: 'text-body text-text-primary',
  description: 'mt-xs line-clamp-2 text-body text-text-secondary',
  menuTrigger: 'flex size-7 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover',
  menu: 'absolute right-lg top-8 z-[110] min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown',
  menuItem: 'block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover',
} as const
