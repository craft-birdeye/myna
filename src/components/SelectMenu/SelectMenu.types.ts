export interface SelectOption {
  value: string
  label: string
  /** When true, shows a trailing chevron (submenu / drill-in affordance). */
  showChevron?: boolean
}

export interface SelectMenuProps {
  options: SelectOption[]
  /** Currently selected values. */
  value: string[]
  /** Optional field label shown above options (filter panel pattern). */
  title?: string
  /** Multi-select (checkboxes + All + Apply) vs single-select. */
  multi?: boolean
  searchable?: boolean
  onChange: (value: string[]) => void
  /** Multi-select only — fired when the Apply button is pressed. */
  onApply?: () => void
}
