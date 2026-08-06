export interface ProcedurePickerItem {
  id: string
  title: string
  description: string
}

export interface ProceduresPickerDrawerProps {
  open: boolean
  procedures: ProcedurePickerItem[]
  selectedIds: string[]
  /** When set, the drawer opens directly to this procedure's detail view. Otherwise opens the create sub-view. */
  initialDetailId?: string | null
  /** When true, detail view is display-only — no Save or field edits. */
  readOnly?: boolean
  onClose: () => void
  onSave: (selectedIds: string[]) => void
  onCreateProcedure?: (procedure: ProcedurePickerItem) => void
  /** Fired after a new procedure is successfully created, with its title and whether it was also added to the library. */
  onProcedureCreated?: (title: string, addToLibrary: boolean) => void
  /** When true, cancelling a new-procedure form closes the whole drawer instead of just the sub-view. */
  closeOnCreateCancel?: boolean
}
