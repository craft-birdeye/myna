import type { FieldType, TemplateField } from '../../data/bookingTemplatesData'

export interface BaseFieldsValue {
  myself: TemplateField[]
  someoneElse: TemplateField[]
}

export interface BaseFieldsEditorProps {
  value: BaseFieldsValue
  onChange: (value: BaseFieldsValue) => void
  /** Inherited from a template — shown grayed, no add/remove controls. */
  readOnly?: boolean
}

export type { FieldType, TemplateField }
