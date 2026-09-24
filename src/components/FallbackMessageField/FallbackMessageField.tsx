import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { FallbackMessageFieldProps } from './FallbackMessageField.types'
import FieldPickerModal from '../../workflow/Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx'
import { VariableIcon } from '../../workflow/Molecules/Inputs/PromptToolbarIcons.jsx'

const FIELD_BORDER_CLASS =
  'rounded-sm border border-border-input transition-colors duration-150 focus:border-primary focus:outline-none focus-visible:border-primary'

type Part = { type: 'text'; value: string } | { type: 'token'; label: string }

function parseValue(value: string): Part[] {
  const parts: Part[] = []
  for (const part of value.split(/(\{[^}]+\})/g)) {
    if (!part) continue
    if (part.startsWith('{') && part.endsWith('}')) {
      parts.push({ type: 'token', label: part.slice(1, -1) })
    } else {
      parts.push({ type: 'text', value: part })
    }
  }
  if (parts.length === 0) parts.push({ type: 'text', value: '' })
  return parts
}

function serialize(parts: Part[], trailingText: string): string {
  return `${parts.map((p) => (p.type === 'token' ? `{${p.label}}` : p.value)).join('')}${trailingText}`
}

function valueToEditorState(value: string) {
  const parts = parseValue(value)
  const last = parts[parts.length - 1]
  if (last?.type === 'text') {
    return { leadingParts: parts.slice(0, -1), currentText: last.value }
  }
  return { leadingParts: parts, currentText: '' }
}

function formatChipLabel(label: string): string {
  return label
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function tokenFromField(field: string): string {
  if (field.includes('Business.name') || field.toLowerCase().includes('business name')) return 'Business Name'
  if (field.includes('Business.phone') || field.toLowerCase().includes('phone')) return 'Business Phone'
  return field.replace(/[{}]/g, '')
}

function TokenChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="mx-[1px] inline-flex h-[22px] items-center gap-xs rounded-sm bg-chip-neutral-bg px-sm align-baseline text-small text-chip-neutral-text">
      {formatChipLabel(label)}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-text-icon hover:text-text-primary"
        >
          <Icon name="close" size={12} />
        </button>
      )}
    </span>
  )
}

export function FallbackMessageField({
  label,
  value,
  onChange,
  maxChars,
  readOnly = false,
}: FallbackMessageFieldProps) {
  const [{ leadingParts, currentText }, setEditorState] = useState(() => valueToEditorState(value))
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const variableBtnRef = useRef<HTMLButtonElement>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    syncingRef.current = true
    setEditorState(valueToEditorState(value))
    syncingRef.current = false
  }, [value])

  function emit(nextLeading: Part[], nextCurrent: string) {
    if (syncingRef.current) return
    onChange(serialize(nextLeading, nextCurrent).slice(0, maxChars))
  }

  function handleTextChange(text: string) {
    const clipped = text.slice(0, maxChars - serialize(leadingParts, '').length)
    setEditorState((prev) => ({ ...prev, currentText: clipped }))
    emit(leadingParts, clipped)
  }

  function insertToken(field: string) {
    const tokenLabel = tokenFromField(field)
    const nextLeading: Part[] = [
      ...leadingParts,
      ...(currentText ? [{ type: 'text' as const, value: currentText }] : []),
      { type: 'token', label: tokenLabel },
    ]
    setEditorState({ leadingParts: nextLeading, currentText: '' })
    emit(nextLeading, '')
    textareaRef.current?.focus()
  }

  function removeToken(index: number) {
    const nextLeading = leadingParts.filter((_, i) => i !== index)
    setEditorState((prev) => ({ ...prev, leadingParts: nextLeading }))
    emit(nextLeading, currentText)
  }

  const inlineTextareaClass =
    'inline-block min-w-[2px] resize-none border-0 bg-transparent align-baseline text-body leading-[1.7] text-text-primary outline-none'

  if (readOnly) {
    const parts = parseValue(value)
    return (
      <div className="flex flex-col gap-xs">
        {label && <span className="text-small text-text-secondary">{label}</span>}
        <div className={`bg-surface px-md py-sm text-body leading-[1.7] text-text-secondary ${FIELD_BORDER_CLASS}`}>
          {parts.map((part, i) =>
            part.type === 'token' ? (
              <TokenChip key={`${i}-${part.label}`} label={part.label} />
            ) : (
              <span key={`text-${i}`}>{part.value}</span>
            ),
          )}
        </div>
      </div>
    )
  }

  const trailingWidth = Math.max(24, Math.min(currentText.length * 7.5 + 12, 480))
  const trailingMultiline = currentText.length > 48 || currentText.includes('\n')

  return (
    <div className="flex flex-col gap-xs">
      {label && <span className="text-small text-text-secondary">{label}</span>}
      <div
        ref={containerRef}
        className={`overflow-hidden bg-surface ${FIELD_BORDER_CLASS} focus-within:border-primary`}
        onClick={() => textareaRef.current?.focus()}
      >
        <div className="min-h-[72px] cursor-text whitespace-pre-wrap px-md py-sm text-body leading-[1.7] text-text-primary">
          {leadingParts.map((part, i) =>
            part.type === 'token' ? (
              <TokenChip key={`${i}-${part.label}`} label={part.label} onRemove={() => removeToken(i)} />
            ) : (
              <span key={`text-${i}`}>{part.value}</span>
            ),
          )}
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && currentText === '') {
                e.preventDefault()
                if (leadingParts.length > 0) {
                  const nextLeading = leadingParts.slice(0, -1)
                  const removed = leadingParts[leadingParts.length - 1]
                  const restored =
                    removed.type === 'text'
                      ? removed.value
                      : removed.type === 'token'
                        ? `{${removed.label}}`
                        : ''
                  setEditorState({ leadingParts: nextLeading, currentText: restored })
                  emit(nextLeading, restored)
                }
              }
            }}
            rows={trailingMultiline ? 3 : 1}
            style={trailingMultiline ? undefined : { width: `${trailingWidth}px` }}
            className={
              trailingMultiline
                ? 'mt-[1px] block w-full resize-none border-0 bg-transparent text-body leading-[1.7] text-text-primary outline-none'
                : inlineTextareaClass
            }
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center justify-between gap-sm px-sm py-[6px]">
          <button
            ref={variableBtnRef}
            type="button"
            title="Insert variable"
            aria-label="Insert variable"
            aria-expanded={pickerOpen}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              setPickerOpen(true)
            }}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon transition-colors duration-150 hover:bg-surface-hover"
          >
            <VariableIcon />
          </button>
          <span className="text-small text-text-tertiary">
            {value.length}/{maxChars}
          </span>
        </div>
      </div>
      {pickerOpen && (
        <FieldPickerModal
          onClose={() => setPickerOpen(false)}
          onSelectField={(field: string) => {
            insertToken(field)
            setPickerOpen(false)
          }}
          anchorEl={variableBtnRef.current}
        />
      )}
    </div>
  )
}
