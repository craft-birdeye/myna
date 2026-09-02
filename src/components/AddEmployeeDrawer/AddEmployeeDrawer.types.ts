export interface AddEmployeeValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
}

export interface AddEmployeeDrawerProps {
  open: boolean
  onClose: () => void
  onAdd: (values: AddEmployeeValues) => void
}
