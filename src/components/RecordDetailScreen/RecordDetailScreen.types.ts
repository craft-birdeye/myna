import type { Activity } from '../ViewActivityDrawer/ViewActivityDrawer.types'

export interface RecordDetailField {
  label: string
  value?: string
}

export interface RecordDetailAccordion {
  title: string
  fields: RecordDetailField[]
  defaultOpen?: boolean
}

export interface RecordDetailMetric {
  value: string
  label: string
}

export interface RecordDetailScreenProps {
  name: string
  accordions: RecordDetailAccordion[]
  metrics: RecordDetailMetric[]
  activities: Activity[]
}
