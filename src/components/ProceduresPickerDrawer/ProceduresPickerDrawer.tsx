import { useEffect, useState } from 'react'
import { ProcedurePickerDetailView } from './ProcedurePickerDetailView'
import {
  buildProcedureDetailDraft,
  createNewProcedureDraft,
  NEW_PROCEDURE_ID,
  type ProcedureDetailDraft,
} from './procedurePickerDetailData'
import type { ProcedurePickerItem, ProceduresPickerDrawerProps } from './ProceduresPickerDrawer.types'

type DrawerView = 'detail' | 'create'

function slugifyId(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `procedure-${Date.now()}`
}

export function ProceduresPickerDrawer({
  open,
  procedures,
  selectedIds,
  initialDetailId = null,
  readOnly = false,
  onClose,
  onSave,
  onCreateProcedure,
  onProcedureCreated,
  closeOnCreateCancel = false,
}: ProceduresPickerDrawerProps) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds)
  const [view, setView] = useState<DrawerView>('create')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [detailDrafts, setDetailDrafts] = useState<Record<string, ProcedureDetailDraft>>({})
  const [createDraft, setCreateDraft] = useState<ProcedureDetailDraft>(createNewProcedureDraft)
  // Bumped every time a fresh create session starts, forcing ProcedurePickerDetailView
  // to remount instead of reusing its stale internal `local` state from the last save.
  const [createSessionId, setCreateSessionId] = useState(0)

  // This drawer only ever opens directly into a specific procedure's detail
  // view or the create-new form — there is no intermediate browse/list view.
  useEffect(() => {
    if (!open) return

    setDraftIds(selectedIds)
    setCreateDraft(createNewProcedureDraft())

    if (initialDetailId) {
      const procedure = procedures.find((p) => p.id === initialDetailId)
      if (procedure) {
        setDetailDrafts((current) => ({
          ...current,
          [initialDetailId]:
            current[initialDetailId] ??
            buildProcedureDetailDraft(initialDetailId, procedure.title),
        }))
        setViewingId(initialDetailId)
        setView('detail')
        return
      }
      // Requested procedure no longer exists — nothing valid to show.
      onClose()
      return
    }

    setView('create')
    setViewingId(null)
    setDetailDrafts({})
    setCreateSessionId((id) => id + 1)
  }, [open, selectedIds, initialDetailId, procedures, onClose])

  const viewingProcedure = viewingId
    ? procedures.find((p) => p.id === viewingId)
    : undefined

  const activeDetailDraft = viewingId
    ? detailDrafts[viewingId] ??
      (viewingProcedure
        ? buildProcedureDetailDraft(viewingId, viewingProcedure.title)
        : null)
    : null

  const isDirectEditEntry = Boolean(initialDetailId)

  const exitDetailView = () => {
    onClose()
  }

  const saveDetail = (draft: ProcedureDetailDraft) => {
    setDetailDrafts((current) => ({ ...current, [draft.id]: draft }))
    exitDetailView()
  }

  const saveCreate = (draft: ProcedureDetailDraft) => {
    const title = draft.name.trim()
    const description =
      draft.whenToUse.trim().split(/[.!?]/)[0].trim() || title
    const existingIds = new Set(procedures.map((p) => p.id))
    let id = slugifyId(title)
    if (existingIds.has(id)) {
      id = `${id}-${Date.now()}`
    }

    const procedure: ProcedurePickerItem = { id, title, description }
    onCreateProcedure?.(procedure)
    setDetailDrafts((current) => ({
      ...current,
      [id]: { ...draft, id, name: title },
    }))
    onSave(draftIds.includes(id) ? draftIds : [...draftIds, id])
    onProcedureCreated?.(title, Boolean(draft.addToLibrary))
    onClose()
  }

  const handleOverlayClick = () => {
    if (view === 'detail' && isDirectEditEntry) {
      onClose()
      return
    }
    onClose()
  }

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={handleOverlayClick}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-[650px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {view === 'create' ? (
          <ProcedurePickerDetailView
            key={`${NEW_PROCEDURE_ID}-${createSessionId}`}
            draft={createDraft}
            isNew
            onBack={onClose}
            onSave={saveCreate}
            onCancel={closeOnCreateCancel ? onClose : undefined}
          />
        ) : activeDetailDraft ? (
          <ProcedurePickerDetailView
            key={viewingId}
            draft={activeDetailDraft}
            readOnly={readOnly}
            onBack={exitDetailView}
            onSave={saveDetail}
          />
        ) : null}
      </aside>
    </div>
  )
}
