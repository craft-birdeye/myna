export interface BookingTemplateSelectOption {
  id: string
  name: string
}

export interface BookingTemplateSelectFieldProps {
  label?: string
  description?: string
  /** Selected template id, or '' for "None". */
  value: string
  onChange: (id: string) => void
  templates: BookingTemplateSelectOption[]
  /** Placeholder shown for the "no template" option — omit to hide the option entirely. */
  noneLabel?: string
  /** Renders an "Edit template" link with a redirect icon below the field when a template is selected. */
  onEditTemplate?: (templateId: string) => void
  /** Fills the parent's width instead of capping at 420px (e.g. to match a plain settings field). */
  fullWidth?: boolean
}
