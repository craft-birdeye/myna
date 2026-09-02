export interface FallbackMessageFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  maxChars: number
  readOnly?: boolean
}
