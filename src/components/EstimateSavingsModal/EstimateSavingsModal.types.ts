export type SavingsMode = 'time' | 'cost'

export interface EstimateSavingsValues {
  mode: SavingsMode
  minutesPerResolution: number
  wageCurrency: string
  hourlyWage: number
}

/** Per-agent copy. Every field defaults to the Front desk wording, so existing callers are
 *  unaffected; Review response agents pass their own "Configure" strings. */
export interface EstimateSavingsCopy {
  title?: string
  subtitle?: string
  /** Label on the minutes row. */
  timeLabel?: string
  wageLabel?: string
  wageCaption?: string
  saveLabel?: string
}

export interface EstimateSavingsModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: EstimateSavingsValues) => void
  initialValues: EstimateSavingsValues
  copy?: EstimateSavingsCopy
}
