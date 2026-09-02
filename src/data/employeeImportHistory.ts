export interface EmployeeImportRecord {
  id: string
  fileName: string
  rowsImported: number
  date: string
  importedBy: string
}

export const EMPLOYEE_IMPORT_HISTORY: EmployeeImportRecord[] = [
  { id: '1', fileName: 'Employees_Roster_Aug2026.xlsx', rowsImported: 12, date: 'Aug 31 2026', importedBy: 'Divya Chaturvedi' },
  { id: '2', fileName: 'New_Hires_Batch_07.xlsx', rowsImported: 5, date: 'Aug 25 2026', importedBy: 'Divya Chaturvedi' },
  { id: '3', fileName: 'Employees_Contact_Update.xls', rowsImported: 1, date: 'Aug 18 2026', importedBy: 'Akhil Paul' },
  { id: '4', fileName: 'Employees_Roster_Jul2026.xlsx', rowsImported: 8, date: 'Jul 30 2026', importedBy: 'Divya Chaturvedi' },
]
