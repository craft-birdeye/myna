export type ContextModalTab = 'Fields' | 'Knowledge' | 'Brand' | 'Industry'

export interface ContextField {
  id: number
  name: string
  description: string
  source: string
  group: string
  sampleData: string
  anonymize: boolean
  showInOutput: boolean
  enabled: boolean
}

export interface ContextKnowledgeFile {
  id: number
  name: string
}

export interface ContextKnowledgeLink {
  id: number
  url: string
}

export interface ContextBrandItem {
  id: number
  name: string
  description: string
  enabled: boolean
}

export interface ContextModalResult {
  fields: ContextField[]
  knowledge: { files: ContextKnowledgeFile[]; links: ContextKnowledgeLink[] }
  brandItems: ContextBrandItem[]
  industryEnabled: boolean
}

export interface ContextModalProps {
  open: boolean
  onClose: () => void
  onSave: (result: ContextModalResult) => void
  /** Stack above nested drawers (default 110). */
  overlayZIndex?: number
  /** Optional docs link shown inline after the subtitle. */
  learnMoreHref?: string
  /** Prefer over href — opens in-app help (e.g. glossary) instead of an external page. */
  onLearnMore?: () => void
  learnMoreLabel?: string
}
