import type { SelectOption } from '../SelectMenu/SelectMenu.types'

export interface FilterField {
  id: string
  label: string
  /** Options shown in the select menu when the field is opened. */
  options?: SelectOption[]
  /** Multi-select (default true) vs single-select. */
  multi?: boolean
  /**
   * Override the collapsed button's text based on the current selection (e.g. show the single
   * selected option's own name instead of "{label} (1)"). Falls back to the default
   * "{label}" / "{label} (N)" pattern when omitted.
   */
  formatSelectionLabel?: (selected: string[], options: SelectOption[]) => string
}

export interface FilterPanelProps {
  open: boolean
  fields: FilterField[]
  selections?: Record<string, string[]>
  onSelectionsChange?: (selections: Record<string, string[]>) => void
  onClose?: () => void
  onSaveView?: () => void
  onAdvancedFilters?: () => void
  onSelectionChange?: (selections: Record<string, string[]>) => void
}
