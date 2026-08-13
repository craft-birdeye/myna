export type SavingsMode = 'time' | 'cost'

export interface EstimateSavingsValues {
  mode: SavingsMode
  timePerUnitMins: number
  currency: string
  hourlyWage: number
}

export interface EstimateSavingsModalProps {
  open: boolean
  values: EstimateSavingsValues
  /** e.g. 'session' or 'conversation' — inflects the "Time saved per {unit}" field label. */
  unitLabel: string
  onClose: () => void
  onSave: (values: EstimateSavingsValues) => void
}
