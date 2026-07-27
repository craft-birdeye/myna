import { useCallback, useState } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { Icon } from '../Icon/Icon'
import { ContextModal } from '../ContextModal/ContextModal'
import type { ContextModalResult } from '../ContextModal/ContextModal.types'
import ProcedureDetailBody from '../../workflow/Organisms/Panels/RHS/ProcedureDetailBody.jsx'
import type { ProcedureDetailDraft } from './procedurePickerDetailData'
import styles from './ProceduresPickerDrawer.module.css'

interface ProcedurePickerDetailViewProps {
  draft: ProcedureDetailDraft
  onBack: () => void
  onSave: (draft: ProcedureDetailDraft) => void
  isNew?: boolean
  /** Display-only — hides Save and disables all field edits. */
  readOnly?: boolean
  onCancel?: () => void
}

function contextModalResultToChips(result: ContextModalResult): { value: string; type: string }[] {
  const chips: { value: string; type: string }[] = []
  result.fields
    .filter((f) => f.enabled)
    .forEach((f) => chips.push({ value: f.name.replace(/\s+/g, '.'), type: 'variable' }))
  result.knowledge.files.forEach((f) => chips.push({ value: f.name, type: 'attachment' }))
  result.knowledge.links.forEach((l) => chips.push({ value: l.url, type: 'link' }))
  result.brandItems
    .filter((b) => b.enabled)
    .forEach((b) => chips.push({ value: b.name, type: 'variable' }))
  if (result.industryEnabled) chips.push({ value: 'Industry.context', type: 'variable' })
  return chips
}

export function ProcedurePickerDetailView({
  draft,
  onBack,
  onSave,
  isNew = false,
  readOnly = false,
  onCancel,
}: ProcedurePickerDetailViewProps) {
  const [local, setLocal] = useState(draft)
  const [saveMenuOpen, setSaveMenuOpen] = useState(false)
  const [contextModalOpen, setContextModalOpen] = useState(false)

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    if (readOnly) return
    setLocal((current) => ({ ...current, [field]: value }))
  }, [readOnly])

  const canSave = Boolean(local.name.trim() && local.stepsText.trim())

  const headerTitle = isNew ? 'New procedure' : local.name

  const commitSave = (addToLibrary = false) => {
    if (readOnly || !canSave) return
    onSave({ ...local, addToLibrary })
    setSaveMenuOpen(false)
  }

  const handleContextSave = (result: ContextModalResult) => {
    if (readOnly) return
    const chips = contextModalResultToChips(result)
    setLocal((current) => ({
      ...current,
      contextChips: [...current.contextChips, ...chips],
      moreContextCount: 0,
    }))
    setContextModalOpen(false)
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
        <div className="flex min-w-0 items-center gap-sm">
          {!isNew && (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
          )}
          <h2 className="truncate text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
            {headerTitle}
          </h2>
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-sm">
            {isNew && (
              <button
                type="button"
                onClick={onCancel ?? onBack}
                className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
              >
                Cancel
              </button>
            )}
            <div className="relative">
              <div className="flex h-9 overflow-hidden rounded-sm">
                <button
                  type="button"
                  disabled={!canSave}
                  onClick={() => commitSave(false)}
                  className={`flex h-9 items-center px-lg text-body transition-colors ${
                    canSave
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                  }`}
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={!canSave}
                  aria-label="More save options"
                  aria-expanded={saveMenuOpen}
                  onClick={() => canSave && setSaveMenuOpen((open) => !open)}
                  className={`flex h-9 items-center border-l border-white/30 px-sm transition-colors ${
                    canSave
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                  }`}
                >
                  <Icon name="expand_more" size={16} />
                </button>
              </div>
              {saveMenuOpen && canSave && (
                <>
                  <div
                    className="fixed inset-0 z-[105]"
                    onClick={() => setSaveMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 top-full z-[110] mt-xs min-w-[220px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                    <button
                      type="button"
                      onClick={() => commitSave(true)}
                      className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    >
                      Save and add to library
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.detailBody} flex-1 overflow-y-auto px-2xl pb-2xl`}>
        <div className="w-full max-w-[700px]">
          <ProcedureDetailBody
            initialValues={{
              id: local.id,
              name: local.name,
              whenToUse: local.whenToUse,
              whenToExit: local.whenToExit,
              contextChips: local.contextChips,
              moreContextCount: local.moreContextCount,
              stepsText: local.stepsText,
              procedureType: local.procedureType,
            }}
            onFieldChange={readOnly ? undefined : handleFieldChange}
            viewOnly={readOnly}
            showTitle={true}
            showTypeField
            contextEditable={!readOnly}
            isNewProcedure={isNew}
            onAddContext={readOnly ? undefined : () => setContextModalOpen(true)}
          />
        </div>
      </div>

      {!readOnly && (
        <ContextModal
          open={contextModalOpen}
          onClose={() => setContextModalOpen(false)}
          onSave={handleContextSave}
          overlayZIndex={120}
        />
      )}
    </>
  )
}
