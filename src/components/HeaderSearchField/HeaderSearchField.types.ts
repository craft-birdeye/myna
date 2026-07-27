export interface HeaderSearchFieldProps {
  open: boolean
  value: string
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
  placeholder?: string
}
