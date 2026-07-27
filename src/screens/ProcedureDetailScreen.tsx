import { useCallback, useMemo, useState } from 'react'
import { TopNav, Icon, ContextModal } from '../components'
import type { ContextModalResult } from '../components/ContextModal/ContextModal.types'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import ProcedureDetailBody, { ChipSection, parseStepsText as parseRichStepsText } from '../workflow/Organisms/Panels/RHS/ProcedureDetailBody.jsx'
import AddToolDrawer from '../workflow/Organisms/Drawers/AddToolDrawer/AddToolDrawer'
import {
  type Procedure,
  type ProcedureStep,
  type ContextItem,
  type ProcedureQueue,
  type Token,
} from '../data/procedureData'
import { useProcedureStore } from '../data/ProcedureStoreContext'

/** Splits a bullet/title's flat markup text into plain-string and {{chip}} tokens. */
function textToTokens(text: string): Token[] {
  const parts = text.split(/(\{\{[^}]+\}\})/g).filter(Boolean)
  return parts.map((part) => {
    const m = part.match(/^\{\{(.+)\}\}$/)
    return m ? { kind: 'context', label: m[1] } : part
  })
}

function parseStepsText(text: string): ProcedureStep[] {
  return parseRichStepsText(text).map((step: { title: string; bullets: { text: string; indent: number; ordered: boolean }[] }) => ({
    title: step.title,
    bullets: step.bullets.map((b) => ({
      tokens: textToTokens(b.text),
      indent: b.indent,
      ordered: b.ordered,
    })),
  }))
}

function stepsToEditorText(steps: ProcedureStep[]): string {
  return steps
    .map((step, i) => {
      const bullets = step.bullets
        .map((b) => {
          const content = b.tokens
            .map((t) => (typeof t === 'string' ? t : `{{${t.label}}}`))
            .join('')
          if (!content.trim()) return ''
          const indent = Math.min(b.indent ?? 0, 2)
          const marker = b.ordered ? '1.' : '•'
          return `${'\t'.repeat(indent)}${marker} ${content.trim()}`
        })
        .filter(Boolean)
        .join('\n')
      return bullets ? `${i + 1}. ${step.title}\n${bullets}` : `${i + 1}. ${step.title}`
    })
    .join('\n')
}

function contextToChips(context: ContextItem[]): { value: string; type: string }[] {
  const kindMap: Record<ContextItem['kind'], string> = {
    context: 'variable',
    file: 'attachment',
    link: 'link',
  }
  return context.map((c) => ({ value: c.label, type: kindMap[c.kind] || 'variable' }))
}

function chipsToContext(chips: { value: string; type: string }[]): ContextItem[] {
  const typeMap: Record<string, ContextItem['kind']> = {
    variable: 'context',
    attachment: 'file',
    link: 'link',
    file: 'file',
  }
  return chips.map((c) => ({
    kind: typeMap[c.type] ?? 'context',
    label: c.value,
  }))
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

interface ProcedureFormState {
  id: string
  name: string
  whenToUse: string
  whenToExit: string
  contextChips: { value: string; type: string }[]
  moreContextCount: number
  stepsText: string
  procedureType: ProcedureQueue
}

interface ProcedureDetailScreenProps {
  /** null = create a new procedure. */
  procedure: Procedure | null
  onBack: () => void
  onSaved?: (isNew: boolean) => void
  product?: string
}

export function ProcedureDetailScreen({
  procedure,
  onBack,
  onSaved,
  product = 'automotive',
}: ProcedureDetailScreenProps) {
  const { addProcedure, updateProcedure, deleteProcedure } = useProcedureStore()
  const isNew = procedure === null
  const isHC = product === 'healthcare' || product === 'dental'
  const defaultCategory = isHC ? 'Healthcare Frontdesk' : 'Inbound General'

  const initialStepsText = useMemo(
    () => stepsToEditorText(procedure?.steps ?? []),
    [procedure],
  )

  const [local, setLocal] = useState<ProcedureFormState>(() => ({
    id: procedure?.id ?? `__new-${Date.now()}`,
    name: procedure?.name ?? '',
    whenToUse: procedure?.whenToUse ?? '',
    whenToExit: procedure?.whenToExit ?? '',
    contextChips: contextToChips(procedure?.context ?? []),
    moreContextCount: 0,
    stepsText: initialStepsText,
    procedureType: procedure?.queue ?? 'Inbound',
  }))
  const [actionsOpen, setActionsOpen] = useState(false)
  const [contextModalOpen, setContextModalOpen] = useState(false)
  const [toolPickerOpen, setToolPickerOpen] = useState(false)

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setLocal((current) => ({ ...current, [field]: value }))
  }, [])

  const handleContextSave = (result: ContextModalResult) => {
    const chips = contextModalResultToChips(result)
    setLocal((current) => ({
      ...current,
      contextChips: [...current.contextChips, ...chips],
      moreContextCount: 0,
    }))
    setContextModalOpen(false)
  }

  function handleSave() {
    const now = new Date()
    const context = chipsToContext(local.contextChips)
    const saved: Procedure = {
      id: isNew ? `p-${Date.now()}` : procedure!.id,
      name: local.name.trim() || 'Untitled procedure',
      category: procedure?.category ?? defaultCategory,
      queue: local.procedureType,
      channels: procedure?.channels ?? [],
      description:
        local.whenToUse.trim().split(/[.!?]/)[0].trim() || local.name.trim() || 'No description',
      lastEdited: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      whenToUse: local.whenToUse.trim(),
      whenToExit: local.whenToExit.trim(),
      steps: parseStepsText(local.stepsText),
      tools: procedure?.tools ?? [],
      context,
    }
    if (isNew) {
      addProcedure(saved)
    } else {
      updateProcedure(saved)
    }
    onSaved?.(isNew)
    onBack()
  }

  function handleDelete() {
    if (procedure) deleteProcedure(procedure.id)
    setActionsOpen(false)
    onBack()
  }

  const dirty = isNew
    ? Boolean(
        local.name.trim() ||
          local.whenToUse.trim() ||
          local.whenToExit.trim() ||
          local.stepsText.trim() ||
          local.contextChips.length,
      )
    : local.name !== procedure?.name ||
      local.whenToUse !== procedure?.whenToUse ||
      local.whenToExit !== (procedure?.whenToExit ?? '') ||
      local.procedureType !== (procedure?.queue ?? 'Inbound') ||
      local.stepsText !== initialStepsText ||
      local.contextChips.length !== (procedure?.context.length ?? 0)

  const canSave = dirty && Boolean(local.name.trim() && local.stepsText.trim())

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex-1 overflow-auto bg-surface">
        {/* Header — sticky while the form body scrolls */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-surface px-2xl py-xl">
          <div className="flex min-w-0 items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover"
            >
              <BackArrowIcon color="#555" />
            </button>
            <h1 className="truncate text-h3 text-text-primary">
              {isNew ? 'New procedure' : procedure.name}
            </h1>
          </div>

          <div className="flex items-center gap-sm">
            {isNew ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-sm px-md py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
              >
                Cancel
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  aria-label="More actions"
                  aria-expanded={actionsOpen}
                  onClick={() => setActionsOpen((o) => !o)}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon transition-colors hover:bg-surface-l2"
                >
                  <Icon name="more_vert" size={20} />
                </button>
                {actionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[105]"
                      onClick={() => setActionsOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                      <button
                        type="button"
                        className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={!canSave}
              onClick={canSave ? handleSave : undefined}
              className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                canSave
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              Save
            </button>
          </div>
        </div>

        {/* Body — same ProcedureDetailBody as the procedure drawer, Context in its own right column */}
        <div className="flex gap-2xl px-2xl pb-2xl pt-md">
          <div className="flex min-w-0 flex-1 flex-col">
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
              onFieldChange={handleFieldChange}
              viewOnly={false}
              showTitle
              showTypeField
              contextEditable
              hideContext
              isNewProcedure={isNew}
              onAddContext={() => setContextModalOpen(true)}
              // allowJs infers default `= undefined` as the only prop type
              {...({ onOpenToolDrawer: () => setToolPickerOpen(true) } as object)}
            />
          </div>

          <div className="w-[400px] shrink-0">
            <ChipSection
              label="Context"
              chips={local.contextChips}
              onChange={(next: { value: string; type: string }[]) =>
                handleFieldChange('contextChips', next)
              }
              defaultType="variable"
              viewOnly={false}
              moreCount={local.moreContextCount}
              chipsReadOnly={false}
              libraryContextStyle
              tooltip="Uses your brand voice, industry knowledge, to generate accurate responses"
              onAddContext={() => setContextModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <ContextModal
        open={contextModalOpen}
        onClose={() => setContextModalOpen(false)}
        onSave={handleContextSave}
      />

      <AddToolDrawer
        isOpen={toolPickerOpen}
        onClose={() => setToolPickerOpen(false)}
        onSelectTool={() => {}}
        product={product}
        activeNavId="frontdesk"
      />
    </div>
  )
}
