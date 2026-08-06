export type SavingsMode = 'time' | 'cost'

export interface EstimateSavingsValues {
  mode: SavingsMode
  minutesPerResolution: number
  wageCurrency: string
  hourlyWage: number
}

export interface EstimateSavingsModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: EstimateSavingsValues) => void
  initialValues: EstimateSavingsValues
}
