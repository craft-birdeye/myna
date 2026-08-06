export interface LanguageOption {
  id: string
  label: string
  countryCode: string
}

export interface LanguageSelectMenuProps {
  options: LanguageOption[]
  /** Single-select: currently selected id. Ignored when multi is true. */
  value?: string
  /** Multi-select: currently selected ids. */
  values?: string[]
  multi?: boolean
  onSelect?: (id: string) => void
  onChange?: (ids: string[]) => void
  className?: string
}
