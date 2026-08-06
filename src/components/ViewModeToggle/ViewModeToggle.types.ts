export type ViewMode = 'conversations' | 'sessions'

export interface NounForms {
  capPlural: string
  capSingular: string
  lowPlural: string
  lowSingular: string
}

export interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}
