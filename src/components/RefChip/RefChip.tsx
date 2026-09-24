import { X } from 'lucide-react'
import type { RefKind } from '../../data/procedureData'
import type { RefChipProps } from './RefChip.types'
// Reuse the workflow editor's variable-field chip styling verbatim so
// procedure Tools/Context chips look identical to the workflow chips.
import styles from '../../workflow/Molecules/Inputs/VariableChip/VariableChip.module.css'
import { DataTypeIcon } from '../../workflow/Molecules/Inputs/VariableChip/VariableChip'

// Map a procedure RefKind onto a workflow VariableChip type suffix
// (matches the `.chip*`/`.swatch*`/`.icon*` classes in VariableChip.module.css).
// `icon: null` → render the blue bracket DataTypeIcon (the "variable" swatch).
const KIND_MAP: Record<RefKind, { suffix: string; icon: string | null }> = {
  context: { suffix: '', icon: null }, // variable — blue brackets swatch
  tool: { suffix: 'Tool', icon: 'build' },
  file: { suffix: 'Attachment', icon: 'attach_file' },
  link: { suffix: 'Link', icon: 'link' },
  subagent: { suffix: 'Address', icon: 'hub' },
  procedure: { suffix: 'Product', icon: 'menu_book' },
}

export function RefChip({ kind, label, onRemove, className = '' }: RefChipProps) {
  const { suffix, icon } = KIND_MAP[kind]
  const chipClass = [styles.chip, suffix && styles[`chip${suffix}`], className].filter(Boolean).join(' ')
  const swatchClass = [styles.chipSwatch, suffix && styles[`swatch${suffix}`]].filter(Boolean).join(' ')

  return (
    <span className={chipClass} style={{ verticalAlign: 'middle' }}>
      <span className={swatchClass}>
        {icon ? (
          <span className={`material-symbols-outlined ${styles[`icon${suffix}`] ?? ''}`}>{icon}</span>
        ) : (
          <DataTypeIcon />
        )}
      </span>
      <span className={`${styles.chipLabel} ${styles.chipLabelReadOnly}`}>{label}</span>
      {onRemove && (
        <button
          type="button"
          className={styles.deleteBtn}
          aria-label={`Remove ${label}`}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        >
          <X className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      )}
    </span>
  )
}
